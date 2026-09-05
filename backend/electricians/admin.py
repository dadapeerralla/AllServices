from django.contrib import admin
from .models import ElectricianProfile, ElectricianBooking, ElectricianReview


@admin.register(ElectricianProfile)
class ElectricianProfileAdmin(admin.ModelAdmin):
    list_display  = ['user', 'license_number', 'available_emergency', 'is_verified', 'is_available', 'hourly_rate']
    list_editable = ['is_verified', 'is_available']


@admin.register(ElectricianBooking)
class ElectricianBookingAdmin(admin.ModelAdmin):
    list_display  = ['id', 'consumer', 'electrician', 'priority', 'work_type', 'status', 'total_amount']
    list_filter   = ['status', 'priority', 'work_type']
    list_editable = ['status']


@admin.register(ElectricianReview)
class ElectricianReviewAdmin(admin.ModelAdmin):
    list_display = ['id', 'reviewer', 'provider', 'rating']
