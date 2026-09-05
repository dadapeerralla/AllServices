from django.urls import path
from .views import (
    BarberListView, BarberDetailView,
    BarberBookingListCreateView, BarberBookingDetailView,
    BarberReviewCreateView, BarberReviewListView,
)

urlpatterns = [
    path('providers/',                          BarberListView.as_view(),              name='barber-list'),
    path('providers/<int:pk>/',                 BarberDetailView.as_view(),            name='barber-detail'),
    path('bookings/',                           BarberBookingListCreateView.as_view(), name='barber-booking-list'),
    path('bookings/<int:pk>/',                  BarberBookingDetailView.as_view(),     name='barber-booking-detail'),
    path('reviews/',                            BarberReviewCreateView.as_view(),      name='barber-review-create'),
    path('reviews/provider/<int:provider_id>/', BarberReviewListView.as_view(),        name='barber-review-list'),
]
