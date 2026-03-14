#!/usr/bin/env python3
"""
Simple script to view and format server logs
Usage: python3 view_logs.py [date] [endpoint]
Example: python3 view_logs.py 2026-03-14 /search
"""

import json
import sys
import os
from pathlib import Path

LOGS_DIR = "Server_logs"

def view_logs(date=None, endpoint=None):
    """View logs with optional filtering"""
    
    if not os.path.exists(LOGS_DIR):
        print(f"❌ {LOGS_DIR} directory not found")
        return
    
    log_files = sorted(Path(LOGS_DIR).glob("*.log"))
    
    if not log_files:
        print(f"❌ No log files found in {LOGS_DIR}")
        return
    
    # Filter by date if provided
    if date:
        log_files = [f for f in log_files if date in f.name]
    
    if not log_files:
        print(f"❌ No log files found for date: {date}")
        return
    
    print(f"📋 Viewing logs from: {', '.join([f.name for f in log_files])}\n")
    print("=" * 120)
    
    for log_file in log_files:
        with open(log_file, 'r') as f:
            for line in f:
                try:
                    entry = json.loads(line.strip())
                    
                    # Filter by endpoint if provided
                    if endpoint and endpoint not in entry.get("endpoint", ""):
                        continue
                    
                    # Format output
                    timestamp = entry.get("timestamp", "N/A")
                    log_type = entry.get("type", "N/A")
                    ip = entry.get("ip", "N/A")
                    endpoint_name = entry.get("endpoint", "N/A")
                    
                    if log_type == "REQUEST":
                        method = entry.get("method", "N/A")
                        body = entry.get("body", {})
                        print(f"\n📤 REQUEST")
                        print(f"   Timestamp: {timestamp}")
                        print(f"   IP: {ip}")
                        print(f"   Endpoint: {endpoint_name} [{method}]")
                        if body:
                            print(f"   Body: {json.dumps(body, indent=6)}")
                    
                    elif log_type == "RESPONSE":
                        status = entry.get("status_code", "N/A")
                        response = entry.get("response", {})
                        print(f"\n📥 RESPONSE")
                        print(f"   Timestamp: {timestamp}")
                        print(f"   IP: {ip}")
                        print(f"   Endpoint: {endpoint_name}")
                        print(f"   Status: {status}")
                        if response:
                            # Only show key info, not full response
                            ok = response.get("ok", "N/A")
                            hotels = len(response.get("hotels", []))
                            print(f"   OK: {ok}, Hotels: {hotels}")
                    
                    print("-" * 120)
                
                except json.JSONDecodeError:
                    print(f"⚠️  Could not parse line: {line}")

if __name__ == "__main__":
    date = sys.argv[1] if len(sys.argv) > 1 else None
    endpoint = sys.argv[2] if len(sys.argv) > 2 else None
    
    view_logs(date, endpoint)
