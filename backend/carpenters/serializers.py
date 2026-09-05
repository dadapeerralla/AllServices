from rest_framework import serializers
from .models import CarpenterProfile, CarpenterBooking, CarpenterReview


class CarpenterProfileSerializer(serializers.ModelSerializer):
    user_details = serializers.SerializerMethodField()

    class Meta:
        model  = CarpenterProfile
        fields = ['id', 'user_details', 'is_verified', 'is_available', 'avg_rating', 'total_reviews',
                  'hourly_rate', 'bio', 'years_experience', 'wood_specialization', 'has_own_tools']
        read_only_fields = ['is_verified', 'avg_rating', 'total_reviews']

    def get_user_details(self, obj):
        u = obj.user
        return {'id': u.id, 'username': u.username, 'first_name': u.first_name, 'last_name': u.last_name, 'city': u.city, 'phone': u.phone}


class CarpenterBookingSerializer(serializers.ModelSerializer):
    consumer_name  = serializers.SerializerMethodField()
    carpenter_name = serializers.SerializerMethodField()
    has_review     = serializers.SerializerMethodField()

    class Meta:
        model  = CarpenterBooking
        fields = ['id', 'consumer', 'consumer_name', 'carpenter', 'carpenter_name',
                  'work_type', 'materials_by', 'estimated_duration_hrs',
                  'address', 'city', 'scheduled_at', 'status',
                  'notes', 'total_amount', 'has_review', 'created_at']
        read_only_fields = ['consumer', 'total_amount', 'created_at']

    def get_consumer_name(self, obj):
        return obj.consumer.get_full_name() or obj.consumer.username

    def get_carpenter_name(self, obj):
        return (obj.carpenter.get_full_name() or obj.carpenter.username) if obj.carpenter else None

    def get_has_review(self, obj):
        return hasattr(obj, 'review')


class CarpenterBookingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = CarpenterBooking
        fields = ['carpenter', 'work_type', 'materials_by', 'estimated_duration_hrs',
                  'address', 'city', 'scheduled_at', 'notes']

    def create(self, validated_data):
        consumer = self.context['request'].user
        booking  = CarpenterBooking(consumer=consumer, **validated_data)
        if booking.carpenter_id:
            try:
                rate = booking.carpenter.carpenter_profile.hourly_rate
                booking.total_amount = rate * booking.estimated_duration_hrs
            except Exception:
                pass
        booking.save()
        return booking


class CarpenterReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.SerializerMethodField()

    class Meta:
        model  = CarpenterReview
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
            raise serializers.ValidationError('Only completed bookings can be reviewed.')
        if hasattr(booking, 'review'):
            raise serializers.ValidationError('Already reviewed.')
        return booking

    def create(self, validated_data):
        user    = self.context['request'].user
        booking = validated_data['booking']
        validated_data['reviewer'] = user
        validated_data['provider'] = booking.carpenter
        review = super().create(validated_data)
        try:
            booking.carpenter.carpenter_profile.refresh_rating()
        except Exception:
            pass
        return review
