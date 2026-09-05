from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

# Maps service_type → (app_label, ModelName)
PROFILE_MAP = {
    'driver':      ('drivers',      'DriverProfile'),
    'barber':      ('barbers',      'BarberProfile'),
    'carpenter':   ('carpenters',   'CarpenterProfile'),
    'electrician': ('electricians', 'ElectricianProfile'),
    'lawyer':      ('lawyers',      'LawyerProfile'),
    'labourer':    ('labourers',    'LabourerProfile'),
}


def serialize_profile(user):
    if user.user_type != 'provider' or not user.service_type:
        return None
    entry = PROFILE_MAP.get(user.service_type)
    if not entry:
        return None
    from django.apps import apps
    import importlib
    app_label, model_name = entry
    try:
        model = apps.get_model(app_label, model_name)
        profile = model.objects.filter(user=user).first()
        if not profile:
            return None
        module = importlib.import_module(f'{app_label}.serializers')
        Ser = getattr(module, f'{model_name}Serializer')
        return Ser(profile).data
    except Exception:
        return None


class UserSerializer(serializers.ModelSerializer):
    full_name       = serializers.SerializerMethodField()
    service_profile = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'user_type', 'service_type', 'phone', 'city', 'service_profile',
        ]
        read_only_fields = ['id', 'user_type', 'service_type']

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username

    def get_service_profile(self, obj):
        return serialize_profile(obj)


class RegisterSerializer(serializers.ModelSerializer):
    """
    Handles registration for both consumers and providers.
    Provider-specific fields are sent flat alongside user fields.
    The serializer picks out what's needed based on service_type.
    """
    password = serializers.CharField(write_only=True, min_length=6)

    # Provider profile fields (all optional at serializer level; validated in create())
    hourly_rate      = serializers.DecimalField(max_digits=8, decimal_places=2, required=False, default=0)
    daily_rate       = serializers.DecimalField(max_digits=8, decimal_places=2, required=False, default=0)
    bio              = serializers.CharField(required=False, default='', allow_blank=True)
    years_experience = serializers.IntegerField(required=False, default=0)
    # Driver-specific
    vehicle_type     = serializers.CharField(required=False, allow_blank=True, default='')
    license_number   = serializers.CharField(required=False, allow_blank=True, default='')
    # Barber-specific
    specializations      = serializers.CharField(required=False, allow_blank=True, default='')
    service_radius_km    = serializers.IntegerField(required=False, default=5)
    # Carpenter-specific
    wood_specialization  = serializers.CharField(required=False, allow_blank=True, default='')
    has_own_tools        = serializers.BooleanField(required=False, default=True)
    # Electrician-specific
    available_emergency  = serializers.BooleanField(required=False, default=False)
    # Lawyer-specific
    bar_registration     = serializers.CharField(required=False, allow_blank=True, default='')
    practice_areas       = serializers.CharField(required=False, allow_blank=True, default='')
    languages            = serializers.CharField(required=False, allow_blank=True, default='')
    # Labourer-specific
    skills               = serializers.CharField(required=False, allow_blank=True, default='')

    class Meta:
        model  = User
        fields = [
            'username', 'email', 'password', 'first_name', 'last_name',
            'user_type', 'service_type', 'phone', 'city',
            'hourly_rate', 'daily_rate', 'bio', 'years_experience',
            'vehicle_type', 'license_number',
            'specializations', 'service_radius_km',
            'wood_specialization', 'has_own_tools',
            'available_emergency',
            'bar_registration', 'practice_areas', 'languages',
            'skills',
        ]

    def validate(self, data):
        if data.get('user_type') == 'provider' and not data.get('service_type'):
            raise serializers.ValidationError({'service_type': 'Please select your service type.'})
        return data

    def create(self, validated_data):
        from django.db import transaction
        with transaction.atomic():
            return self._create_atomic(validated_data)

    def _create_atomic(self, validated_data):
        # Pop all profile fields out of user data
        profile_fields = [
            'hourly_rate', 'daily_rate', 'bio', 'years_experience',
            'vehicle_type', 'license_number',
            'specializations', 'service_radius_km',
            'wood_specialization', 'has_own_tools',
            'available_emergency',
            'bar_registration', 'practice_areas', 'languages',
            'skills',
        ]
        profile_data = {f: validated_data.pop(f, None) for f in profile_fields}

        user = User.objects.create_user(**validated_data)

        if user.user_type == 'provider' and user.service_type:
            self._create_profile(user, profile_data)

        return user

    def _create_profile(self, user, data):
        from django.apps import apps
        entry = PROFILE_MAP.get(user.service_type)
        if not entry:
            return
        app_label, model_name = entry

        # Build kwargs relevant to this service
        common = {
            'user': user,
            'hourly_rate': data.get('hourly_rate') or 0,
            'bio': data.get('bio') or '',
            'years_experience': data.get('years_experience') or 0,
        }

        extra = {}
        st = user.service_type
        if st == 'driver':
            extra = {'vehicle_type': data.get('vehicle_type') or 'sedan',
                     'license_number': data.get('license_number') or ''}
        elif st == 'barber':
            extra = {'specializations': data.get('specializations') or '',
                     'service_radius_km': data.get('service_radius_km') or 5}
        elif st == 'carpenter':
            extra = {'wood_specialization': data.get('wood_specialization') or '',
                     'has_own_tools': data.get('has_own_tools') if data.get('has_own_tools') is not None else True}
        elif st == 'electrician':
            extra = {'license_number': data.get('license_number') or '',
                     'available_emergency': data.get('available_emergency') or False}
        elif st == 'lawyer':
            extra = {'bar_registration': data.get('bar_registration') or '',
                     'practice_areas': data.get('practice_areas') or '',
                     'languages': data.get('languages') or ''}
            common['hourly_rate'] = data.get('hourly_rate') or 0
        elif st == 'labourer':
            extra = {'skills': data.get('skills') or '',
                     'daily_rate': data.get('daily_rate') or 0}
            common.pop('hourly_rate')

        ProfileModel = apps.get_model(app_label, model_name)
        ProfileModel.objects.create(**common, **extra)
