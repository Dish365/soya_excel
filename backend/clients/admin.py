from django.contrib import admin
from .models import Farmer, FeedStorage, Order


@admin.register(Farmer)
class FarmerAdmin(admin.ModelAdmin):
    list_display = ['name', 'province', 'client_type', 'priority', 'has_contract', 'historical_monthly_usage', 'account_manager', 'is_active']
    list_filter = ['province', 'client_type', 'priority', 'has_contract', 'is_active', 'created_at']
    search_fields = ['name', 'phone_number', 'email', 'address', 'zoho_crm_id', 'alix_customer_id']
    readonly_fields = ['created_at', 'updated_at']
    list_editable = ['priority', 'has_contract']


@admin.register(FeedStorage)
class FeedStorageAdmin(admin.ModelAdmin):
    list_display = ['farmer', 'capacity', 'current_quantity', 'percentage_remaining', 'is_low_stock', 'is_emergency_level', 'sensor_type', 'is_connected', 'last_reported']
    list_filter = ['sensor_type', 'is_connected', 'last_reported']
    search_fields = ['farmer__name', 'sensor_id']
    readonly_fields = ['last_reported', 'percentage_remaining', 'is_low_stock', 'is_emergency_level']
    list_editable = ['current_quantity', 'is_connected']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'expedition_number', 'farmer', 'quantity', 'delivery_method', 'order_type', 'status', 'planning_week', 'forecast_based']
    list_filter = ['delivery_method', 'order_type', 'status', 'forecast_based', 'order_date', 'expected_delivery_date']
    search_fields = ['order_number', 'expedition_number', 'farmer__name', 'alix_order_id']
    readonly_fields = ['order_date', 'expedition_number']
    date_hierarchy = 'order_date'
    list_editable = ['status']
