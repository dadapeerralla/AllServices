"""
CARPENTERS APP — Carpenters
Actions:
  Consumer  : Browse carpenters, choose work type (repair/installation/custom/assembly),
              specify materials arrangement, book, cancel, rate & review
  Carpenter : Confirm job, provide quote if needed, start, complete, view earnings
"""
from django.db import models
from django.conf import settings
from accounts.base_models import BaseProviderProfile, BaseBooking, BaseReview

WORK_TYPES = [
    ('repair',       'Furniture Repair'),
    ('installation', 'New Installation / Fittings'),
    ('custom_work',  'Custom Woodwork'),
    ('assembly',     'Flat-Pack Assembly (IKEA etc.)'),
    ('inspection',   'Site Inspection & Estimate'),
]

MATERIALS_BY = [
    ('consumer',   'Me — I provide materials'),
    ('carpenter',  'Carpenter (added to bill)'),
    ('discuss',    'Decide on site'),
]


class CarpenterProfile(BaseProviderProfile):
    wood_specialization = models.CharField(max_length=200, blank=True,
                                           help_text='E.g. Teak, Plywood, MDF, Modular')
    has_own_tools       = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Carpenter Profile'

    def __str__(self):
        return f"Carpenter: {self.user.get_full_name()}"

    def refresh_rating(self):
        from django.db.models import Avg
        qs  = CarpenterReview.objects.filter(provider=self.user)
        agg = qs.aggregate(avg=Avg('rating'))
        self.avg_rating    = agg['avg'] or 0
        self.total_reviews = qs.count()
        self.save(update_fields=['avg_rating', 'total_reviews'])


class CarpenterBooking(BaseBooking):
    carpenter              = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='carpenter_jobs',
    )
    work_type              = models.CharField(max_length=20, choices=WORK_TYPES, default='repair')
    materials_by           = models.CharField(max_length=15, choices=MATERIALS_BY, default='consumer')
    estimated_duration_hrs = models.PositiveIntegerField(default=3, help_text='Consumer estimate in hours')

    class Meta(BaseBooking.Meta):
        verbose_name = 'Carpenter Booking'

    def __str__(self):
        return f"Carpenter Booking #{self.id} — {self.get_status_display()}"


class CarpenterReview(BaseReview):
    booking = models.OneToOneField(CarpenterBooking, on_delete=models.CASCADE, related_name='review')

    class Meta:
        verbose_name = 'Carpenter Review'
