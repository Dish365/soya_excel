from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, F
from django.utils import timezone
from .models import Farmer, FeedStorage, Order
from .serializers import FarmerSerializer, FeedStorageSerializer, OrderSerializer


class FarmerViewSet(viewsets.ModelViewSet):
    queryset = Farmer.objects.all()
    serializer_class = FarmerSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['is_active']
    search_fields = ['name', 'phone_number', 'email', 'address']
    ordering_fields = ['name', 'created_at']
    
    @action(detail=True, methods=['get'])
    def orders(self, request, pk=None):
        """Get all orders for a specific farmer"""
        farmer = self.get_object()
        orders = farmer.orders.all()
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get farmers with low feed stock"""
        farmers = Farmer.objects.filter(
            feed_storage__isnull=False,
            feed_storage__current_quantity__lte=F('feed_storage__capacity') * 0.2
        )
        serializer = self.get_serializer(farmers, many=True)
        return Response(serializer.data)


class FeedStorageViewSet(viewsets.ModelViewSet):
    queryset = FeedStorage.objects.all()
    serializer_class = FeedStorageSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['farmer', 'is_low_stock']
    search_fields = ['sensor_id', 'farmer__name']
    
    @action(detail=True, methods=['post'])
    def update_quantity(self, request, pk=None):
        """Update feed quantity from IoT sensor"""
        feed_storage = self.get_object()
        quantity = request.data.get('current_quantity')
        
        if quantity is None:
            return Response(
                {'error': 'current_quantity is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        feed_storage.current_quantity = quantity
        feed_storage.save()
        
        serializer = self.get_serializer(feed_storage)
        return Response(serializer.data)


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['farmer', 'status']
    search_fields = ['order_number', 'farmer__name']
    ordering_fields = ['order_date', 'expected_delivery_date']
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get all pending orders"""
        orders = self.get_queryset().filter(status='pending')
        serializer = self.get_serializer(orders, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update order status"""
        order = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in dict(Order.STATUS_CHOICES):
            return Response(
                {'error': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = new_status
        if new_status == 'delivered':
            order.actual_delivery_date = timezone.now()
        order.save()
        
        serializer = self.get_serializer(order)
        return Response(serializer.data)
