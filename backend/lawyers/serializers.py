from rest_framework import serializers
from .models import LawyerProfile, LegalConsultation, LegalReview


class LawyerProfileSerializer(serializers.ModelSerializer):
    user_details = serializers.SerializerMethodField()

    class Meta:
        model  = LawyerProfile
        fields = ['id', 'user_details', 'is_verified', 'is_available', 'avg_rating', 'total_reviews',
                  'hourly_rate', 'bio', 'years_experience',
                  'bar_registration', 'practice_areas', 'languages']
        read_only_fields = ['is_verified', 'avg_rating', 'total_reviews']

    def get_user_details(self, obj):
        u = obj.user
        return {'id': u.id, 'username': u.username, 'first_name': u.first_name, 'last_name': u.last_name, 'city': u.city, 'phone': u.phone}


class LegalConsultationSerializer(serializers.ModelSerializer):
    consumer_name = serializers.SerializerMethodField()
    lawyer_name   = serializers.SerializerMethodField()
    has_review    = serializers.SerializerMethodField()

    class Meta:
        model  = LegalConsultation
        fields = ['id', 'consumer', 'consumer_name', 'lawyer', 'lawyer_name',
                  'legal_area', 'consultation_type', 'duration_minutes',
                  'address', 'city', 'scheduled_at', 'status',
                  'notes', 'total_amount', 'has_review', 'created_at']
        read_only_fields = ['consumer', 'total_amount', 'created_at']

    def get_consumer_name(self, obj):
        return obj.consumer.get_full_name() or obj.consumer.username

    def get_lawyer_name(self, obj):
        return (obj.lawyer.get_full_name() or obj.lawyer.username) if obj.lawyer else None

    def get_has_review(self, obj):
        return hasattr(obj, 'review')


class LegalConsultationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = LegalConsultation
        fields = ['lawyer', 'legal_area', 'consultation_type', 'duration_minutes',
                  'address', 'city', 'scheduled_at', 'notes']

    def create(self, validated_data):
        consumer = self.context['request'].user
        booking  = LegalConsultation(consumer=consumer, **validated_data)
        if booking.lawyer_id:
            try:
                rate = booking.lawyer.lawyer_profile.hourly_rate
                booking.total_amount = rate * (booking.duration_minutes / 60)
            except Exception:
                pass
        booking.save()
        return booking


class LegalReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.SerializerMethodField()

    class Meta:
        model  = LegalReview
        fields = ['id', 'booking', 'reviewer', 'reviewer_name', 'provider',
                  'rating', 'comment', 'created_at']
        read_only_fields = ['reviewer', 'provider', 'created_at']

    def get_reviewer_name(self, obj):
        return obj.reviewer.get_full_name() or obj.reviewer.username

    def validate_booking(self, booking):
        user = self.context['request'].user
        if booking.consumer != user:
            raise serializers.ValidationError('Not your booking.')
        if booking.status != 'completed':
            raise serializers.ValidationError('Only completed consultations can be reviewed.')
        if hasattr(booking, 'review'):
            raise serializers.ValidationError('Already reviewed.')
        return booking

    def create(self, validated_data):
        user    = self.context['request'].user
        booking = validated_data['booking']
        validated_data['reviewer'] = user
        validated_data['provider'] = booking.lawyer
        review = super().create(validated_data)
        try:
            booking.lawyer.lawyer_profile.refresh_rating()
        except Exception:
            pass
        return review
