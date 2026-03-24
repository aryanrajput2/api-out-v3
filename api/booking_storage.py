"""
Booking Storage - Stores recent bookings in a JSON text file for persistence
Data persists even if browser cache is cleared
"""
import json
import os
from datetime import datetime

BOOKINGS_FILE = "bookings_data.json"

def load_bookings():
    """Load all bookings from text file"""
    if not os.path.exists(BOOKINGS_FILE):
        return []
    
    try:
        with open(BOOKINGS_FILE, 'r') as f:
            data = json.load(f)
            return data if isinstance(data, list) else []
    except Exception as e:
        return []

def save_bookings(bookings):
    """Save bookings to text file"""
    try:
        with open(BOOKINGS_FILE, 'w') as f:
            json.dump(bookings, f, indent=2)
        return True
    except Exception as e:
        return False

def add_booking(booking_id, booking_data=None):
    """Add a new booking to storage"""
    if not booking_id:
        return False
    
    bookings = load_bookings()
    
    # Remove if already exists (to avoid duplicates)
    bookings = [b for b in bookings if b.get('id') != booking_id]
    
    # Extract response times from booking data
    response_times = booking_data.get('responseTimes', {}) if booking_data else {}
    
    # Calculate total response time
    total_ms = 0
    if response_times.get('search'):
        total_ms += response_times['search']
    if response_times.get('batchSearch') and isinstance(response_times['batchSearch'], list):
        total_ms += sum(response_times['batchSearch'])
    if response_times.get('staticDetail'):
        total_ms += response_times['staticDetail']
    if response_times.get('dynamicDetail'):
        total_ms += response_times['dynamicDetail']
    if response_times.get('review'):
        total_ms += response_times['review']
    if response_times.get('book'):
        total_ms += response_times['book']
    if response_times.get('bookingDetail'):
        total_ms += response_times['bookingDetail']
    
    # Add new booking at the beginning - store ID, creation date, and response times
    new_booking = {
        'id': booking_id,
        'createdAt': datetime.now().isoformat(),
        'responseTimes': response_times,
        'totalResponseTime': total_ms
    }
    bookings.insert(0, new_booking)
    
    # Keep only last 50 bookings
    if len(bookings) > 50:
        bookings = bookings[:50]
    
    return save_bookings(bookings)

def get_recent_bookings(limit=10):
    """Get recent bookings from text file"""
    bookings = load_bookings()
    return bookings[:limit]

def get_booking(booking_id):
    """Get a specific booking from text file"""
    bookings = load_bookings()
    for booking in bookings:
        if booking.get('id') == booking_id:
            return booking
    return None

def delete_booking(booking_id):
    """Delete a booking from text file"""
    bookings = load_bookings()
    bookings = [b for b in bookings if b.get('id') != booking_id]
    return save_bookings(bookings)

def clear_all_bookings():
    """Clear all bookings from text file"""
    return save_bookings([])
