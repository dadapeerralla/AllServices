from django.urls import path
from .views import (
    LawyerListView, LawyerDetailView,
    LegalConsultationListCreateView, LegalConsultationDetailView,
    LegalReviewCreateView, LegalReviewListView,
)

urlpatterns = [
    path('providers/',                          LawyerListView.as_view(),                   name='lawyer-list'),
    path('providers/<int:pk>/',                 LawyerDetailView.as_view(),                 name='lawyer-detail'),
    path('bookings/',                           LegalConsultationListCreateView.as_view(),  name='legal-booking-list'),
    path('bookings/<int:pk>/',                  LegalConsultationDetailView.as_view(),      name='legal-booking-detail'),
    path('reviews/',                            LegalReviewCreateView.as_view(),            name='legal-review-create'),
    path('reviews/provider/<int:provider_id>/', LegalReviewListView.as_view(),              name='legal-review-list'),
]
