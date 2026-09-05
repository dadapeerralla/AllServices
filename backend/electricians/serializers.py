from rest_framework import serializers
from .models import ElectricianProfile, ElectricianBooking, ElectricianReview


class ElectricianProfileSerializer(serializers.ModelSerializer):
    user_details = serializers.SerializerMethodField()

    class Meta:
        model  = ElectricianProfile
        fields = ['id', 'user_details', 'is_verified', 'is_available', 'avg_rating', 'total_reviews',
                  'hourly_rate', 'bio', 'years_experience', 'license_number', 'available_emergency']
        read_only_fields = ['is_verified', 'avg_rating', 'total_reviews']

    def get_user_details(self, obj):
        u = obj.user
        return {'id': u.id, 'username': u.username, 'first_name': u.first_name, 'last_name': u.last_name, 'city': u.city, 'phone': u.phone}


class ElectricianBookingSerializer(serializers.ModelSerializer):
    consumer_name     = serializers.SerializerMethodField()
    electrician_name  = serializers.SerializerMethodField()
    has_review        = serializers.SerializerMethodField()

    class Meta:
        model  = ElectricianBooking
        fields = ['id', 'consumer', 'consumer_name', 'electrician', 'electrician_name',
                  'priority', 'work_type', 'estimated_duration_hrs',
                  'address', 'city', 'scheduled_at', 'status',
                  'notes', 'total_amount', 'has_review', 'created_at']
        read_only_fields = ['consumer', 'total_amount', 'created_at']

    def get_consumer_name(self, obj):
        return obj.consumer.get_full_name() or obj.consumer.username

    def get_electrician_name(self, obj):
        return (obj.electrician.get_full_name() or obj.electrician.username) if obj.electrician else None

    def get_has_review(self, obj):
        return hasattr(obj, 'review')


class ElectricianBookingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ElectricianBooking
        fields = ['electrician', 'priority', 'work_type', 'estimated_duration_hrs',
                  'address', 'city', 'scheduled_at', 'notes']

    def create(self, validated_data):
        consumer = self.context['request'].user
        booking  = ElectricianBooking(consumer=consumer, **validated_data)
        if booking.electrician_id:
            try:
                rate = booking.electrician.electrician_profile.hourly_rate
                booking.total_amount = rate * booking.estimated_duration_hrs
            except Exception:
                pass
        booking.save()
        return booking


class ElectricianReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.SerializerMethodField()

    class Meta:
        model  = ElectricianReview
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
        validated_data['provider'] = booking.electrician
        review = super().create(validated_data)
        try:
            booking.electrician.electrician_profile.refresh_rating()
        except Exception:
            pass
        return review
