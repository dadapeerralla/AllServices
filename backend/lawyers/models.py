"""
LAWYERS APP — Legal Services
Actions:
  Consumer : Browse advocates by legal area, book consultation (initial/follow-up/
             document review/contract review), choose duration, cancel, rate & review
  Lawyer   : Confirm, start consultation, mark completed, view earnings
"""
from django.db import models
from django.conf import settings
from accounts.base_models import BaseProviderProfile, BaseBooking, BaseReview

LEGAL_AREAS = [
    ('property',  'Property Law'),
    ('family',    'Family / Divorce'),
    ('labour',    'Labour / Employment'),
    ('criminal',  'Criminal Defence'),
    ('business',  'Business / Contract'),
    ('civil',     'Civil Dispute'),
    ('other',     'Other'),
]

CONSULTATION_TYPES = [
    ('initial',           'Initial Consultation'),
    ('follow_up',         'Follow-up Session'),
    ('document_review',   'Document Review'),
    ('contract_review',   'Contract Review'),
]

DURATION_CHOICES = [
    (30,  '30 minutes'),
    (60,  '1 hour'),
    (90,  '90 minutes'),
]


class LawyerProfile(BaseProviderProfile):
    bar_registration = models.CharField(max_length=100, blank=True, help_text='Bar Council registration no.')
    practice_areas   = models.TextField(blank=True, help_text='Comma-separated legal areas')
    languages        = models.CharField(max_length=200, blank=True)

    class Meta:
        verbose_name = 'Lawyer Profile'

    def __str__(self):
        return f"Advocate: {self.user.get_full_name()}"

    def refresh_rating(self):
        from django.db.models import Avg
        qs  = LegalReview.objects.filter(provider=self.user)
        agg = qs.aggregate(avg=Avg('rating'))
        self.avg_rating    = agg['avg'] or 0
        self.total_reviews = qs.count()
        self.save(update_fields=['avg_rating', 'total_reviews'])


class LegalConsultation(BaseBooking):
    """Booking model for legal consultations (renamed for domain clarity)."""
    lawyer            = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='lawyer_jobs',
    )
    legal_area        = models.CharField(max_length=15, choices=LEGAL_AREAS, default='other')
    consultation_type = models.CharField(max_length=20, choices=CONSULTATION_TYPES, default='initial')
    duration_minutes  = models.IntegerField(choices=DURATION_CHOICES, default=60)

    class Meta(BaseBooking.Meta):
        verbose_name = 'Legal Consultation'

    def __str__(self):
        return f"Legal Consultation #{self.id} ({self.get_legal_area_display()}) — {self.get_status_display()}"


class LegalReview(BaseReview):
    booking = models.OneToOneField(LegalConsultation, on_delete=models.CASCADE, related_name='review')

    class Meta:
        verbose_name = 'Legal Review'
