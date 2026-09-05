from django.urls import path
from .views import (
    ElectricianListView, ElectricianDetailView,
    ElectricianBookingListCreateView, ElectricianBookingDetailView,
    ElectricianReviewCreateView, ElectricianReviewListView,
)

urlpatterns = [
    path('providers/',                          ElectricianListView.as_view(),              name='electrician-list'),
    path('providers/<int:pk>/',                 ElectricianDetailView.as_view(),            name='electrician-detail'),
    path('bookings/',                           ElectricianBookingListCreateView.as_view(), name='electrician-booking-list'),
    path('bookings/<int:pk>/',                  ElectricianBookingDetailView.as_view(),     name='electrician-booking-detail'),
    path('reviews/',                            ElectricianReviewCreateView.as_view(),      name='electrician-review-create'),
    path('reviews/provider/<int:provider_id>/', ElectricianReviewListView.as_view(),        name='electrician-review-list'),
]
