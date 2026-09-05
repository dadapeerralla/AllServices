from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import ElectricianBooking, ElectricianReview
from .serializers import (
    ElectricianProfileSerializer, ElectricianBookingSerializer,
    ElectricianBookingCreateSerializer, ElectricianReviewSerializer,
)


class ElectricianListView(generics.ListAPIView):
    serializer_class   = ElectricianProfileSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        from .models import ElectricianProfile
        qs = ElectricianProfile.objects.select_related('user').filter(is_available=True)
        city      = self.request.query_params.get('city')
        emergency = self.request.query_params.get('emergency')
        if city:
            qs = qs.filter(user__city__icontains=city)
        if emergency == 'true':
            qs = qs.filter(available_emergency=True)
        return qs


class ElectricianDetailView(generics.RetrieveAPIView):
    serializer_class   = ElectricianProfileSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        from .models import ElectricianProfile
        return ElectricianProfile.objects.select_related('user')


class ElectricianBookingListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return ElectricianBookingCreateSerializer if self.request.method == 'POST' else ElectricianBookingSerializer

    def get_queryset(self):
        u = self.request.user
        if u.user_type == 'consumer':
            return ElectricianBooking.objects.filter(consumer=u).select_related('electrician')
        return ElectricianBooking.objects.filter(electrician=u).select_related('consumer')

    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        booking = ser.save()
        return Response(ElectricianBookingSerializer(booking).data, status=status.HTTP_201_CREATED)


class ElectricianBookingDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return ElectricianBookingSerializer

    def get_queryset(self):
        u = self.request.user
        if u.user_type == 'consumer':
            return ElectricianBooking.objects.filter(consumer=u)
        return ElectricianBooking.objects.filter(electrician=u)

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
        return Response(ElectricianBookingSerializer(booking).data)


class ElectricianReviewCreateView(generics.CreateAPIView):
    serializer_class   = ElectricianReviewSerializer
    permission_classes = [IsAuthenticated]


class ElectricianReviewListView(generics.ListAPIView):
    serializer_class   = ElectricianReviewSerializer
    permission_classes = [AllowAny]
    pagination_class   = None

    def get_queryset(self):
        return ElectricianReview.objects.filter(
            provider_id=self.kwargs['provider_id']
        ).select_related('reviewer').order_by('-created_at')
