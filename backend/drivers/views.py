from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model
from .models import DriverBooking, DriverReview
from .serializers import (
    DriverProfileSerializer, DriverBookingSerializer,
    DriverBookingCreateSerializer, DriverReviewSerializer,
)

User = get_user_model()


class DriverListView(generics.ListAPIView):
    """Browse available drivers."""
    serializer_class   = DriverProfileSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        from .models import DriverProfile
        qs = DriverProfile.objects.select_related('user').filter(is_available=True)
        city = self.request.query_params.get('city')
        if city:
            qs = qs.filter(user__city__icontains=city)
        return qs


class DriverDetailView(generics.RetrieveAPIView):
    """Driver profile detail."""
    serializer_class   = DriverProfileSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        from .models import DriverProfile
        return DriverProfile.objects.select_related('user')


class DriverBookingListCreateView(generics.ListCreateAPIView):
    """
    GET  — Consumer sees their bookings; Driver sees their jobs.
    POST — Consumer creates a booking (picks a driver, trip type, date).
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return DriverBookingCreateSerializer if self.request.method == 'POST' else DriverBookingSerializer

    def get_queryset(self):
        u = self.request.user
        if u.user_type == 'consumer':
            return DriverBooking.objects.filter(consumer=u).select_related('driver')
        return DriverBooking.objects.filter(driver=u).select_related('consumer')

    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        booking = ser.save()
        return Response(DriverBookingSerializer(booking).data, status=status.HTTP_201_CREATED)


class DriverBookingDetailView(generics.RetrieveUpdateAPIView):
    """
    PATCH status field.
    Driver actions : confirmed → in_progress → completed
    Consumer action: pending  → cancelled
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return DriverBookingSerializer

    def get_queryset(self):
        u = self.request.user
        if u.user_type == 'consumer':
            return DriverBooking.objects.filter(consumer=u)
        return DriverBooking.objects.filter(driver=u)

    def partial_update(self, request, *args, **kwargs):
        booking    = self.get_object()
        new_status = request.data.get('status')
        allowed = {
            'consumer': {'pending': ['cancelled']},
            'provider': {
                'pending':     ['confirmed'],
                'confirmed':   ['in_progress'],
                'in_progress': ['completed'],
            },
        }
        role   = 'consumer' if request.user.user_type == 'consumer' else 'provider'
        valid  = allowed.get(role, {}).get(booking.status, [])
        if new_status not in valid:
            return Response({'detail': f'Cannot move to "{new_status}" from "{booking.status}".'}, status=400)
        booking.status = new_status
        booking.save(update_fields=['status', 'updated_at'])
        return Response(DriverBookingSerializer(booking).data)


class DriverReviewCreateView(generics.CreateAPIView):
    """Consumer submits a review after a completed driver booking."""
    serializer_class   = DriverReviewSerializer
    permission_classes = [IsAuthenticated]


class DriverReviewListView(generics.ListAPIView):
    """Public list of reviews for a specific driver."""
    serializer_class   = DriverReviewSerializer
    permission_classes = [AllowAny]
    pagination_class   = None

    def get_queryset(self):
        return DriverReview.objects.filter(
            provider_id=self.kwargs['provider_id']
        ).select_related('reviewer').order_by('-created_at')
