from django.contrib.auth.models import AbstractUser
from django.db import models

SERVICE_TYPE_CHOICES = [
    ('driver',      'Driver'),
    ('barber',      'Barber'),
    ('carpenter',   'Carpenter'),
    ('electrician', 'Electrician'),
    ('lawyer',      'Lawyer'),
    ('labourer',    'Daily Labourer'),
]


class User(AbstractUser):
    USER_TYPE_CHOICES = [('consumer', 'Consumer'), ('provider', 'Provider')]

    user_type    = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='consumer')
    service_type = models.CharField(max_length=15, choices=SERVICE_TYPE_CHOICES, null=True, blank=True)
    phone        = models.CharField(max_length=15, blank=True)
    city         = models.CharField(max_length=100, blank=True)

    def __str__(self):
        label = self.service_type if self.service_type else self.user_type
        return f"{self.get_full_name() or self.username} ({label})"
