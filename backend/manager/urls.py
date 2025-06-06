from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ManagerViewSet, SupplyInventoryViewSet, 
    SupplyTransactionViewSet, DistributionPlanViewSet,
    AnalyticsViewSet
)

router = DefaultRouter()
router.register(r'managers', ManagerViewSet)
router.register(r'supply-inventory', SupplyInventoryViewSet)
router.register(r'supply-transactions', SupplyTransactionViewSet)
router.register(r'distribution-plans', DistributionPlanViewSet)
router.register(r'analytics', AnalyticsViewSet)

urlpatterns = [
    path('', include(router.urls)),
] 