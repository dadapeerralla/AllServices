from django.contrib import admin
from .models import CarpenterProfile, CarpenterBooking, CarpenterReview


@admin.register(CarpenterProfile)
class CarpenterProfileAdmin(admin.ModelAdmin):
    list_display  = ['user', 'wood_specialization', 'has_own_tools', 'is_verified', 'is_available', 'hourly_rate']
    list_editable = ['is_verified', 'is_available']


@admin.register(CarpenterBooking)
class CarpenterBookingAdmin(admin.ModelAdmin):
    list_display  = ['id', 'consumer', 'carpenter', 'work_type', 'status', 'scheduled_at', 'total_amount']
    list_filter   = ['status', 'work_type']
    list_editable = ['status']


@admin.register(CarpenterReview)
class CarpenterReviewAdmin(admin.ModelAdmin):
    list_display = ['id', 'reviewer', 'provider', 'rating']
