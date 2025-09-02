from django.contrib import admin
from .models import Route, RouteStop, RouteOptimization, WeeklyRoutePerformance, MonthlyRoutePerformance


class RouteStopInline(admin.TabularInline):
    model = RouteStop
    extra = 0
    ordering = ['sequence_number']
    readonly_fields = ['is_on_time', 'service_efficiency']
    fields = ['sequence_number', 'farmer', 'order', 'delivery_method', 'quantity_to_deliver', 'quantity_delivered', 'estimated_arrival_time', 'actual_arrival_time', 'is_completed', 'delivery_rating']


@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    list_display = ['name', 'date', 'route_type', 'status', 'total_distance', 'actual_distance', 'km_per_tonne', 'route_efficiency_score', 'created_by']
    list_filter = ['route_type', 'status', 'assigned_vehicle_type', 'date', 'created_at']
    search_fields = ['name', 'alix_route_reference']
    readonly_fields = ['created_at', 'updated_at', 'is_within_accuracy_target', 'delivery_efficiency']
    inlines = [RouteStopInline]
    date_hierarchy = 'date'


@admin.register(RouteStop)
class RouteStopAdmin(admin.ModelAdmin):
    list_display = ['route', 'sequence_number', 'farmer', 'delivery_method', 'quantity_to_deliver', 'quantity_delivered', 'is_completed', 'delivery_rating', 'had_delivery_issues']
    list_filter = ['delivery_method', 'is_completed', 'had_delivery_issues', 'delivery_rating', 'route__date']
    search_fields = ['route__name', 'farmer__name', 'order__order_number']
    readonly_fields = ['is_on_time', 'service_efficiency']
    ordering = ['route', 'sequence_number']


@admin.register(RouteOptimization)
class RouteOptimizationAdmin(admin.ModelAdmin):
    list_display = ['route', 'optimization_type', 'optimization_score', 'distance_savings', 'estimated_fuel_savings', 'google_maps_used', 'success', 'created_at']
    list_filter = ['optimization_type', 'success', 'google_maps_used', 'created_at']
    search_fields = ['route__name']
    readonly_fields = ['created_at', 'request_data', 'response_data']


@admin.register(WeeklyRoutePerformance)
class WeeklyRoutePerformanceAdmin(admin.ModelAdmin):
    list_display = ['week_start_date', 'total_routes_completed', 'km_per_tonne_trituro_44', 'km_per_tonne_dairy_trituro', 'planning_accuracy_percentage', 'meets_90_percent_accuracy_target']
    list_filter = ['meets_90_percent_accuracy_target', 'exceeds_kpi_targets', 'week_start_date']
    search_fields = []
    readonly_fields = ['calculated_at']
    date_hierarchy = 'week_start_date'


@admin.register(MonthlyRoutePerformance)
class MonthlyRoutePerformanceAdmin(admin.ModelAdmin):
    list_display = ['month', 'total_routes_month', 'monthly_km_per_tonne_trituro_44', 'planning_accuracy_1_week', 'planning_accuracy_1_month', 'compared_to_previous_month', 'meets_monthly_targets']
    list_filter = ['compared_to_previous_month', 'meets_monthly_targets', 'month']
    search_fields = []
    readonly_fields = ['calculated_at']
    date_hierarchy = 'month'
