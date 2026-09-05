from rest_framework import serializers
from .models import DriverProfile, DriverBooking, DriverReview


class DriverProfileSerializer(serializers.ModelSerializer):
    user_details = serializers.SerializerMethodField()

    class Meta:
        model  = DriverProfile
        fields = ['id', 'user_details', 'is_verified', 'is_available', 'avg_rating', 'total_reviews',
                  'hourly_rate', 'bio', 'years_experience', 'vehicle_type', 'license_number', 'languages']
        read_only_fields = ['is_verified', 'avg_rating', 'total_reviews']

    def get_user_details(self, obj):
        u = obj.user
        return {'id': u.id, 'username': u.username, 'first_name': u.first_name, 'last_name': u.last_name, 'city': u.city, 'phone': u.phone}


class DriverBookingSerializer(serializers.ModelSerializer):
    consumer_name = serializers.SerializerMethodField()
    driver_name   = serializers.SerializerMethodField()
    has_review    = serializers.SerializerMethodField()

    class Meta:
        model  = DriverBooking
        fields = ['id', 'consumer', 'consumer_name', 'driver', 'driver_name',
                  'trip_type', 'vehicle_by', 'duration_hours',
                  'address', 'city', 'scheduled_at', 'status',
                  'notes', 'total_amount', 'has_review', 'created_at']
        read_only_fields = ['consumer', 'total_amount', 'created_at']

    def get_consumer_name(self, obj):
        return obj.consumer.get_full_name() or obj.consumer.username

    def get_driver_name(self, obj):
        return (obj.driver.get_full_name() or obj.driver.username) if obj.driver else None

    def get_has_review(self, obj):
        return hasattr(obj, 'review')


class DriverBookingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = DriverBooking
        fields = ['driver', 'trip_type', 'vehicle_by', 'duration_hours',
                  'address', 'city', 'scheduled_at', 'notes']

    def create(self, validated_data):
        consumer = self.context['request'].user
        booking  = DriverBooking(consumer=consumer, **validated_data)
        if booking.driver_id:
            try:
                rate = booking.driver.driver_profile.hourly_rate
                booking.total_amount = rate * booking.duration_hours
            except Exception:
                pass
        booking.save()
        return booking


class DriverReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.SerializerMethodField()

    class Meta:
        model  = DriverReview
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
            raise serializers.ValidationError('You have already reviewed this booking.')
        return booking

    def create(self, validated_data):
        user    = self.context['request'].user
        booking = validated_data['booking']
        validated_data['reviewer'] = user
        validated_data['provider'] = booking.driver
        review = super().create(validated_data)
        try:
            booking.driver.driver_profile.refresh_rating()
        except Exception:
            pass
        return review
