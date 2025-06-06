from rest_framework import serializers
from .models import Driver, Delivery, DeliveryItem


class DriverSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    user = serializers.SerializerMethodField()
    active_deliveries_count = serializers.SerializerMethodField()
    deliveries = serializers.SerializerMethodField()
    
    class Meta:
        model = Driver
        fields = ['id', 'user', 'staff_id', 'full_name', 'phone_number', 
                  'license_number', 'vehicle_number', 'is_available', 
                  'created_at', 'updated_at', 'username', 
                  'active_deliveries_count', 'deliveries']
        read_only_fields = ['created_at', 'updated_at']
    
    def get_user(self, obj):
        return {
            'id': obj.user.id,
            'username': obj.user.username,
            'email': obj.user.email
        }
    
    def get_active_deliveries_count(self, obj):
        return obj.deliveries.filter(status__in=['assigned', 'in_progress']).count()
    
    def get_deliveries(self, obj):
        total = obj.deliveries.count()
        completed = obj.deliveries.filter(status='completed').count()
        in_progress = obj.deliveries.filter(status__in=['assigned', 'in_progress']).count()
        return {
            'total': total,
            'completed': completed,
            'in_progress': in_progress
        }


class DeliveryItemSerializer(serializers.ModelSerializer):
    farmer_name = serializers.CharField(source='farmer.name', read_only=True)
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    
    class Meta:
        model = DeliveryItem
        fields = '__all__'
        read_only_fields = ['delivery_time']


class DeliverySerializer(serializers.ModelSerializer):
    driver_name = serializers.CharField(source='driver.full_name', read_only=True)
    route_name = serializers.CharField(source='route.name', read_only=True)
    route = serializers.SerializerMethodField()
    items = DeliveryItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Delivery
        fields = ['id', 'driver', 'driver_name', 'route', 'route_name', 
                  'status', 'assigned_date', 'start_time', 'end_time', 
                  'total_quantity_delivered', 'notes', 'items']
        read_only_fields = ['assigned_date']
    
    def get_route(self, obj):
        return {
            'id': obj.route.id,
            'name': obj.route.name,
            'date': obj.route.date.isoformat() if obj.route.date else None
        }


class DeliveryCreateSerializer(serializers.ModelSerializer):
    items = serializers.ListField(
        child=serializers.DictField(),
        write_only=True
    )
    
    class Meta:
        model = Delivery
        fields = ['driver', 'route', 'items']
    
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        delivery = Delivery.objects.create(**validated_data)
        
        for item_data in items_data:
            DeliveryItem.objects.create(delivery=delivery, **item_data)
        
        return delivery 