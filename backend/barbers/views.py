from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model
from .models import BarberBooking, BarberReview
from .serializers import (
    BarberProfileSerializer, BarberBookingSerializer,
    BarberBookingCreateSerializer, BarberReviewSerializer,
)

User = get_user_model()


class BarberListView(generics.ListAPIView):
    serializer_class   = BarberProfileSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        from .models import BarberProfile
        qs = BarberProfile.objects.select_related('user').filter(is_available=True)
        city = self.request.query_params.get('city')
        if city:
            qs = qs.filter(user__city__icontains=city)
        return qs


class BarberDetailView(generics.RetrieveAPIView):
    serializer_class   = BarberProfileSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        from .models import BarberProfile
        return BarberProfile.objects.select_related('user')


class BarberBookingListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return BarberBookingCreateSerializer if self.request.method == 'POST' else BarberBookingSerializer

    def get_queryset(self):
        u = self.request.user
        if u.user_type == 'consumer':
            return BarberBooking.objects.filter(consumer=u).select_related('barber')
        return BarberBooking.objects.filter(barber=u).select_related('consumer')

    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        booking = ser.save()
        return Response(BarberBookingSerializer(booking).data, status=status.HTTP_201_CREATED)


class BarberBookingDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return BarberBookingSerializer

    def get_queryset(self):
        u = self.request.user
        if u.user_type == 'consumer':
            return BarberBooking.objects.filter(consumer=u)
        return BarberBooking.objects.filter(barber=u)

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
        role  = 'consumer' if request.user.user_type == 'consumer' else 'provider'
        valid = allowed.get(role, {}).get(booking.status, [])
        if new_status not in valid:
            return Response({'detail': f'Invalid status transition.'}, status=400)
        booking.status = new_status
        booking.save(update_fields=['status', 'updated_at'])
        return Response(BarberBookingSerializer(booking).data)


class BarberReviewCreateView(generics.CreateAPIView):
    serializer_class   = BarberReviewSerializer
    permission_classes = [IsAuthenticated]


class BarberReviewListView(generics.ListAPIView):
    serializer_class   = BarberReviewSerializer
    permission_classes = [AllowAny]
    pagination_class   = None

    def get_queryset(self):
        return BarberReview.objects.filter(
            provider_id=self.kwargs['provider_id']
        ).select_related('reviewer').order_by('-created_at')
