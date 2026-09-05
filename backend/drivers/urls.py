from django.urls import path
from .views import (
    DriverListView, DriverDetailView,
    DriverBookingListCreateView, DriverBookingDetailView,
    DriverReviewCreateView, DriverReviewListView,
)

urlpatterns = [
    path('providers/',                          DriverListView.as_view(),              name='driver-list'),
    path('providers/<int:pk>/',                 DriverDetailView.as_view(),            name='driver-detail'),
    path('bookings/',                           DriverBookingListCreateView.as_view(), name='driver-booking-list'),
    path('bookings/<int:pk>/',                  DriverBookingDetailView.as_view(),     name='driver-booking-detail'),
    path('reviews/',                            DriverReviewCreateView.as_view(),      name='driver-review-create'),
    path('reviews/provider/<int:provider_id>/', DriverReviewListView.as_view(),        name='driver-review-list'),
]
