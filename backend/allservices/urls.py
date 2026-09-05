from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    # Auth
    path('api/auth/token/',         TokenObtainPairView.as_view(),  name='token_obtain'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(),     name='token_refresh'),
    path('api/auth/',               include('accounts.urls')),
    # Service apps — each mounted at its own /api/{service}/ namespace
    path('api/drivers/',      include('drivers.urls')),
    path('api/barbers/',      include('barbers.urls')),
    path('api/carpenters/',   include('carpenters.urls')),
    path('api/electricians/', include('electricians.urls')),
    path('api/lawyers/',      include('lawyers.urls')),
    path('api/labourers/',    include('labourers.urls')),
]
