from django.contrib import admin
from .models import Route, RouteStop, RouteOptimization


class RouteStopInline(admin.TabularInline):
    model = RouteStop
    extra = 0
    ordering = ['sequence_number']


@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    list_display = ['name', 'date', 'status', 'total_distance', 'estimated_duration', 'created_by', 'created_at']
    list_filter = ['status', 'date', 'created_at']
    search_fields = ['name']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [RouteStopInline]
    date_hierarchy = 'date'


@admin.register(RouteStop)
class RouteStopAdmin(admin.ModelAdmin):
    list_display = ['route', 'sequence_number', 'farmer', 'order', 'estimated_arrival_time', 'actual_arrival_time', 'is_completed']
    list_filter = ['is_completed', 'route__date']
    search_fields = ['route__name', 'farmer__name', 'order__order_number']
    ordering = ['route', 'sequence_number']


@admin.register(RouteOptimization)
class RouteOptimizationAdmin(admin.ModelAdmin):
    list_display = ['route', 'optimization_type', 'created_at', 'success']
    list_filter = ['success', 'optimization_type', 'created_at']
    search_fields = ['route__name']
    readonly_fields = ['created_at', 'request_data', 'response_data']
