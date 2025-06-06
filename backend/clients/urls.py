from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FarmerViewSet, FeedStorageViewSet, OrderViewSet

router = DefaultRouter()
router.register(r'farmers', FarmerViewSet)
router.register(r'feed-storage', FeedStorageViewSet)
router.register(r'orders', OrderViewSet)

urlpatterns = [
    path('', include(router.urls)),
] 