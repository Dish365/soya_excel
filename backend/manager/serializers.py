from rest_framework import serializers
from .models import Manager, SupplyInventory, SupplyTransaction, DistributionPlan, Analytics


class ManagerSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Manager
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class SupplyInventorySerializer(serializers.ModelSerializer):
    is_low_stock = serializers.ReadOnlyField()
    stock_percentage = serializers.SerializerMethodField()
    current_stock = serializers.DecimalField(max_digits=12, decimal_places=2, coerce_to_string=False)
    minimum_stock = serializers.DecimalField(max_digits=12, decimal_places=2, coerce_to_string=False)
    maximum_stock = serializers.DecimalField(max_digits=12, decimal_places=2, coerce_to_string=False)
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2, coerce_to_string=False)
    
    class Meta:
        model = SupplyInventory
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def get_stock_percentage(self, obj):
        return float(obj.stock_percentage)


class SupplyTransactionSerializer(serializers.ModelSerializer):
    inventory_name = serializers.CharField(source='inventory.product_name', read_only=True)
    performed_by_name = serializers.CharField(source='performed_by.username', read_only=True)
    
    class Meta:
        model = SupplyTransaction
        fields = '__all__'
        read_only_fields = ['transaction_date', 'performed_by']
    
    def create(self, validated_data):
        validated_data['performed_by'] = self.context['request'].user
        
        # Update inventory based on transaction
        inventory = validated_data['inventory']
        quantity = validated_data['quantity']
        transaction_type = validated_data['transaction_type']
        
        if transaction_type == 'restock':
            inventory.current_stock += abs(quantity)
        elif transaction_type in ['dispatch', 'adjustment']:
            inventory.current_stock -= abs(quantity)
        elif transaction_type == 'return':
            inventory.current_stock += abs(quantity)
        
        inventory.save()
        
        return super().create(validated_data)


class DistributionPlanSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = DistributionPlan
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'approved_date']


class AnalyticsSerializer(serializers.ModelSerializer):
    generated_by_name = serializers.CharField(source='generated_by.full_name', read_only=True)
    
    class Meta:
        model = Analytics
        fields = '__all__'
        read_only_fields = ['generated_at']


class DashboardSerializer(serializers.Serializer):
    """Serializer for dashboard summary data"""
    total_farmers = serializers.IntegerField()
    active_routes = serializers.IntegerField()
    available_drivers = serializers.IntegerField()
    low_stock_alerts = serializers.IntegerField()
    pending_orders = serializers.IntegerField()
    monthly_deliveries = serializers.IntegerField()
    inventory_status = serializers.ListField(child=serializers.DictField()) 