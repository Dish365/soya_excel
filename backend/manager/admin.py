from django.contrib import admin
from .models import Manager, SoybeanMealProduct, SupplyInventory, SupplyTransaction, WeeklyDistributionPlan, MonthlyDistributionPlan, KPIMetrics


@admin.register(Manager)
class ManagerAdmin(admin.ModelAdmin):
    list_display = ['employee_id', 'full_name', 'email', 'phone_number', 'department', 'is_active', 'created_at']
    list_filter = ['is_active', 'department', 'created_at', 'can_approve_plans', 'can_manage_contracts']
    search_fields = ['employee_id', 'full_name', 'email', 'phone_number']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(SoybeanMealProduct)
class SoybeanMealProductAdmin(admin.ModelAdmin):
    list_display = ['product_name', 'product_code', 'product_type', 'protein_percentage', 'primary_origin', 'base_price_per_tonne', 'sustainability_certified', 'is_active']
    list_filter = ['product_type', 'primary_origin', 'sustainability_certified', 'is_active', 'created_at']
    search_fields = ['product_name', 'product_code']
    readonly_fields = ['created_at', 'updated_at', 'price_last_updated']
    list_editable = ['base_price_per_tonne', 'is_active']


@admin.register(SupplyInventory)
class SupplyInventoryAdmin(admin.ModelAdmin):
    list_display = ['product', 'silo_number', 'current_stock', 'minimum_stock', 'is_low_stock', 'quality_grade', 'last_restocked']
    list_filter = ['quality_grade', 'last_restocked', 'created_at']
    search_fields = ['product__product_name', 'product__product_code', 'silo_number', 'storage_location']
    readonly_fields = ['created_at', 'updated_at', 'is_low_stock', 'stock_percentage', 'days_of_supply_remaining']
    list_editable = ['current_stock', 'quality_grade']


@admin.register(SupplyTransaction)
class SupplyTransactionAdmin(admin.ModelAdmin):
    list_display = ['reference_number', 'inventory', 'transaction_type', 'quantity', 'origin_country', 'performed_by', 'transaction_date']
    list_filter = ['transaction_type', 'origin_country', 'quality_approved', 'transaction_date']
    search_fields = ['reference_number', 'inventory__product__product_name', 'description', 'container_number']
    readonly_fields = ['transaction_date']
    date_hierarchy = 'transaction_date'


@admin.register(WeeklyDistributionPlan)
class WeeklyDistributionPlanAdmin(admin.ModelAdmin):
    list_display = ['plan_name', 'planning_week', 'week_start_date', 'status', 'total_quantity_planned', 'planned_routes', 'forecast_accuracy_percentage', 'created_by']
    list_filter = ['planning_week', 'status', 'planned_on_tuesday', 'finalized_by_friday', 'week_start_date']
    search_fields = ['plan_name']
    readonly_fields = ['created_at', 'updated_at', 'forecast_accuracy_percentage']
    date_hierarchy = 'week_start_date'


@admin.register(MonthlyDistributionPlan)
class MonthlyDistributionPlanAdmin(admin.ModelAdmin):
    list_display = ['plan_name', 'month', 'status', 'total_monthly_forecast', 'fleet_utilization_target', 'forecast_accuracy_percentage', 'created_by']
    list_filter = ['status', 'month']
    search_fields = ['plan_name']
    readonly_fields = ['created_at', 'updated_at', 'forecast_accuracy_percentage']
    date_hierarchy = 'month'


@admin.register(KPIMetrics)
class KPIMetricsAdmin(admin.ModelAdmin):
    list_display = ['metric_type', 'period_type', 'period_start', 'period_end', 'metric_value', 'target_value', 'trend_direction', 'calculated_by']
    list_filter = ['metric_type', 'period_type', 'trend_direction', 'calculated_at']
    search_fields = ['metric_type']
    readonly_fields = ['calculated_at']
    date_hierarchy = 'calculated_at'
