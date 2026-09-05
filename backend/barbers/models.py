"""
BARBERS APP — Home Barber
Actions:
  Consumer : Browse barbers, select services (haircut/beard/shave/facial/kids cut),
             book home appointment, cancel, rate & review
  Barber   : Set availability, confirm/decline, mark arrived, start, complete, view earnings
"""
from django.db import models
from django.conf import settings
from accounts.base_models import BaseProviderProfile, BaseBooking, BaseReview

BARBER_SERVICES = [
    'Haircut', 'Beard Trim', 'Clean Shave', "Kids' Cut",
    'Hair Wash & Style', 'Facial', 'Head Massage',
]


class BarberProfile(BaseProviderProfile):
    specializations   = models.TextField(blank=True, help_text='Comma-separated service offerings')
    service_radius_km = models.PositiveIntegerField(default=5, help_text='Max travel distance in km')

    class Meta:
        verbose_name = 'Barber Profile'

    def __str__(self):
        return f"Barber: {self.user.get_full_name()}"

    def refresh_rating(self):
        from django.db.models import Avg
        qs  = BarberReview.objects.filter(provider=self.user)
        agg = qs.aggregate(avg=Avg('rating'))
        self.avg_rating    = agg['avg'] or 0
        self.total_reviews = qs.count()
        self.save(update_fields=['avg_rating', 'total_reviews'])


class BarberBooking(BaseBooking):
    barber             = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='barber_jobs',
    )
    requested_services = models.TextField(help_text='Comma-separated selected services')
    duration_estimate  = models.PositiveIntegerField(default=60, help_text='Estimated minutes')

    class Meta(BaseBooking.Meta):
        verbose_name = 'Barber Booking'

    def __str__(self):
        return f"Barber Booking #{self.id} — {self.get_status_display()}"


class BarberReview(BaseReview):
    booking = models.OneToOneField(BarberBooking, on_delete=models.CASCADE, related_name='review')

    class Meta:
        verbose_name = 'Barber Review'
