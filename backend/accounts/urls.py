from django.urls import path
from .views import RegisterView, ProfileView, ProviderListView, ProviderDetailView, ProviderProfileUpdateView

urlpatterns = [
    path('register/',          RegisterView.as_view(),              name='register'),
    path('profile/',           ProfileView.as_view(),               name='profile'),
    path('provider-profile/',  ProviderProfileUpdateView.as_view(), name='provider-profile'),
    path('providers/',         ProviderListView.as_view(),          name='provider-list'),
    path('providers/<int:pk>/', ProviderDetailView.as_view(),       name='provider-detail'),
]
