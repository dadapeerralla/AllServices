from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import LegalConsultation, LegalReview
from .serializers import (
    LawyerProfileSerializer, LegalConsultationSerializer,
    LegalConsultationCreateSerializer, LegalReviewSerializer,
)


class LawyerListView(generics.ListAPIView):
    serializer_class   = LawyerProfileSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        from .models import LawyerProfile
        qs   = LawyerProfile.objects.select_related('user').filter(is_available=True)
        city = self.request.query_params.get('city')
        area = self.request.query_params.get('area')
        if city:
            qs = qs.filter(user__city__icontains=city)
        if area:
            qs = qs.filter(practice_areas__icontains=area)
        return qs


class LawyerDetailView(generics.RetrieveAPIView):
    serializer_class   = LawyerProfileSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        from .models import LawyerProfile
        return LawyerProfile.objects.select_related('user')


class LegalConsultationListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return LegalConsultationCreateSerializer if self.request.method == 'POST' else LegalConsultationSerializer

    def get_queryset(self):
        u = self.request.user
        if u.user_type == 'consumer':
            return LegalConsultation.objects.filter(consumer=u).select_related('lawyer')
        return LegalConsultation.objects.filter(lawyer=u).select_related('consumer')

    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        booking = ser.save()
        return Response(LegalConsultationSerializer(booking).data, status=status.HTTP_201_CREATED)


class LegalConsultationDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return LegalConsultationSerializer

    def get_queryset(self):
        u = self.request.user
        if u.user_type == 'consumer':
            return LegalConsultation.objects.filter(consumer=u)
        return LegalConsultation.objects.filter(lawyer=u)

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
        return Response(LegalConsultationSerializer(booking).data)


class LegalReviewCreateView(generics.CreateAPIView):
    serializer_class   = LegalReviewSerializer
    permission_classes = [IsAuthenticated]


class LegalReviewListView(generics.ListAPIView):
    serializer_class   = LegalReviewSerializer
    permission_classes = [AllowAny]
    pagination_class   = None

    def get_queryset(self):
        return LegalReview.objects.filter(
            provider_id=self.kwargs['provider_id']
        ).select_related('reviewer').order_by('-created_at')
