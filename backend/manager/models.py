from django.db import models
from django.contrib.auth.models import User


class Manager(models.Model):
    """Model representing a supply and logistics manager"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='manager_profile')
    employee_id = models.CharField(max_length=50, unique=True)
    full_name = models.CharField(max_length=200)
    phone_number = models.CharField(max_length=20)
    email = models.EmailField()
    department = models.CharField(max_length=100, default="Supply & Logistics")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.employee_id} - {self.full_name}"


class SupplyInventory(models.Model):
    """Model for tracking feed supply inventory"""
    product_name = models.CharField(max_length=200)
    product_code = models.CharField(max_length=50, unique=True)
    current_stock = models.DecimalField(max_digits=12, decimal_places=2, help_text="Current stock in kg")
    minimum_stock = models.DecimalField(max_digits=12, decimal_places=2, help_text="Minimum stock level in kg")
    maximum_stock = models.DecimalField(max_digits=12, decimal_places=2, help_text="Maximum stock level in kg")
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Price per kg")
    last_restocked = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    @property
    def is_low_stock(self):
        return self.current_stock <= self.minimum_stock
    
    @property
    def stock_percentage(self):
        if self.maximum_stock > 0:
            return (self.current_stock / self.maximum_stock) * 100
        return 0
    
    class Meta:
        verbose_name_plural = "Supply Inventories"
        ordering = ['product_name']
    
    def __str__(self):
        return f"{self.product_name} ({self.product_code})"


class SupplyTransaction(models.Model):
    """Model for tracking inventory transactions"""
    TRANSACTION_TYPES = [
        ('restock', 'Restock'),
        ('dispatch', 'Dispatch'),
        ('adjustment', 'Adjustment'),
        ('return', 'Return'),
    ]
    
    inventory = models.ForeignKey(SupplyInventory, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    quantity = models.DecimalField(max_digits=12, decimal_places=2, help_text="Quantity in kg (positive for inflow, negative for outflow)")
    reference_number = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    performed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    transaction_date = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-transaction_date']
    
    def __str__(self):
        return f"{self.transaction_type} - {self.inventory.product_name} - {self.quantity}kg"


class DistributionPlan(models.Model):
    """Model for planning distribution schedules"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('approved', 'Approved'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    total_quantity_planned = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_by = models.ForeignKey(Manager, on_delete=models.SET_NULL, null=True, related_name='distribution_plans')
    approved_by = models.ForeignKey(Manager, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_plans')
    approved_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-start_date']
    
    def __str__(self):
        return f"{self.name} ({self.start_date} to {self.end_date})"


class Analytics(models.Model):
    """Model for storing analytics and insights"""
    metric_name = models.CharField(max_length=200)
    metric_value = models.JSONField()
    metric_type = models.CharField(max_length=50)  # delivery_efficiency, stock_turnover, etc.
    period_start = models.DateField()
    period_end = models.DateField()
    generated_by = models.ForeignKey(Manager, on_delete=models.SET_NULL, null=True)
    generated_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = "Analytics"
        ordering = ['-generated_at']
    
    def __str__(self):
        return f"{self.metric_name} - {self.period_start} to {self.period_end}"
