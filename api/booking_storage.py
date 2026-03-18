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
        print(f"Error loading bookings: {e}")
        return []

def save_bookings(bookings):
    """Save bookings to text file"""
    try:
        with open(BOOKINGS_FILE, 'w') as f:
            json.dump(bookings, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving bookings: {e}")
        return False

def add_booking(booking_id, booking_data=None):
    """Add a new booking to storage"""
    if not booking_id:
        return False
    
    bookings = load_bookings()
    
    # Remove if already exists (to avoid duplicates)
    bookings = [b for b in bookings if b.get('id') != booking_id]
    
    # Add new booking at the beginning
    new_booking = {
        'id': booking_id,
        'createdAt': datetime.now().isoformat(),
        'data': booking_data or {}
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
