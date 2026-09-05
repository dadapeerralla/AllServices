from django.urls import path
from .views import (
    LabourerListView, LabourerDetailView,
    LabourBookingListCreateView, LabourBookingDetailView,
    LabourReviewCreateView, LabourReviewListView,
)

urlpatterns = [
    path('providers/',                          LabourerListView.as_view(),              name='labourer-list'),
    path('providers/<int:pk>/',                 LabourerDetailView.as_view(),            name='labourer-detail'),
    path('bookings/',                           LabourBookingListCreateView.as_view(),   name='labour-booking-list'),
    path('bookings/<int:pk>/',                  LabourBookingDetailView.as_view(),       name='labour-booking-detail'),
    path('reviews/',                            LabourReviewCreateView.as_view(),        name='labour-review-create'),
    path('reviews/provider/<int:provider_id>/', LabourReviewListView.as_view(),          name='labour-review-list'),
]
