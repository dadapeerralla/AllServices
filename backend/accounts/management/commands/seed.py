"""
Seed command: creates sample providers for all 6 service apps + a test consumer.
Run: python manage.py seed
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

PROVIDERS = [
    # Drivers
    dict(username='rajan_driver',  first_name='Rajan',  last_name='Sharma',    city='Mumbai',    service_type='driver',
         profile=dict(vehicle_type='sedan',  license_number='MH-01-2020-123456', hourly_rate=150, bio='8 years, know every Mumbai shortcut.', years_experience=8)),
    dict(username='vijay_driver',  first_name='Vijay',  last_name='Kumar',     city='Delhi',     service_type='driver',
         profile=dict(vehicle_type='suv',    license_number='DL-01-2019-789012', hourly_rate=200, bio='Former corporate driver, impeccable record.', years_experience=5)),
    dict(username='arjun_driver',  first_name='Arjun',  last_name='Nair',      city='Bangalore', service_type='driver',
         profile=dict(vehicle_type='hatchback', license_number='KA-01-2021-345678', hourly_rate=160, bio='Clean record. Fluent in Kannada, Hindi, English.', years_experience=4)),
    # Barbers
    dict(username='mohit_barber',  first_name='Mohit',  last_name='Singh',     city='Mumbai',    service_type='barber',
         profile=dict(specializations='Haircut,Beard Trim,Shave,Facial', service_radius_km=10, hourly_rate=300, bio='Trained at VLCC. Modern cuts and classic shaves.', years_experience=7)),
    dict(username='rahul_barber',  first_name='Rahul',  last_name='Verma',     city='Delhi',     service_type='barber',
         profile=dict(specializations='Haircut,Kids Cut,Hair Wash & Style', service_radius_km=8, hourly_rate=250, bio='Friendly, fast, and precise. Kids\' specialist.', years_experience=4)),
    # Carpenters
    dict(username='suresh_carpenter', first_name='Suresh', last_name='Patel',  city='Ahmedabad', service_type='carpenter',
         profile=dict(wood_specialization='Teak, Plywood, Modular', has_own_tools=True, hourly_rate=350, bio='12 years. Modular kitchen and custom furniture expert.', years_experience=12)),
    dict(username='ramesh_carpenter', first_name='Ramesh', last_name='Yadav',  city='Mumbai',    service_type='carpenter',
         profile=dict(wood_specialization='MDF, Plywood, Solid Wood', has_own_tools=True, hourly_rate=300, bio='Repair and installation. Flat-pack assembly in hours.', years_experience=9)),
    # Electricians
    dict(username='anil_electrician', first_name='Anil',   last_name='Joshi',  city='Pune',      service_type='electrician',
         profile=dict(license_number='EL-PUNE-2018-001', available_emergency=True,  hourly_rate=400, bio='Licensed. Available for emergencies 24/7.', years_experience=10)),
    dict(username='deepak_electrical', first_name='Deepak', last_name='Gupta', city='Delhi',     service_type='electrician',
         profile=dict(license_number='EL-DL-2019-045',   available_emergency=False, hourly_rate=350, bio='Panel upgrades, wiring, new installations.', years_experience=7)),
    # Lawyers
    dict(username='adv_priya',    first_name='Priya',  last_name='Iyer',       city='Chennai',   service_type='lawyer',
         profile=dict(bar_registration='TN-BAR-2014-0432', practice_areas='property,family,civil', languages='Tamil, English', hourly_rate=600, bio='10 years in property and family law. Free 10-min intro.', years_experience=10)),
    dict(username='adv_anand',    first_name='Anand',  last_name='Krishnan',   city='Bangalore', service_type='lawyer',
         profile=dict(bar_registration='KA-BAR-2016-0891', practice_areas='labour,business,civil', languages='Kannada, Hindi, English', hourly_rate=500, bio='Labour and business law specialist.', years_experience=8)),
    # Labourers
    dict(username='santosh_labour', first_name='Santosh', last_name='Mishra',  city='Mumbai',    service_type='labourer',
         profile=dict(skills='moving,cleaning,loading', daily_rate=700, bio='Reliable team leader. Handles moving and cleaning.', years_experience=5)),
    dict(username='ravi_labour',    first_name='Ravi',    last_name='Prasad',  city='Pune',      service_type='labourer',
         profile=dict(skills='construction,loading,gardening', daily_rate=600, bio='Construction support and heavy lifting.', years_experience=3)),
]


def create_profile(user, data):
    from django.apps import apps
    model_map = {
        'driver':      ('drivers',      'DriverProfile'),
        'barber':      ('barbers',      'BarberProfile'),
        'carpenter':   ('carpenters',   'CarpenterProfile'),
        'electrician': ('electricians', 'ElectricianProfile'),
        'lawyer':      ('lawyers',      'LawyerProfile'),
        'labourer':    ('labourers',    'LabourerProfile'),
    }
    app_label, model_name = model_map[user.service_type]
    Model = apps.get_model(app_label, model_name)
    if not Model.objects.filter(user=user).exists():
        Model.objects.create(user=user, is_verified=True, **data)


class Command(BaseCommand):
    help = 'Seed database with sample providers across all 6 service apps'

    def handle(self, *args, **kwargs):
        for p in PROVIDERS:
            profile_data = p.pop('profile')
            username = p['username']
            user, created = User.objects.get_or_create(
                username=username,
                defaults={**p, 'user_type': 'provider', 'phone': '9999999999'},
            )
            if created:
                user.set_password('password123')
                user.save()
                self.stdout.write(f'  Created provider: {user.get_full_name()} ({user.service_type})')
            create_profile(user, profile_data)
            p['profile'] = profile_data  # restore for next run safety

        # Test consumer
        if not User.objects.filter(username='testconsumer').exists():
            c = User.objects.create_user(
                username='testconsumer', password='password123',
                first_name='Test', last_name='User',
                email='consumer@allservices.in',
                user_type='consumer', city='Mumbai', phone='9888888888',
            )
            self.stdout.write(f'  Created consumer: {c.username}')

        # Superuser
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'admin@allservices.in', 'admin123')
            self.stdout.write('  Created superuser: admin / admin123')

        self.stdout.write(self.style.SUCCESS(
            '\nSeed complete!\n'
            '  Consumer login : testconsumer / password123\n'
            '  Driver login   : rajan_driver / password123\n'
            '  Admin panel    : admin / admin123'
        ))
