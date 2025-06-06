from django.db import models
from django.contrib.auth.models import User
import json


class Route(models.Model):
    """Model for delivery routes optimized by Google Maps API"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('planned', 'Planned'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    name = models.CharField(max_length=200)
    date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_routes')
    total_distance = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Total distance in km")
    estimated_duration = models.IntegerField(null=True, blank=True, help_text="Estimated duration in minutes")
    optimized_sequence = models.JSONField(default=list, help_text="Optimized delivery sequence from Google Maps")
    waypoints = models.JSONField(default=list, help_text="List of waypoints with coordinates")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date', '-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.date}"


class RouteStop(models.Model):
    """Model for individual stops on a route"""
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name='stops')
    farmer = models.ForeignKey('clients.Farmer', on_delete=models.CASCADE)
    order = models.ForeignKey('clients.Order', on_delete=models.CASCADE)
    sequence_number = models.IntegerField()
    estimated_arrival_time = models.DateTimeField(null=True, blank=True)
    actual_arrival_time = models.DateTimeField(null=True, blank=True)
    distance_from_previous = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Distance from previous stop in km")
    duration_from_previous = models.IntegerField(null=True, blank=True, help_text="Duration from previous stop in minutes")
    delivery_notes = models.TextField(blank=True)
    is_completed = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['route', 'sequence_number']
        unique_together = ['route', 'sequence_number']
    
    def __str__(self):
        return f"{self.route.name} - Stop {self.sequence_number}: {self.farmer.name}"


class RouteOptimization(models.Model):
    """Model to store route optimization requests and results"""
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name='optimizations')
    request_data = models.JSONField(help_text="Request sent to Google Maps API")
    response_data = models.JSONField(help_text="Response from Google Maps API")
    optimization_type = models.CharField(max_length=50, default='distance')  # distance, duration, balanced
    created_at = models.DateTimeField(auto_now_add=True)
    success = models.BooleanField(default=True)
    error_message = models.TextField(blank=True)
    
    def __str__(self):
        return f"Optimization for {self.route.name} - {self.created_at}"
