"""
DRIVERS APP — Drivers on Hire
Actions:
  Consumer : Browse drivers, book (hourly/outstation/airport), cancel, rate & review
  Driver   : Set availability, confirm/decline, start job, end job, view earnings
"""
from django.db import models
from django.conf import settings
from accounts.base_models import BaseProviderProfile, BaseBooking, BaseReview, BOOKING_STATUS

VEHICLE_TYPES = [
    ('hatchback', 'Hatchback'),
    ('sedan',     'Sedan'),
    ('suv',       'SUV / MUV'),
    ('van',       'Van / Traveller'),
]

TRIP_TYPES = [
    ('hourly',        'Hourly (personal car)'),
    ('outstation',    'Outstation Trip'),
    ('airport',       'Airport Pickup / Drop'),
    ('local_commute', 'Daily Commute'),
]

VEHICLE_BY = [
    ('consumer', "Consumer's car"),
    ('driver',   "Driver's car"),
]


class DriverProfile(BaseProviderProfile):
    vehicle_type   = models.CharField(max_length=15, choices=VEHICLE_TYPES, default='sedan')
    license_number = models.CharField(max_length=50, blank=True)
    languages      = models.CharField(max_length=200, blank=True, help_text='Comma-separated')

    class Meta:
        verbose_name = 'Driver Profile'

    def __str__(self):
        return f"Driver: {self.user.get_full_name()}"

    def _get_review_qs(self):
        return DriverReview.objects.filter(provider=self.user)

    def refresh_rating(self):
        from django.db.models import Avg
        qs  = self._get_review_qs()
        agg = qs.aggregate(avg=Avg('rating'))
        self.avg_rating   = agg['avg'] or 0
        self.total_reviews = qs.count()
        self.save(update_fields=['avg_rating', 'total_reviews'])


class DriverBooking(BaseBooking):
    driver     = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='driver_jobs',
    )
    trip_type   = models.CharField(max_length=20, choices=TRIP_TYPES, default='hourly')
    vehicle_by  = models.CharField(max_length=10, choices=VEHICLE_BY, default='consumer')
    duration_hours = models.PositiveIntegerField(default=3)

    class Meta(BaseBooking.Meta):
        verbose_name = 'Driver Booking'

    def __str__(self):
        return f"Driver Booking #{self.id} — {self.get_status_display()}"


class DriverReview(BaseReview):
    booking = models.OneToOneField(DriverBooking, on_delete=models.CASCADE, related_name='review')

    class Meta:
        verbose_name = 'Driver Review'

    def __str__(self):
        return f"{self.reviewer} → {self.provider}: {self.rating}★"
