from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count, Sum, F
from django.utils import timezone
from datetime import timedelta
from .models import Manager, SupplyInventory, SupplyTransaction, DistributionPlan, Analytics
from .serializers import (
    ManagerSerializer, SupplyInventorySerializer, 
    SupplyTransactionSerializer, DistributionPlanSerializer,
    AnalyticsSerializer, DashboardSerializer
)
from clients.models import Farmer, Order, FeedStorage
from driver.models import Driver, Delivery
from route.models import Route


class ManagerViewSet(viewsets.ModelViewSet):
    queryset = Manager.objects.all()
    serializer_class = ManagerSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Get dashboard summary data"""
        # Calculate date ranges
        today = timezone.now().date()
        month_start = today.replace(day=1)
        
        # Get counts
        total_farmers = Farmer.objects.filter(is_active=True).count()
        active_routes = Route.objects.filter(
            status='active',
            date=today
        ).count()
        available_drivers = Driver.objects.filter(is_available=True).count()
        
        # Low stock alerts
        low_stock_alerts = FeedStorage.objects.filter(
            current_quantity__lte=F('capacity') * 0.2
        ).count()
        
        # Pending orders
        pending_orders = Order.objects.filter(status='pending').count()
        
        # Monthly deliveries
        monthly_deliveries = Delivery.objects.filter(
            assigned_date__gte=month_start,
            status='completed'
        ).count()
        
        # Inventory status
        inventory_items = SupplyInventory.objects.all()
        inventory_status = []
        for item in inventory_items:
            inventory_status.append({
                'id': item.id,
                'product_name': item.product_name,
                'current_stock': float(item.current_stock),
                'minimum_stock': float(item.minimum_stock),
                'is_low_stock': item.is_low_stock  # This uses the property
            })
        
        data = {
            'total_farmers': total_farmers,
            'active_routes': active_routes,
            'available_drivers': available_drivers,
            'low_stock_alerts': low_stock_alerts,
            'pending_orders': pending_orders,
            'monthly_deliveries': monthly_deliveries,
            'inventory_status': inventory_status,
        }
        
        serializer = DashboardSerializer(data)
        return Response(serializer.data)


class SupplyInventoryViewSet(viewsets.ModelViewSet):
    queryset = SupplyInventory.objects.all()
    serializer_class = SupplyInventorySerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['is_low_stock']
    search_fields = ['product_name', 'product_code']
    ordering_fields = ['product_name', 'current_stock']
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get all items with low stock"""
        items = self.get_queryset().filter(
            current_stock__lte=F('minimum_stock')
        )
        serializer = self.get_serializer(items, many=True)
        return Response(serializer.data)


class SupplyTransactionViewSet(viewsets.ModelViewSet):
    queryset = SupplyTransaction.objects.all()
    serializer_class = SupplyTransactionSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['transaction_type', 'inventory']
    search_fields = ['reference_number', 'description']
    ordering_fields = ['transaction_date']
    
    def perform_create(self, serializer):
        serializer.save(performed_by=self.request.user)


class DistributionPlanViewSet(viewsets.ModelViewSet):
    queryset = DistributionPlan.objects.all()
    serializer_class = DistributionPlanSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status']
    search_fields = ['name', 'description']
    ordering_fields = ['start_date', 'created_at']
    
    def perform_create(self, serializer):
        manager = Manager.objects.get(user=self.request.user)
        serializer.save(created_by=manager)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a distribution plan"""
        plan = self.get_object()
        manager = Manager.objects.get(user=request.user)
        
        plan.status = 'approved'
        plan.approved_by = manager
        plan.approved_date = timezone.now()
        plan.save()
        
        serializer = self.get_serializer(plan)
        return Response(serializer.data)


class AnalyticsViewSet(viewsets.ModelViewSet):
    queryset = Analytics.objects.all()
    serializer_class = AnalyticsSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['metric_type']
    ordering_fields = ['generated_at']
    
    @action(detail=False, methods=['get'])
    def delivery_performance(self, request):
        """Get delivery performance analytics"""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not start_date or not end_date:
            return Response(
                {'error': 'start_date and end_date are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate delivery metrics
        deliveries = Delivery.objects.filter(
            assigned_date__range=[start_date, end_date]
        )
        
        total = deliveries.count()
        completed = deliveries.filter(status='completed').count()
        
        metrics = {
            'total_deliveries': total,
            'completed_deliveries': completed,
            'completion_rate': (completed / total * 100) if total > 0 else 0,
            'average_delivery_time': 0,  # Calculate from actual times
        }
        
        return Response(metrics)
