"""
ELECTRICIANS APP — Electricians
Actions:
  Consumer     : Browse electricians, set priority (normal/urgent/emergency),
                 choose work type, book, cancel, rate & review
  Electrician  : Confirm, start, complete, view earnings
  Note         : Emergency bookings are flagged prominently for fast response
"""
from django.db import models
from django.conf import settings
from accounts.base_models import BaseProviderProfile, BaseBooking, BaseReview

PRIORITY_LEVELS = [
    ('normal',    'Normal — schedule for later'),
    ('urgent',    'Urgent — within a few hours'),
    ('emergency', '🚨 Emergency — right now'),
]

WORK_TYPES = [
    ('repair',        'Fault Repair'),
    ('wiring',        'Wiring / Rewiring'),
    ('installation',  'New Installation (fan, AC, light)'),
    ('panel_upgrade', 'Panel / MCB Upgrade'),
    ('inspection',    'Safety Inspection'),
]


class ElectricianProfile(BaseProviderProfile):
    license_number      = models.CharField(max_length=100, blank=True)
    available_emergency = models.BooleanField(default=False, help_text='Willing to take emergency calls')

    class Meta:
        verbose_name = 'Electrician Profile'

    def __str__(self):
        return f"Electrician: {self.user.get_full_name()}"

    def refresh_rating(self):
        from django.db.models import Avg
        qs  = ElectricianReview.objects.filter(provider=self.user)
        agg = qs.aggregate(avg=Avg('rating'))
        self.avg_rating    = agg['avg'] or 0
        self.total_reviews = qs.count()
        self.save(update_fields=['avg_rating', 'total_reviews'])


class ElectricianBooking(BaseBooking):
    electrician            = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='electrician_jobs',
    )
    priority               = models.CharField(max_length=15, choices=PRIORITY_LEVELS, default='normal')
    work_type              = models.CharField(max_length=20, choices=WORK_TYPES, default='repair')
    estimated_duration_hrs = models.PositiveIntegerField(default=2)

    class Meta(BaseBooking.Meta):
        verbose_name = 'Electrician Booking'

    def __str__(self):
        return f"Electrician Booking #{self.id} [{self.priority}] — {self.get_status_display()}"


class ElectricianReview(BaseReview):
    booking = models.OneToOneField(ElectricianBooking, on_delete=models.CASCADE, related_name='review')

    class Meta:
        verbose_name = 'Electrician Review'
