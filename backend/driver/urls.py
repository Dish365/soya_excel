from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DriverViewSet, DeliveryViewSet, VehicleViewSet

router = DefaultRouter()
router.register(r'drivers', DriverViewSet)
router.register(r'deliveries', DeliveryViewSet)
router.register(r'vehicles', VehicleViewSet)

urlpatterns = [
    path('', include(router.urls)),
] 