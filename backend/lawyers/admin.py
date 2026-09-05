from django.contrib import admin
from .models import LawyerProfile, LegalConsultation, LegalReview


@admin.register(LawyerProfile)
class LawyerProfileAdmin(admin.ModelAdmin):
    list_display  = ['user', 'bar_registration', 'practice_areas', 'is_verified', 'is_available', 'hourly_rate']
    list_editable = ['is_verified', 'is_available']


@admin.register(LegalConsultation)
class LegalConsultationAdmin(admin.ModelAdmin):
    list_display  = ['id', 'consumer', 'lawyer', 'legal_area', 'consultation_type', 'duration_minutes', 'status', 'total_amount']
    list_filter   = ['status', 'legal_area', 'consultation_type']
    list_editable = ['status']


@admin.register(LegalReview)
class LegalReviewAdmin(admin.ModelAdmin):
    list_display = ['id', 'reviewer', 'provider', 'rating']
