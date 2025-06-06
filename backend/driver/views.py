from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count
from django.utils import timezone
from .models import Driver, Delivery, DeliveryItem
from .serializers import (
    DriverSerializer, DeliverySerializer, 
    DeliveryCreateSerializer, DeliveryItemSerializer
)
from clients.models import Order


class DriverViewSet(viewsets.ModelViewSet):
    queryset = Driver.objects.all()
    serializer_class = DriverSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['is_available']
    search_fields = ['full_name', 'staff_id', 'phone_number', 'vehicle_number']
    ordering_fields = ['full_name', 'created_at']
    
    @action(detail=True, methods=['post'])
    def toggle_availability(self, request, pk=None):
        """Toggle driver availability"""
        driver = self.get_object()
        driver.is_available = not driver.is_available
        driver.save()
        serializer = self.get_serializer(driver)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def deliveries(self, request, pk=None):
        """Get all deliveries for a specific driver"""
        driver = self.get_object()
        deliveries = driver.deliveries.all()
        serializer = DeliverySerializer(deliveries, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def available(self, request):
        """Get all available drivers"""
        drivers = self.get_queryset().filter(is_available=True)
        serializer = self.get_serializer(drivers, many=True)
        return Response(serializer.data)


class DeliveryViewSet(viewsets.ModelViewSet):
    queryset = Delivery.objects.all()
    serializer_class = DeliverySerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['driver', 'route', 'status']
    search_fields = ['driver__full_name', 'route__name']
    ordering_fields = ['assigned_date']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return DeliveryCreateSerializer
        return DeliverySerializer
    
    @action(detail=True, methods=['post'])
    def start_delivery(self, request, pk=None):
        """Mark delivery as in progress"""
        delivery = self.get_object()
        if delivery.status != 'assigned':
            return Response(
                {'error': 'Delivery must be in assigned status to start'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        delivery.status = 'in_progress'
        delivery.start_time = timezone.now()
        delivery.save()
        
        # Update driver availability
        delivery.driver.is_available = False
        delivery.driver.save()
        
        serializer = self.get_serializer(delivery)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def complete_delivery(self, request, pk=None):
        """Mark delivery as completed"""
        delivery = self.get_object()
        if delivery.status != 'in_progress':
            return Response(
                {'error': 'Delivery must be in progress to complete'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        delivery.status = 'completed'
        delivery.end_time = timezone.now()
        
        # Calculate total quantity delivered
        total_quantity = sum(
            item.delivered_quantity or 0 
            for item in delivery.items.all()
        )
        delivery.total_quantity_delivered = total_quantity
        delivery.save()
        
        # Update driver availability
        delivery.driver.is_available = True
        delivery.driver.save()
        
        # Update order statuses
        for item in delivery.items.all():
            if item.order:
                item.order.status = 'delivered'
                item.order.actual_delivery_date = timezone.now()
                item.order.save()
        
        serializer = self.get_serializer(delivery)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get all active deliveries"""
        deliveries = self.get_queryset().filter(
            status__in=['assigned', 'in_progress']
        )
        serializer = self.get_serializer(deliveries, many=True)
        return Response(serializer.data)
