from django.contrib import admin
from .models import Manager, SupplyInventory, SupplyTransaction, DistributionPlan, Analytics


@admin.register(Manager)
class ManagerAdmin(admin.ModelAdmin):
    list_display = ['employee_id', 'full_name', 'email', 'phone_number', 'department', 'is_active', 'created_at']
    list_filter = ['is_active', 'department', 'created_at']
    search_fields = ['employee_id', 'full_name', 'email', 'phone_number']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(SupplyInventory)
class SupplyInventoryAdmin(admin.ModelAdmin):
    list_display = ['product_name', 'product_code', 'current_stock', 'minimum_stock', 'is_low_stock', 'unit_price', 'last_restocked']
    list_filter = ['last_restocked', 'created_at']
    search_fields = ['product_name', 'product_code']
    readonly_fields = ['created_at', 'updated_at', 'is_low_stock', 'stock_percentage']
    list_editable = ['current_stock', 'unit_price']


@admin.register(SupplyTransaction)
class SupplyTransactionAdmin(admin.ModelAdmin):
    list_display = ['reference_number', 'inventory', 'transaction_type', 'quantity', 'performed_by', 'transaction_date']
    list_filter = ['transaction_type', 'transaction_date']
    search_fields = ['reference_number', 'inventory__product_name', 'description']
    readonly_fields = ['transaction_date']
    date_hierarchy = 'transaction_date'


@admin.register(DistributionPlan)
class DistributionPlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'start_date', 'end_date', 'status', 'total_quantity_planned', 'created_by', 'approved_by']
    list_filter = ['status', 'start_date', 'end_date']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'start_date'


@admin.register(Analytics)
class AnalyticsAdmin(admin.ModelAdmin):
    list_display = ['metric_name', 'metric_type', 'period_start', 'period_end', 'generated_by', 'generated_at']
    list_filter = ['metric_type', 'generated_at']
    search_fields = ['metric_name']
    readonly_fields = ['generated_at']
    date_hierarchy = 'generated_at'
