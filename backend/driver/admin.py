from django.contrib import admin
from .models import Driver, Delivery, DeliveryItem


@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    list_display = ['staff_id', 'full_name', 'phone_number', 'vehicle_number', 'is_available', 'created_at']
    list_filter = ['is_available', 'created_at']
    search_fields = ['staff_id', 'full_name', 'phone_number', 'license_number', 'vehicle_number']
    readonly_fields = ['created_at', 'updated_at']


class DeliveryItemInline(admin.TabularInline):
    model = DeliveryItem
    extra = 0
    readonly_fields = ['delivery_time']


@admin.register(Delivery)
class DeliveryAdmin(admin.ModelAdmin):
    list_display = ['driver', 'route', 'status', 'assigned_date', 'start_time', 'end_time', 'total_quantity_delivered']
    list_filter = ['status', 'assigned_date', 'driver']
    search_fields = ['driver__full_name', 'route__name']
    readonly_fields = ['assigned_date']
    inlines = [DeliveryItemInline]
    date_hierarchy = 'assigned_date'


@admin.register(DeliveryItem)
class DeliveryItemAdmin(admin.ModelAdmin):
    list_display = ['delivery', 'farmer', 'order', 'quantity', 'delivered_quantity', 'delivery_time']
    list_filter = ['delivery_time', 'delivery__status']
    search_fields = ['farmer__name', 'order__order_number']
    readonly_fields = ['delivery_time']
