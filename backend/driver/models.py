from django.db import models
from django.contrib.auth.models import User


class Driver(models.Model):
    """Model representing a delivery driver"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='driver_profile')
    staff_id = models.CharField(max_length=50, unique=True)
    full_name = models.CharField(max_length=200)
    phone_number = models.CharField(max_length=20)
    license_number = models.CharField(max_length=50)
    vehicle_number = models.CharField(max_length=50, null=True, blank=True)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['full_name']
    
    def __str__(self):
        return f"{self.staff_id} - {self.full_name}"


class Delivery(models.Model):
    """Model for tracking deliveries assigned to drivers"""
    STATUS_CHOICES = [
        ('assigned', 'Assigned'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    driver = models.ForeignKey(Driver, on_delete=models.CASCADE, related_name='deliveries')
    route = models.ForeignKey('route.Route', on_delete=models.CASCADE, related_name='deliveries')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='assigned')
    assigned_date = models.DateTimeField(auto_now_add=True)
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    total_quantity_delivered = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-assigned_date']
    
    def __str__(self):
        return f"Delivery - {self.driver.full_name} - {self.assigned_date.date()}"


class DeliveryItem(models.Model):
    """Model for individual delivery items within a delivery"""
    delivery = models.ForeignKey(Delivery, on_delete=models.CASCADE, related_name='items')
    order = models.ForeignKey('clients.Order', on_delete=models.CASCADE)
    farmer = models.ForeignKey('clients.Farmer', on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, help_text="Quantity in kg")
    delivered_quantity = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    delivery_time = models.DateTimeField(null=True, blank=True)
    signature = models.TextField(null=True, blank=True)  # Base64 encoded signature
    notes = models.TextField(blank=True)
    
    def __str__(self):
        return f"Item - {self.farmer.name} - {self.quantity}kg"
