from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from manager.models import Manager


class LoginView(APIView):
    """Custom login view that returns JWT tokens and user info"""
    permission_classes = [AllowAny]
    authentication_classes = []  # Disable authentication for login endpoint
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response(
                {'error': 'Please provide both username and password'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = authenticate(username=username, password=password)
        
        if not user:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Check if user is a manager
        try:
            manager = Manager.objects.get(user=user)
            is_manager = True
            full_name = manager.full_name
        except Manager.DoesNotExist:
            is_manager = False
            full_name = f"{user.first_name} {user.last_name}".strip() or user.username
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'token': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'full_name': full_name,
                'is_manager': is_manager,
            }
        }, status=status.HTTP_200_OK)


# Keep the function-based view as well for backwards compatibility
login = LoginView.as_view()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """Logout view (optional - frontend can just remove token)"""
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """Get current authenticated user info"""
    user = request.user
    
    try:
        manager = Manager.objects.get(user=user)
        is_manager = True
        full_name = manager.full_name
    except Manager.DoesNotExist:
        is_manager = False
        full_name = f"{user.first_name} {user.last_name}".strip() or user.username
    
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'full_name': full_name,
        'is_manager': is_manager,
    }, status=status.HTTP_200_OK) 