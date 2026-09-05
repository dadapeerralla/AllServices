from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display  = ['username', 'email', 'user_type', 'service_type', 'city', 'is_active']
    list_filter   = ['user_type', 'service_type', 'is_active']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    fieldsets     = UserAdmin.fieldsets + (
        ('ALL SERVICES', {'fields': ('user_type', 'service_type', 'phone', 'city')}),
    )
