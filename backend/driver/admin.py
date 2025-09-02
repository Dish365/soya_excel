from django.contrib import admin
from .models import Vehicle, Driver, Delivery, DeliveryItem, DeliveryPerformanceMetrics


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ['vehicle_number', 'vehicle_type', 'capacity_tonnes', 'status', 'fuel_efficiency_l_per_100km', 'has_gps_tracking', 'odometer_km']
    list_filter = ['vehicle_type', 'status', 'has_gps_tracking', 'created_at']
    search_fields = ['vehicle_number', 'make_model', 'license_plate', 'electronic_log_device']
    readonly_fields = ['created_at', 'updated_at', 'is_available']
    list_editable = ['status', 'odometer_km']


@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    list_display = ['staff_id', 'full_name', 'phone_number', 'assigned_vehicle', 'is_available', 'total_deliveries_completed', 'created_at']
    list_filter = ['is_available', 'assigned_vehicle__vehicle_type', 'created_at']
    search_fields = ['staff_id', 'full_name', 'phone_number', 'license_number']
    readonly_fields = ['created_at', 'updated_at', 'total_deliveries_completed', 'total_km_driven', 'average_delivery_rating']
    filter_horizontal = []


class DeliveryItemInline(admin.TabularInline):
    model = DeliveryItem
    extra = 0
    readonly_fields = ['delivery_time', 'customer_rating']
    fields = ['order', 'farmer', 'quantity_planned', 'quantity_delivered', 'delivery_method', 'delivery_time', 'customer_rating', 'quality_check_passed']


@admin.register(Delivery)
class DeliveryAdmin(admin.ModelAdmin):
    list_display = ['driver', 'vehicle', 'route', 'status', 'assigned_date', 'total_quantity_delivered', 'km_per_tonne', 'co2_emissions_kg']
    list_filter = ['status', 'assigned_date', 'driver', 'vehicle__vehicle_type']
    search_fields = ['driver__full_name', 'route__name', 'vehicle__vehicle_number']
    readonly_fields = ['assigned_date', 'km_per_tonne', 'efficiency_rating']
    inlines = [DeliveryItemInline]
    date_hierarchy = 'assigned_date'


@admin.register(DeliveryItem)
class DeliveryItemAdmin(admin.ModelAdmin):
    list_display = ['delivery', 'farmer', 'order', 'quantity_planned', 'quantity_delivered', 'delivery_method', 'delivery_time', 'customer_rating']
    list_filter = ['delivery_method', 'delivery_time', 'customer_rating', 'quality_check_passed']
    search_fields = ['farmer__name', 'order__order_number', 'delivery_confirmation_number']
    readonly_fields = ['delivery_time']


@admin.register(DeliveryPerformanceMetrics)
class DeliveryPerformanceMetricsAdmin(admin.ModelAdmin):
    list_display = ['metric_type', 'product_type', 'period_start', 'period_end', 'km_per_tonne', 'total_deliveries', 'on_time_delivery_rate']
    list_filter = ['metric_type', 'product_type', 'calculated_at']
    search_fields = ['metric_type', 'product_type']
    readonly_fields = ['calculated_at']
    date_hierarchy = 'calculated_at'
