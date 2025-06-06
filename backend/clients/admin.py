from django.contrib import admin
from .models import Farmer, FeedStorage, Order


@admin.register(Farmer)
class FarmerAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone_number', 'email', 'address', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'phone_number', 'email', 'address']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(FeedStorage)
class FeedStorageAdmin(admin.ModelAdmin):
    list_display = ['farmer', 'capacity', 'current_quantity', 'percentage_remaining', 'is_low_stock', 'last_reported']
    list_filter = ['last_reported']
    search_fields = ['farmer__name', 'sensor_id']
    readonly_fields = ['last_reported', 'percentage_remaining', 'is_low_stock']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'farmer', 'quantity', 'status', 'order_date', 'expected_delivery_date']
    list_filter = ['status', 'order_date', 'expected_delivery_date']
    search_fields = ['order_number', 'farmer__name']
    readonly_fields = ['order_date']
    date_hierarchy = 'order_date'
