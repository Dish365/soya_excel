from rest_framework import serializers
from .models import Farmer, FeedStorage, Order


class FeedStorageSerializer(serializers.ModelSerializer):
    percentage_remaining = serializers.ReadOnlyField()
    is_low_stock = serializers.ReadOnlyField()
    is_emergency_level = serializers.ReadOnlyField()
    farmer_name = serializers.CharField(source='farmer.name', read_only=True)
    farmer_address = serializers.CharField(source='farmer.address', read_only=True)
    province = serializers.CharField(source='farmer.province', read_only=True)
    client_type = serializers.CharField(source='farmer.client_type', read_only=True)
    
    class Meta:
        model = FeedStorage
        fields = ['id', 'farmer', 'capacity', 'current_quantity', 'last_reported', 
                  'sensor_id', 'sensor_type', 'reporting_frequency',
                  'low_stock_threshold_tonnes', 'low_stock_threshold_percentage',
                  'is_connected', 'last_maintenance', 'percentage_remaining', 
                  'is_low_stock', 'is_emergency_level', 'farmer_name', 'farmer_address',
                  'province', 'client_type']
        read_only_fields = ['last_reported']


class FarmerSerializer(serializers.ModelSerializer):
    feed_storage = FeedStorageSerializer(read_only=True)
    orders_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Farmer
        fields = ['id', 'name', 'phone_number', 'email', 'address', 'latitude', 'longitude',
                  'province', 'client_type', 'priority', 'account_manager', 'has_contract',
                  'preferred_delivery_day', 'historical_monthly_usage', 'zoho_crm_id',
                  'alix_customer_id', 'created_at', 'updated_at', 'is_active',
                  'feed_storage', 'orders_count']
        read_only_fields = ['created_at', 'updated_at']
    
    def get_orders_count(self, obj):
        return obj.orders.count()


class OrderSerializer(serializers.ModelSerializer):
    farmer_name = serializers.CharField(source='farmer.name', read_only=True)
    farmer_address = serializers.CharField(source='farmer.address', read_only=True)
    province = serializers.CharField(source='farmer.province', read_only=True)
    client_type = serializers.CharField(source='farmer.client_type', read_only=True)
    farmer_priority = serializers.CharField(source='farmer.priority', read_only=True)
    
    # Route and delivery information
    assigned_route_name = serializers.CharField(source='assigned_route.name', read_only=True)
    assigned_driver_name = serializers.CharField(source='assigned_driver.full_name', read_only=True)
    assigned_vehicle_number = serializers.CharField(source='assigned_vehicle.vehicle_number', read_only=True)
    
    # Approval information
    approved_by_name = serializers.CharField(source='approved_by.username', read_only=True)
    
    # Computed fields
    delivery_urgency = serializers.ReadOnlyField()
    can_be_confirmed = serializers.ReadOnlyField()
    can_be_planned = serializers.ReadOnlyField()
    
    # Status transitions
    available_actions = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'farmer', 'order_number', 'expedition_number', 'quantity',
            'delivery_method', 'order_type', 'priority', 'status', 'order_date', 
            'expected_delivery_date', 'actual_delivery_date', 'forecast_based',
            'planning_week', 'alix_order_id', 'notes', 'created_by',
            'farmer_name', 'farmer_address', 'province', 'client_type', 'farmer_priority',
            'assigned_route', 'assigned_route_name', 'assigned_driver', 'assigned_driver_name',
            'assigned_vehicle', 'assigned_vehicle_number', 'is_urgent', 'requires_approval',
            'approved_by', 'approved_by_name', 'approved_at', 'delivery_urgency',
            'can_be_confirmed', 'can_be_planned', 'available_actions'
        ]
        read_only_fields = [
            'order_date', 'created_by', 'expedition_number', 'delivery_urgency',
            'can_be_confirmed', 'can_be_planned', 'available_actions'
        ]
    
    def get_available_actions(self, obj):
        """Get available actions for the order based on current status"""
        actions = []
        
        if obj.status == 'pending':
            if obj.can_be_confirmed:
                actions.append('confirm')
            if obj.requires_approval:
                actions.append('approve')
            actions.extend(['edit', 'cancel'])
        
        elif obj.status == 'confirmed':
            if obj.can_be_planned:
                actions.append('plan')
            actions.extend(['edit', 'cancel'])
        
        elif obj.status == 'planned':
            actions.extend(['assign_route', 'edit', 'cancel'])
        
        elif obj.status == 'in_transit':
            actions.extend(['mark_delivered', 'update_status'])
        
        elif obj.status == 'delivered':
            actions.append('view_details')
        
        elif obj.status == 'cancelled':
            actions.append('reactivate')
        
        return actions
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)
    
    def validate(self, data):
        """Custom validation for order creation/update"""
        if 'expected_delivery_date' in data and data['expected_delivery_date']:
            from django.utils import timezone
            if data['expected_delivery_date'] < timezone.now():
                raise serializers.ValidationError(
                    "Expected delivery date cannot be in the past"
                )
        
        if 'quantity' in data and data['quantity'] <= 0:
            raise serializers.ValidationError(
                "Quantity must be greater than 0"
            )
        
        return data 