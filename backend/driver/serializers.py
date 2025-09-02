from rest_framework import serializers
from .models import Driver, Vehicle, Delivery, DeliveryItem, DeliveryPerformanceMetrics


class VehicleSerializer(serializers.ModelSerializer):
    assigned_drivers_count = serializers.SerializerMethodField()
    is_available = serializers.ReadOnlyField()
    
    class Meta:
        model = Vehicle
        fields = ['id', 'vehicle_number', 'vehicle_type', 'capacity_tonnes',
                  'make_model', 'year', 'license_plate', 'has_gps_tracking',
                  'electronic_log_device', 'status', 'last_maintenance',
                  'next_maintenance_due', 'odometer_km', 'fuel_efficiency_l_per_100km',
                  'co2_emissions_factor', 'created_at', 'updated_at',
                  'assigned_drivers_count', 'is_available']
        read_only_fields = ['created_at', 'updated_at']
    
    def get_assigned_drivers_count(self, obj):
        return obj.assigned_drivers.count()


class DriverSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    user = serializers.SerializerMethodField()
    assigned_vehicle_info = serializers.SerializerMethodField()
    active_deliveries_count = serializers.SerializerMethodField()
    deliveries = serializers.SerializerMethodField()
    vehicle_number = serializers.ReadOnlyField()
    current_delivery_status = serializers.ReadOnlyField()
    
    class Meta:
        model = Driver
        fields = ['id', 'user', 'staff_id', 'full_name', 'phone_number', 
                  'license_number', 'assigned_vehicle', 'assigned_vehicle_info', 
                  'can_drive_vehicle_types', 'is_available', 'current_location_lat',
                  'current_location_lng', 'total_deliveries_completed', 'total_km_driven',
                  'created_at', 'updated_at', 'username', 
                  'active_deliveries_count', 'deliveries', 'vehicle_number', 'current_delivery_status']
        read_only_fields = ['created_at', 'updated_at']
    
    def get_user(self, obj):
        return {
            'id': obj.user.id,
            'username': obj.user.username,
            'email': obj.user.email
        }
    
    def get_assigned_vehicle_info(self, obj):
        if obj.assigned_vehicle:
            return {
                'id': obj.assigned_vehicle.id,
                'vehicle_number': obj.assigned_vehicle.vehicle_number,
                'vehicle_type': obj.assigned_vehicle.vehicle_type,
                'capacity_tonnes': float(obj.assigned_vehicle.capacity_tonnes),
                'status': obj.assigned_vehicle.status
            }
        return None
    
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
    vehicle_info = serializers.SerializerMethodField()
    route_name = serializers.CharField(source='route.name', read_only=True)
    route = serializers.SerializerMethodField()
    items = DeliveryItemSerializer(many=True, read_only=True)
    km_per_tonne = serializers.ReadOnlyField()
    efficiency_rating = serializers.ReadOnlyField()
    
    class Meta:
        model = Delivery
        fields = ['id', 'driver', 'driver_name', 'vehicle', 'vehicle_info', 'route', 'route_name', 
                  'status', 'assigned_date', 'start_time', 'end_time', 
                  'total_quantity_delivered', 'actual_distance_km', 'actual_duration_minutes',
                  'fuel_consumed_liters', 'co2_emissions_kg', 'gps_tracking_data',
                  'km_per_tonne', 'efficiency_rating', 'notes', 'items']
        read_only_fields = ['assigned_date']
    
    def get_vehicle_info(self, obj):
        if obj.vehicle:
            return {
                'id': obj.vehicle.id,
                'vehicle_number': obj.vehicle.vehicle_number,
                'vehicle_type': obj.vehicle.vehicle_type,
                'capacity_tonnes': float(obj.vehicle.capacity_tonnes)
            }
        return None
    
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
        fields = ['driver', 'vehicle', 'route', 'items']
    
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        delivery = Delivery.objects.create(**validated_data)
        
        for item_data in items_data:
            DeliveryItem.objects.create(delivery=delivery, **item_data)
        
        return delivery


class DeliveryPerformanceMetricsSerializer(serializers.ModelSerializer):
    metric_type_display = serializers.CharField(source='get_metric_type_display', read_only=True)
    product_type_display = serializers.CharField(source='get_product_type_display', read_only=True)
    
    class Meta:
        model = DeliveryPerformanceMetrics
        fields = ['id', 'metric_type', 'metric_type_display', 'product_type', 'product_type_display',
                  'period_start', 'period_end', 'total_km', 'total_tonnes', 'km_per_tonne',
                  'total_deliveries', 'total_co2_emissions_kg', 'average_delivery_time_minutes',
                  'on_time_delivery_rate', 'calculated_at']
        read_only_fields = ['calculated_at'] 