"""
Abstract base models shared by all 6 service apps.
Each app inherits these and adds service-specific fields.
"""
from django.db import models
from django.conf import settings

BOOKING_STATUS = [
    ('pending',     'Pending'),
    ('confirmed',   'Confirmed'),
    ('in_progress', 'In Progress'),
    ('completed',   'Completed'),
    ('cancelled',   'Cancelled'),
]


class BaseProviderProfile(models.Model):
    user             = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    is_verified      = models.BooleanField(default=False)
    is_available     = models.BooleanField(default=True)
    avg_rating       = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    total_reviews    = models.PositiveIntegerField(default=0)
    hourly_rate      = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    bio              = models.TextField(blank=True)
    years_experience = models.PositiveIntegerField(default=0)

    class Meta:
        abstract = True


class BaseBooking(models.Model):
    consumer     = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='%(app_label)s_%(class)s_as_consumer',
    )
    address      = models.TextField()
    city         = models.CharField(max_length=100)
    scheduled_at = models.DateTimeField()
    status       = models.CharField(max_length=20, choices=BOOKING_STATUS, default='pending')
    notes        = models.TextField(blank=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ['-created_at']


class BaseReview(models.Model):
    reviewer   = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='%(app_label)s_%(class)s_as_reviewer',
    )
    provider   = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='%(app_label)s_%(class)s_as_provider',
    )
    rating     = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    comment    = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        abstract = True
