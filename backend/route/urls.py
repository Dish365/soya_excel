from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RouteViewSet, RouteStopViewSet, RouteOptimizationViewSet

router = DefaultRouter()
router.register(r'routes', RouteViewSet)
router.register(r'stops', RouteStopViewSet)
router.register(r'optimizations', RouteOptimizationViewSet)

urlpatterns = [
    path('', include(router.urls)),
] 