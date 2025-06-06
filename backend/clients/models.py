from django.db import models
from django.contrib.auth.models import User


class Farmer(models.Model):
    """Model representing a farmer client"""
    name = models.CharField(max_length=200)
    phone_number = models.CharField(max_length=20)
    email = models.EmailField(null=True, blank=True)
    address = models.TextField()
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name


class FeedStorage(models.Model):
    """Model for tracking feed storage data from IoT sensors"""
    farmer = models.OneToOneField(Farmer, on_delete=models.CASCADE, related_name='feed_storage')
    capacity = models.DecimalField(max_digits=10, decimal_places=2, help_text="Total capacity in kg")
    current_quantity = models.DecimalField(max_digits=10, decimal_places=2, help_text="Current quantity in kg")
    last_reported = models.DateTimeField(auto_now=True)
    sensor_id = models.CharField(max_length=100, unique=True)
    low_stock_threshold = models.DecimalField(max_digits=10, decimal_places=2, default=20.0, help_text="Threshold percentage for low stock alert")
    
    @property
    def percentage_remaining(self):
        if self.capacity > 0:
            return (self.current_quantity / self.capacity) * 100
        return 0
    
    @property
    def is_low_stock(self):
        return self.percentage_remaining <= self.low_stock_threshold
    
    def __str__(self):
        return f"{self.farmer.name} - Storage"


class Order(models.Model):
    """Model for tracking farmer orders"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('in_transit', 'In Transit'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]
    
    farmer = models.ForeignKey(Farmer, on_delete=models.CASCADE, related_name='orders')
    order_number = models.CharField(max_length=50, unique=True)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, help_text="Quantity in kg")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    order_date = models.DateTimeField(auto_now_add=True)
    expected_delivery_date = models.DateTimeField(null=True, blank=True)
    actual_delivery_date = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_orders')
    
    class Meta:
        ordering = ['-order_date']
    
    def __str__(self):
        return f"Order {self.order_number} - {self.farmer.name}"
