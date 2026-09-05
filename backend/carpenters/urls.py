from django.urls import path
from .views import (
    CarpenterListView, CarpenterDetailView,
    CarpenterBookingListCreateView, CarpenterBookingDetailView,
    CarpenterReviewCreateView, CarpenterReviewListView,
)

urlpatterns = [
    path('providers/',                          CarpenterListView.as_view(),              name='carpenter-list'),
    path('providers/<int:pk>/',                 CarpenterDetailView.as_view(),            name='carpenter-detail'),
    path('bookings/',                           CarpenterBookingListCreateView.as_view(), name='carpenter-booking-list'),
    path('bookings/<int:pk>/',                  CarpenterBookingDetailView.as_view(),     name='carpenter-booking-detail'),
    path('reviews/',                            CarpenterReviewCreateView.as_view(),      name='carpenter-review-create'),
    path('reviews/provider/<int:provider_id>/', CarpenterReviewListView.as_view(),        name='carpenter-review-list'),
]
