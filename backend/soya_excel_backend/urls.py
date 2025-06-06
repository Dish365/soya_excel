"""
URL configuration for soya_excel_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from .auth_views import login, logout, get_current_user

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API routes
    path('api/clients/', include('clients.urls')),
    path('api/drivers/', include('driver.urls')),
    path('api/routes/', include('route.urls')),
    path('api/manager/', include('manager.urls')),
    
    # Authentication
    path('api/auth/login/', login, name='api-login'),
    path('api/auth/logout/', logout, name='api-logout'),
    path('api/auth/user/', get_current_user, name='api-current-user'),
    
    # API Documentation (uncomment after installing drf-spectacular)
    # path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    # path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    # path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]
