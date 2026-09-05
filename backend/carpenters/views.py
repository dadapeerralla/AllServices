from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import CarpenterBooking, CarpenterReview
from .serializers import (
    CarpenterProfileSerializer, CarpenterBookingSerializer,
    CarpenterBookingCreateSerializer, CarpenterReviewSerializer,
)


class CarpenterListView(generics.ListAPIView):
    serializer_class   = CarpenterProfileSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        from .models import CarpenterProfile
        qs = CarpenterProfile.objects.select_related('user').filter(is_available=True)
        city = self.request.query_params.get('city')
        if city:
            qs = qs.filter(user__city__icontains=city)
        return qs


class CarpenterDetailView(generics.RetrieveAPIView):
    serializer_class   = CarpenterProfileSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        from .models import CarpenterProfile
        return CarpenterProfile.objects.select_related('user')


class CarpenterBookingListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return CarpenterBookingCreateSerializer if self.request.method == 'POST' else CarpenterBookingSerializer

    def get_queryset(self):
        u = self.request.user
        if u.user_type == 'consumer':
            return CarpenterBooking.objects.filter(consumer=u).select_related('carpenter')
        return CarpenterBooking.objects.filter(carpenter=u).select_related('consumer')

    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        booking = ser.save()
        return Response(CarpenterBookingSerializer(booking).data, status=status.HTTP_201_CREATED)


class CarpenterBookingDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return CarpenterBookingSerializer

    def get_queryset(self):
        u = self.request.user
        if u.user_type == 'consumer':
            return CarpenterBooking.objects.filter(consumer=u)
        return CarpenterBooking.objects.filter(carpenter=u)

    def partial_update(self, request, *args, **kwargs):
        booking    = self.get_object()
        new_status = request.data.get('status')
        allowed = {
            'consumer': {'pending': ['cancelled']},
            'provider': {'pending': ['confirmed'], 'confirmed': ['in_progress'], 'in_progress': ['completed']},
        }
        role  = 'consumer' if request.user.user_type == 'consumer' else 'provider'
        valid = allowed.get(role, {}).get(booking.status, [])
        if new_status not in valid:
            return Response({'detail': 'Invalid status transition.'}, status=400)
        booking.status = new_status
        booking.save(update_fields=['status', 'updated_at'])
        return Response(CarpenterBookingSerializer(booking).data)


class CarpenterReviewCreateView(generics.CreateAPIView):
    serializer_class   = CarpenterReviewSerializer
    permission_classes = [IsAuthenticated]


class CarpenterReviewListView(generics.ListAPIView):
    serializer_class   = CarpenterReviewSerializer
    permission_classes = [AllowAny]
    pagination_class   = None

    def get_queryset(self):
        return CarpenterReview.objects.filter(
            provider_id=self.kwargs['provider_id']
        ).select_related('reviewer').order_by('-created_at')
