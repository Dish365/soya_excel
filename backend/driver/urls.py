from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DriverViewSet, DeliveryViewSet

router = DefaultRouter()
router.register(r'drivers', DriverViewSet)
router.register(r'deliveries', DeliveryViewSet)

urlpatterns = [
    path('', include(router.urls)),
] 