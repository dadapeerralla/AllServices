from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer, UserSerializer, PROFILE_MAP

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    serializer_class   = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class   = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class ProviderProfileUpdateView(generics.GenericAPIView):
    """Allow authenticated providers to update their profile (hourly_rate, bio)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.user_type != 'provider' or not user.service_type:
            return Response({'detail': 'Not a provider.'}, status=400)
        entry = PROFILE_MAP.get(user.service_type)
        if not entry:
            return Response({'detail': 'Unknown service type.'}, status=400)
        from django.apps import apps
        app_label, model_name = entry
        profile = apps.get_model(app_label, model_name).objects.filter(user=user).first()
        if not profile:
            return Response({'detail': 'Profile not found.'}, status=404)
        return Response({
            'hourly_rate': str(profile.hourly_rate),
            'bio': profile.bio,
            'years_experience': profile.years_experience,
            'is_available': profile.is_available,
            'avg_rating': str(profile.avg_rating),
            'total_reviews': profile.total_reviews,
        })

    def patch(self, request):
        user = request.user
        if user.user_type != 'provider' or not user.service_type:
            return Response({'detail': 'Not a provider.'}, status=400)
        entry = PROFILE_MAP.get(user.service_type)
        if not entry:
            return Response({'detail': 'Unknown service type.'}, status=400)
        from django.apps import apps
        app_label, model_name = entry
        profile = apps.get_model(app_label, model_name).objects.filter(user=user).first()
        if not profile:
            return Response({'detail': 'Profile not found.'}, status=404)
        allowed_fields = {'hourly_rate', 'bio', 'years_experience', 'is_available'}
        data = {k: v for k, v in request.data.items() if k in allowed_fields}
        if not data:
            return Response({'detail': 'No valid fields to update.'}, status=400)
        for field, value in data.items():
            setattr(profile, field, value)
        profile.save()
        return Response({
            'hourly_rate': str(profile.hourly_rate),
            'bio': profile.bio,
            'years_experience': profile.years_experience,
            'is_available': profile.is_available,
        })


class ProviderListView(generics.ListAPIView):
    """List all providers across all services (optionally filtered by service_type or city)."""
    serializer_class   = UserSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = User.objects.filter(user_type='provider')
        service = self.request.query_params.get('service')
        city    = self.request.query_params.get('city')
        if service:
            qs = qs.filter(service_type=service)
        if city:
            qs = qs.filter(city__icontains=city)
        return qs


class ProviderDetailView(generics.RetrieveAPIView):
    serializer_class   = UserSerializer
    permission_classes = [AllowAny]
    queryset           = User.objects.filter(user_type='provider')
