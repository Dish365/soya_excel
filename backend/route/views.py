from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count, F
from django.utils import timezone
import requests
import json
from decimal import Decimal
from .models import Route, RouteStop, RouteOptimization
from .serializers import (
    RouteSerializer, RouteStopSerializer, RouteCreateSerializer,
    RouteOptimizationSerializer, RouteOptimizeSerializer
)
from clients.models import Order, Farmer


class RouteViewSet(viewsets.ModelViewSet):
    queryset = Route.objects.all()
    serializer_class = RouteSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'date']
    search_fields = ['name']
    ordering_fields = ['date', 'created_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return RouteCreateSerializer
        return RouteSerializer
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def optimize(self, request, pk=None):
        """Optimize route using Google Maps API (mock implementation)"""
        route = self.get_object()
        
        # In a real implementation, this would call Google Maps API
        # For now, we'll simulate optimization
        try:
            # Simulate optimization by reordering stops based on a simple algorithm
            stops = list(route.stops.all())
            if len(stops) > 1:
                # Simple optimization: order by farmer latitude
                stops.sort(key=lambda s: s.farmer.latitude or 0)
                
                # Update sequence numbers
                for i, stop in enumerate(stops):
                    stop.sequence_number = i + 1
                    stop.save()
                
                # Update route distance and duration (mock values)
                route.total_distance = Decimal(str(len(stops) * 15.5))
                route.estimated_duration = len(stops) * 45
                route.optimized_sequence = [stop.id for stop in stops]
                route.save()
                
                # Create optimization record
                optimization = RouteOptimization.objects.create(
                    route=route,
                    request_data={'stops': len(stops), 'method': 'mock'},
                    response_data={'optimized': True, 'distance': float(route.total_distance)},
                    optimization_type='distance',
                    success=True
                )
                
                serializer = RouteSerializer(route)
                return Response({
                    'route': serializer.data,
                    'message': 'Route optimized successfully'
                })
            else:
                return Response(
                    {'error': 'Route must have at least 2 stops to optimize'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a route for delivery"""
        route = self.get_object()
        if route.status not in ['draft', 'planned']:
            return Response(
                {'error': 'Only draft or planned routes can be activated'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        route.status = 'active'
        route.save()
        
        serializer = self.get_serializer(route)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark route as completed"""
        route = self.get_object()
        if route.status != 'active':
            return Response(
                {'error': 'Only active routes can be completed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        route.status = 'completed'
        route.save()
        
        # Update all stops as completed
        route.stops.update(is_completed=True)
        
        serializer = self.get_serializer(route)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """Get today's routes"""
        today = timezone.now().date()
        routes = self.get_queryset().filter(date=today)
        serializer = self.get_serializer(routes, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get all active routes"""
        routes = self.get_queryset().filter(status='active')
        serializer = self.get_serializer(routes, many=True)
        return Response(serializer.data)


class RouteStopViewSet(viewsets.ModelViewSet):
    queryset = RouteStop.objects.all()
    serializer_class = RouteStopSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['route', 'farmer', 'is_completed']
    ordering_fields = ['sequence_number']
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark a stop as completed"""
        stop = self.get_object()
        stop.is_completed = True
        stop.actual_arrival_time = timezone.now()
        stop.save()
        
        # Update the associated order status
        if stop.order:
            stop.order.status = 'delivered'
            stop.order.actual_delivery_date = timezone.now()
            stop.order.save()
        
        serializer = self.get_serializer(stop)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def update_notes(self, request, pk=None):
        """Update delivery notes for a stop"""
        stop = self.get_object()
        notes = request.data.get('notes', '')
        
        stop.delivery_notes = notes
        stop.save()
        
        serializer = self.get_serializer(stop)
        return Response(serializer.data)


class RouteOptimizationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = RouteOptimization.objects.all()
    serializer_class = RouteOptimizationSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['route', 'success', 'optimization_type']
    ordering_fields = ['created_at']
