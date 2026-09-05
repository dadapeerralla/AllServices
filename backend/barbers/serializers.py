from rest_framework import serializers
from .models import BarberProfile, BarberBooking, BarberReview


class BarberProfileSerializer(serializers.ModelSerializer):
    user_details = serializers.SerializerMethodField()

    class Meta:
        model  = BarberProfile
        fields = ['id', 'user_details', 'is_verified', 'is_available', 'avg_rating', 'total_reviews',
                  'hourly_rate', 'bio', 'years_experience', 'specializations', 'service_radius_km']
        read_only_fields = ['is_verified', 'avg_rating', 'total_reviews']

    def get_user_details(self, obj):
        u = obj.user
        return {'id': u.id, 'username': u.username, 'first_name': u.first_name, 'last_name': u.last_name, 'city': u.city, 'phone': u.phone}


class BarberBookingSerializer(serializers.ModelSerializer):
    consumer_name = serializers.SerializerMethodField()
    barber_name   = serializers.SerializerMethodField()
    has_review    = serializers.SerializerMethodField()

    class Meta:
        model  = BarberBooking
        fields = ['id', 'consumer', 'consumer_name', 'barber', 'barber_name',
                  'requested_services', 'duration_estimate',
                  'address', 'city', 'scheduled_at', 'status',
                  'notes', 'total_amount', 'has_review', 'created_at']
        read_only_fields = ['consumer', 'total_amount', 'created_at']

    def get_consumer_name(self, obj):
        return obj.consumer.get_full_name() or obj.consumer.username

    def get_barber_name(self, obj):
        return (obj.barber.get_full_name() or obj.barber.username) if obj.barber else None

    def get_has_review(self, obj):
        return hasattr(obj, 'review')


class BarberBookingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = BarberBooking
        fields = ['barber', 'requested_services', 'duration_estimate',
                  'address', 'city', 'scheduled_at', 'notes']

    def create(self, validated_data):
        consumer = self.context['request'].user
        booking  = BarberBooking(consumer=consumer, **validated_data)
        if booking.barber_id:
            try:
                rate = booking.barber.barber_profile.hourly_rate
                booking.total_amount = rate * (booking.duration_estimate / 60)
            except Exception:
                pass
        booking.save()
        return booking


class BarberReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.SerializerMethodField()

    class Meta:
        model  = BarberReview
        fields = ['id', 'booking', 'reviewer', 'reviewer_name', 'provider',
                  'rating', 'comment', 'created_at']
        read_only_fields = ['reviewer', 'provider', 'created_at']

    def get_reviewer_name(self, obj):
        return obj.reviewer.get_full_name() or obj.reviewer.username

    def validate_booking(self, booking):
        user = self.context['request'].user
        if booking.consumer != user:
            raise serializers.ValidationError('You can only review your own bookings.')
        if booking.status != 'completed':
            raise serializers.ValidationError('Only completed bookings can be reviewed.')
        if hasattr(booking, 'review'):
            raise serializers.ValidationError('Already reviewed.')
        return booking

    def create(self, validated_data):
        user    = self.context['request'].user
        booking = validated_data['booking']
        validated_data['reviewer'] = user
        validated_data['provider'] = booking.barber
        review = super().create(validated_data)
        try:
            booking.barber.barber_profile.refresh_rating()
        except Exception:
            pass
        return review
