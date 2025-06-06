from rest_framework import serializers
from .models import Farmer, FeedStorage, Order


class FeedStorageSerializer(serializers.ModelSerializer):
    percentage_remaining = serializers.ReadOnlyField()
    is_low_stock = serializers.ReadOnlyField()
    farmer_name = serializers.CharField(source='farmer.name', read_only=True)
    farmer_address = serializers.CharField(source='farmer.address', read_only=True)
    
    class Meta:
        model = FeedStorage
        fields = ['id', 'farmer', 'capacity', 'current_quantity', 'last_reported', 
                  'sensor_id', 'low_stock_threshold', 'percentage_remaining', 
                  'is_low_stock', 'farmer_name', 'farmer_address']
        read_only_fields = ['last_reported']


class FarmerSerializer(serializers.ModelSerializer):
    feed_storage = FeedStorageSerializer(read_only=True)
    orders_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Farmer
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def get_orders_count(self, obj):
        return obj.orders.count()


class OrderSerializer(serializers.ModelSerializer):
    farmer_name = serializers.CharField(source='farmer.name', read_only=True)
    
    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ['order_date', 'created_by']
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data) 