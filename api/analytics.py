"""
Analytics tracking system for hotel booking application
Tracks: API calls, errors, success rates, response times, user actions
"""
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from collections import defaultdict

ANALYTICS_FILE = "analytics_data.json"

class AnalyticsTracker:
    def __init__(self):
        self.data = self._load_data()
    
    def _load_data(self) -> Dict:
        """Load analytics data from file"""
        if os.path.exists(ANALYTICS_FILE):
            try:
                with open(ANALYTICS_FILE, 'r') as f:
                    return json.load(f)
            except:
                pass
        
        return {
            "events": [],
            "api_calls": [],
            "errors": [],
            "searches": [],
            "bookings": [],
            "page_views": []
        }
    
    def _save_data(self):
        """Save analytics data to file"""
        try:
            with open(ANALYTICS_FILE, 'w') as f:
                json.dump(self.data, f, indent=2)
        except Exception as e:
            print(f"Error saving analytics: {e}")
    
    def track_event(self, event_type: str, event_data: Dict):
        """Track any custom event"""
        event = {
            "type": event_type,
            "timestamp": datetime.now().isoformat(),
            "data": event_data
        }
        self.data["events"].append(event)
        self._save_data()
    
    def track_api_call(self, endpoint: str, method: str, status_code: int, 
                       response_time_ms: int, success: bool, error_msg: Optional[str] = None):
        """Track API call with response time and status"""
        call = {
            "endpoint": endpoint,
            "method": method,
            "status_code": status_code,
            "response_time_ms": response_time_ms,
            "success": success,
            "error_msg": error_msg,
            "timestamp": datetime.now().isoformat()
        }
        self.data["api_calls"].append(call)
        
        # Also track as error if failed
        if not success:
            self.track_error(endpoint, error_msg or f"Status {status_code}", "api_error")
        
        self._save_data()
    
    def track_error(self, source: str, error_message: str, error_type: str):
        """Track errors"""
        error = {
            "source": source,
            "message": error_message,
            "type": error_type,
            "timestamp": datetime.now().isoformat()
        }
        self.data["errors"].append(error)
        self._save_data()
    
    def track_search(self, location: str, checkin: str, checkout: str, 
                     rooms: int, guests: int, results_count: int, response_time_ms: int):
        """Track hotel search"""
        search = {
            "location": location,
            "checkin": checkin,
            "checkout": checkout,
            "rooms": rooms,
            "guests": guests,
            "results_count": results_count,
            "response_time_ms": response_time_ms,
            "timestamp": datetime.now().isoformat()
        }
        self.data["searches"].append(search)
        self._save_data()
    
    def track_booking(self, booking_id: str, hotel_id: str, amount: float, 
                      currency: str, success: bool, total_time_ms: int):
        """Track booking attempt"""
        booking = {
            "booking_id": booking_id,
            "hotel_id": hotel_id,
            "amount": amount,
            "currency": currency,
            "success": success,
            "total_time_ms": total_time_ms,
            "timestamp": datetime.now().isoformat()
        }
        self.data["bookings"].append(booking)
        self._save_data()
    
    def track_page_view(self, page: str, user_ip: Optional[str] = None):
        """Track page views"""
        view = {
            "page": page,
            "user_ip": user_ip,
            "timestamp": datetime.now().isoformat()
        }
        self.data["page_views"].append(view)
        self._save_data()
    
    def get_stats(self, hours: int = 24) -> Dict:
        """Get analytics statistics for last N hours"""
        cutoff = datetime.now() - timedelta(hours=hours)
        
        # Filter data by time
        recent_api_calls = [
            call for call in self.data["api_calls"]
            if datetime.fromisoformat(call["timestamp"]) > cutoff
        ]
        
        recent_errors = [
            err for err in self.data["errors"]
            if datetime.fromisoformat(err["timestamp"]) > cutoff
        ]
        
        recent_searches = [
            search for search in self.data["searches"]
            if datetime.fromisoformat(search["timestamp"]) > cutoff
        ]
        
        recent_bookings = [
            booking for booking in self.data["bookings"]
            if datetime.fromisoformat(booking["timestamp"]) > cutoff
        ]
        
        recent_page_views = [
            view for view in self.data["page_views"]
            if datetime.fromisoformat(view["timestamp"]) > cutoff
        ]
        
        # Calculate statistics
        total_api_calls = len(recent_api_calls)
        successful_calls = len([c for c in recent_api_calls if c["success"]])
        failed_calls = total_api_calls - successful_calls
        success_rate = (successful_calls / total_api_calls * 100) if total_api_calls > 0 else 0
        
        # Average response time
        avg_response_time = 0
        if recent_api_calls:
            avg_response_time = sum(c["response_time_ms"] for c in recent_api_calls) / len(recent_api_calls)
        
        # Error breakdown
        error_types = defaultdict(int)
        for err in recent_errors:
            error_types[err["type"]] += 1
        
        # Endpoint breakdown
        endpoint_stats = defaultdict(lambda: {"count": 0, "success": 0, "failed": 0, "avg_time": 0})
        for call in recent_api_calls:
            ep = call["endpoint"]
            endpoint_stats[ep]["count"] += 1
            if call["success"]:
                endpoint_stats[ep]["success"] += 1
            else:
                endpoint_stats[ep]["failed"] += 1
        
        # Calculate average times per endpoint
        for ep in endpoint_stats:
            ep_calls = [c for c in recent_api_calls if c["endpoint"] == ep]
            if ep_calls:
                endpoint_stats[ep]["avg_time"] = sum(c["response_time_ms"] for c in ep_calls) / len(ep_calls)
        
        # Booking stats
        total_bookings = len(recent_bookings)
        successful_bookings = len([b for b in recent_bookings if b["success"]])
        booking_success_rate = (successful_bookings / total_bookings * 100) if total_bookings > 0 else 0
        
        # Search stats
        total_searches = len(recent_searches)
        avg_search_time = 0
        if recent_searches:
            avg_search_time = sum(s["response_time_ms"] for s in recent_searches) / len(recent_searches)
        
        return {
            "period_hours": hours,
            "overview": {
                "total_api_calls": total_api_calls,
                "successful_calls": successful_calls,
                "failed_calls": failed_calls,
                "success_rate": round(success_rate, 2),
                "avg_response_time_ms": round(avg_response_time, 2),
                "total_errors": len(recent_errors),
                "total_searches": total_searches,
                "total_bookings": total_bookings,
                "booking_success_rate": round(booking_success_rate, 2),
                "total_page_views": len(recent_page_views)
            },
            "endpoint_stats": dict(endpoint_stats),
            "error_breakdown": dict(error_types),
            "recent_errors": recent_errors[-10:],  # Last 10 errors
            "recent_api_calls": recent_api_calls[-20:],  # Last 20 API calls
            "search_stats": {
                "total": total_searches,
                "avg_time_ms": round(avg_search_time, 2)
            },
            "booking_stats": {
                "total": total_bookings,
                "successful": successful_bookings,
                "failed": total_bookings - successful_bookings,
                "success_rate": round(booking_success_rate, 2)
            }
        }
    
    def get_realtime_stats(self) -> Dict:
        """Get real-time statistics (last 5 minutes)"""
        cutoff = datetime.now() - timedelta(minutes=5)
        
        recent_calls = [
            call for call in self.data["api_calls"]
            if datetime.fromisoformat(call["timestamp"]) > cutoff
        ]
        
        recent_errors = [
            err for err in self.data["errors"]
            if datetime.fromisoformat(err["timestamp"]) > cutoff
        ]
        
        return {
            "active_requests": len(recent_calls),
            "errors_last_5min": len(recent_errors),
            "last_error": recent_errors[-1] if recent_errors else None,
            "last_api_call": recent_calls[-1] if recent_calls else None
        }
    
    def clear_old_data(self, days: int = 7):
        """Clear data older than N days"""
        cutoff = datetime.now() - timedelta(days=days)
        
        self.data["api_calls"] = [
            call for call in self.data["api_calls"]
            if datetime.fromisoformat(call["timestamp"]) > cutoff
        ]
        
        self.data["errors"] = [
            err for err in self.data["errors"]
            if datetime.fromisoformat(err["timestamp"]) > cutoff
        ]
        
        self.data["searches"] = [
            search for search in self.data["searches"]
            if datetime.fromisoformat(search["timestamp"]) > cutoff
        ]
        
        self.data["bookings"] = [
            booking for booking in self.data["bookings"]
            if datetime.fromisoformat(booking["timestamp"]) > cutoff
        ]
        
        self.data["page_views"] = [
            view for view in self.data["page_views"]
            if datetime.fromisoformat(view["timestamp"]) > cutoff
        ]
        
        self._save_data()

# Global analytics instance
analytics = AnalyticsTracker()
