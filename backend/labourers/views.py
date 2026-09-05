from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import LabourBooking, LabourReview
from .serializers import (
    LabourerProfileSerializer, LabourBookingSerializer,
    LabourBookingCreateSerializer, LabourReviewSerializer,
)


class LabourerListView(generics.ListAPIView):
    serializer_class   = LabourerProfileSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        from .models import LabourerProfile
        qs   = LabourerProfile.objects.select_related('user').filter(is_available=True)
        city = self.request.query_params.get('city')
        skill = self.request.query_params.get('skill')
        if city:
            qs = qs.filter(user__city__icontains=city)
        if skill:
            qs = qs.filter(skills__icontains=skill)
        return qs


class LabourerDetailView(generics.RetrieveAPIView):
    serializer_class   = LabourerProfileSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        from .models import LabourerProfile
        return LabourerProfile.objects.select_related('user')


class LabourBookingListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return LabourBookingCreateSerializer if self.request.method == 'POST' else LabourBookingSerializer

    def get_queryset(self):
        u = self.request.user
        if u.user_type == 'consumer':
            return LabourBooking.objects.filter(consumer=u).select_related('labourer')
        return LabourBooking.objects.filter(labourer=u).select_related('consumer')

    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        booking = ser.save()
        return Response(LabourBookingSerializer(booking).data, status=status.HTTP_201_CREATED)


class LabourBookingDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return LabourBookingSerializer

    def get_queryset(self):
        u = self.request.user
        if u.user_type == 'consumer':
            return LabourBooking.objects.filter(consumer=u)
        return LabourBooking.objects.filter(labourer=u)

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
        return Response(LabourBookingSerializer(booking).data)


class LabourReviewCreateView(generics.CreateAPIView):
    serializer_class   = LabourReviewSerializer
    permission_classes = [IsAuthenticated]


class LabourReviewListView(generics.ListAPIView):
    serializer_class   = LabourReviewSerializer
    permission_classes = [AllowAny]
    pagination_class   = None

    def get_queryset(self):
        return LabourReview.objects.filter(
            provider_id=self.kwargs['provider_id']
        ).select_related('reviewer').order_by('-created_at')
