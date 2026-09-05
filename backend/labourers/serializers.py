from rest_framework import serializers
from .models import LabourerProfile, LabourBooking, LabourReview


class LabourerProfileSerializer(serializers.ModelSerializer):
    user_details = serializers.SerializerMethodField()

    class Meta:
        model  = LabourerProfile
        fields = ['id', 'user_details', 'is_verified', 'is_available', 'avg_rating', 'total_reviews',
                  'hourly_rate', 'bio', 'years_experience', 'skills', 'daily_rate']
        read_only_fields = ['is_verified', 'avg_rating', 'total_reviews']

    def get_user_details(self, obj):
        u = obj.user
        return {'id': u.id, 'username': u.username, 'first_name': u.first_name, 'last_name': u.last_name, 'city': u.city, 'phone': u.phone}


class LabourBookingSerializer(serializers.ModelSerializer):
    consumer_name  = serializers.SerializerMethodField()
    labourer_name  = serializers.SerializerMethodField()
    has_review     = serializers.SerializerMethodField()

    class Meta:
        model  = LabourBooking
        fields = ['id', 'consumer', 'consumer_name', 'labourer', 'labourer_name',
                  'work_type', 'num_workers', 'work_days',
                  'address', 'city', 'scheduled_at', 'status',
                  'notes', 'total_amount', 'has_review', 'created_at']
        read_only_fields = ['consumer', 'total_amount', 'created_at']

    def get_consumer_name(self, obj):
        return obj.consumer.get_full_name() or obj.consumer.username

    def get_labourer_name(self, obj):
        return (obj.labourer.get_full_name() or obj.labourer.username) if obj.labourer else None

    def get_has_review(self, obj):
        return hasattr(obj, 'review')


class LabourBookingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = LabourBooking
        fields = ['labourer', 'work_type', 'num_workers', 'work_days',
                  'address', 'city', 'scheduled_at', 'notes']

    def create(self, validated_data):
        consumer = self.context['request'].user
        booking  = LabourBooking(consumer=consumer, **validated_data)
        if booking.labourer_id:
            try:
                rate = booking.labourer.labourer_profile.daily_rate
                booking.total_amount = rate * booking.num_workers * booking.work_days
            except Exception:
                pass
        booking.save()
        return booking


class LabourReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.SerializerMethodField()

    class Meta:
        model  = LabourReview
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
        validated_data['provider'] = booking.labourer
        review = super().create(validated_data)
        try:
            booking.labourer.labourer_profile.refresh_rating()
        except Exception:
            pass
        return review
