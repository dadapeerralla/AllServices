from django.contrib import admin
from .models import BarberProfile, BarberBooking, BarberReview


@admin.register(BarberProfile)
class BarberProfileAdmin(admin.ModelAdmin):
    list_display  = ['user', 'specializations', 'service_radius_km', 'is_verified', 'is_available', 'hourly_rate']
    list_editable = ['is_verified', 'is_available']


@admin.register(BarberBooking)
class BarberBookingAdmin(admin.ModelAdmin):
    list_display  = ['id', 'consumer', 'barber', 'requested_services', 'status', 'scheduled_at', 'total_amount']
    list_filter   = ['status']
    list_editable = ['status']


@admin.register(BarberReview)
class BarberReviewAdmin(admin.ModelAdmin):
    list_display = ['id', 'reviewer', 'provider', 'rating']
