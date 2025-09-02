from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ManagerViewSet, SoybeanMealProductViewSet, SupplyInventoryViewSet, 
    SupplyTransactionViewSet, WeeklyDistributionPlanViewSet,
    MonthlyDistributionPlanViewSet, KPIMetricsViewSet
)

router = DefaultRouter()
router.register(r'managers', ManagerViewSet)
router.register(r'soybean-products', SoybeanMealProductViewSet)
router.register(r'supply-inventory', SupplyInventoryViewSet)
router.register(r'supply-transactions', SupplyTransactionViewSet)
router.register(r'weekly-plans', WeeklyDistributionPlanViewSet)
router.register(r'monthly-plans', MonthlyDistributionPlanViewSet)
router.register(r'kpi-metrics', KPIMetricsViewSet)

urlpatterns = [
    path('', include(router.urls)),
] 