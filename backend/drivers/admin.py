from django.contrib import admin
from .models import DriverProfile, DriverBooking, DriverReview


@admin.register(DriverProfile)
class DriverProfileAdmin(admin.ModelAdmin):
    list_display  = ['user', 'vehicle_type', 'is_verified', 'is_available', 'avg_rating', 'hourly_rate']
    list_editable = ['is_verified', 'is_available']
    list_filter   = ['is_verified', 'is_available', 'vehicle_type']


@admin.register(DriverBooking)
class DriverBookingAdmin(admin.ModelAdmin):
    list_display  = ['id', 'consumer', 'driver', 'trip_type', 'status', 'scheduled_at', 'total_amount']
    list_filter   = ['status', 'trip_type']
    list_editable = ['status']


@admin.register(DriverReview)
class DriverReviewAdmin(admin.ModelAdmin):
    list_display = ['id', 'reviewer', 'provider', 'rating', 'created_at']
    list_filter  = ['rating']
