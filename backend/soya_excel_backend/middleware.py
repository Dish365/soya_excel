from django.utils.deprecation import MiddlewareMixin


class DisableCSRFMiddleware(MiddlewareMixin):
    """Middleware to disable CSRF for API endpoints"""
    
    def process_request(self, request):
        # Disable CSRF for all /api/ endpoints
        if request.path.startswith('/api/'):
            setattr(request, '_dont_enforce_csrf_checks', True)
        return None 