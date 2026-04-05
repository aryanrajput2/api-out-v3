#!/usr/bin/env python3
"""Generate test analytics data"""

from api.analytics import analytics
from datetime import datetime
import random

print("Generating test analytics data...")

# Generate some test API calls
endpoints = ["/search", "/static-detail", "/dynamic-detail", "/review", "/book"]
for i in range(20):
    endpoint = random.choice(endpoints)
    success = random.choice([True, True, True, False])  # 75% success rate
    response_time = random.randint(100, 3000)
    status_code = 200 if success else random.choice([400, 500, 503])
    
    analytics.track_api_call(
        endpoint=endpoint,
        method="POST",
        status_code=status_code,
        response_time_ms=response_time,
        success=success,
        error_msg=None if success else "Test error message"
    )

# Generate some test searches
locations = ["Mumbai", "Delhi", "Bangalore", "Goa", "Jaipur"]
for i in range(10):
    analytics.track_search(
        location=random.choice(locations),
        checkin="2026-05-25",
        checkout="2026-05-26",
        rooms=random.randint(1, 3),
        guests=random.randint(1, 6),
        results_count=random.randint(50, 200),
        response_time_ms=random.randint(500, 2000)
    )

# Generate some test bookings
for i in range(5):
    success = random.choice([True, True, False])  # 66% success rate
    analytics.track_booking(
        booking_id=f"TEST{i+1:04d}",
        hotel_id=f"100000{i:06d}",
        amount=random.randint(5000, 50000),
        currency="INR",
        success=success,
        total_time_ms=random.randint(1000, 5000)
    )

# Generate some test errors
error_types = ["api_error", "validation_error", "timeout_error"]
for i in range(5):
    analytics.track_error(
        source=random.choice(endpoints),
        error_message=f"Test error {i+1}: Something went wrong",
        error_type=random.choice(error_types)
    )

print("✅ Test data generated successfully!")
print(f"📊 Generated:")
print(f"   - 20 API calls")
print(f"   - 10 searches")
print(f"   - 5 bookings")
print(f"   - 5 errors")
print("")
print("🌐 View dashboard at: http://localhost:8000/ui/dashboard")
print("📈 Click 'Analytics' in the left sidebar")
