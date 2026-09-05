"""
LABOURERS APP — Daily Labour
Actions:
  Consumer  : Browse labourers, choose work type (moving/cleaning/construction/loading/
              gardening), specify number of workers and days, book, cancel, rate & review
  Labourer  : Confirm/decline, start, complete, view earnings
  Note      : total_amount = daily_rate × num_workers × work_days
"""
from django.db import models
from django.conf import settings
from accounts.base_models import BaseProviderProfile, BaseBooking, BaseReview

WORK_TYPES = [
    ('moving',       'House / Office Moving'),
    ('cleaning',     'Deep Cleaning'),
    ('construction', 'Construction Support'),
    ('loading',      'Loading / Unloading'),
    ('gardening',    'Garden / Landscaping'),
    ('other',        'Other / General'),
]


class LabourerProfile(BaseProviderProfile):
    skills     = models.TextField(blank=True, help_text='Comma-separated skills')
    daily_rate = models.DecimalField(max_digits=8, decimal_places=2, default=0.00,
                                     help_text='Rate per worker per day (₹)')

    class Meta:
        verbose_name = 'Labourer Profile'

    def __str__(self):
        return f"Labourer: {self.user.get_full_name()}"

    def refresh_rating(self):
        from django.db.models import Avg
        qs  = LabourReview.objects.filter(provider=self.user)
        agg = qs.aggregate(avg=Avg('rating'))
        self.avg_rating    = agg['avg'] or 0
        self.total_reviews = qs.count()
        self.save(update_fields=['avg_rating', 'total_reviews'])


class LabourBooking(BaseBooking):
    labourer    = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='labourer_jobs',
    )
    work_type   = models.CharField(max_length=20, choices=WORK_TYPES, default='other')
    num_workers = models.PositiveIntegerField(default=1)
    work_days   = models.PositiveIntegerField(default=1)

    class Meta(BaseBooking.Meta):
        verbose_name = 'Labour Booking'

    def __str__(self):
        return f"Labour Booking #{self.id} ({self.num_workers} workers × {self.work_days}d) — {self.get_status_display()}"


class LabourReview(BaseReview):
    booking = models.OneToOneField(LabourBooking, on_delete=models.CASCADE, related_name='review')

    class Meta:
        verbose_name = 'Labour Review'
