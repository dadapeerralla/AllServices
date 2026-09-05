from django.contrib import admin
from .models import LabourerProfile, LabourBooking, LabourReview


@admin.register(LabourerProfile)
class LabourerProfileAdmin(admin.ModelAdmin):
    list_display  = ['user', 'skills', 'daily_rate', 'is_verified', 'is_available']
    list_editable = ['is_verified', 'is_available']


@admin.register(LabourBooking)
class LabourBookingAdmin(admin.ModelAdmin):
    list_display  = ['id', 'consumer', 'labourer', 'work_type', 'num_workers', 'work_days', 'status', 'total_amount']
    list_filter   = ['status', 'work_type']
    list_editable = ['status']


@admin.register(LabourReview)
class LabourReviewAdmin(admin.ModelAdmin):
    list_display = ['id', 'reviewer', 'provider', 'rating']
