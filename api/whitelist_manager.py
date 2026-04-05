"""
IP Whitelist Manager
Manages IP whitelist configuration dynamically
"""
import os
import json
from typing import List, Dict

WHITELIST_FILE = "whitelist_config.json"

def load_whitelist_config() -> Dict:
    """Load whitelist configuration from file"""
    if not os.path.exists(WHITELIST_FILE):
        # Create default config
        default_config = {
            "enabled": os.getenv("ENFORCE_IP_WHITELIST", "false").lower() == "true",
            "ips": [
                {"ip": "127.0.0.1", "label": "Localhost"},
                {"ip": "65.2.62.247", "label": "Office IP 1"},
                {"ip": "157.49.118.218", "label": "Office IP 2"},
                {"ip": "160.22.60.16", "label": "Office IP 3"},
                {"ip": "3.108.106.208", "label": "Janmejay IP"},
                {"ip": "13.204.135.18", "label": "Janmejay IP 2"},
                {"ip": "13.234.90.183", "label": "New Office IP"}
            ]
        }
        save_whitelist_config(default_config)
        return default_config
    
    try:
        with open(WHITELIST_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading whitelist config: {e}")
        return {"enabled": False, "ips": []}

def save_whitelist_config(config: Dict) -> bool:
    """Save whitelist configuration to file"""
    try:
        with open(WHITELIST_FILE, 'w') as f:
            json.dump(config, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving whitelist config: {e}")
        return False

def get_whitelist_status() -> Dict:
    """Get current whitelist status"""
    config = load_whitelist_config()
    return {
        "ok": True,
        "enabled": config.get("enabled", False),
        "count": len(config.get("ips", []))
    }

def toggle_whitelist() -> Dict:
    """Toggle whitelist enabled/disabled"""
    config = load_whitelist_config()
    config["enabled"] = not config.get("enabled", False)
    
    if save_whitelist_config(config):
        # Update environment variable
        os.environ["ENFORCE_IP_WHITELIST"] = "true" if config["enabled"] else "false"
        return {
            "ok": True,
            "enabled": config["enabled"],
            "message": f"Whitelist {'enabled' if config['enabled'] else 'disabled'} successfully"
        }
    else:
        return {
            "ok": False,
            "message": "Failed to save configuration"
        }

def get_whitelist_ips() -> Dict:
    """Get list of whitelisted IPs"""
    config = load_whitelist_config()
    return {
        "ok": True,
        "ips": config.get("ips", [])
    }

def add_ip_to_whitelist(ip: str, label: str = "") -> Dict:
    """Add IP to whitelist"""
    config = load_whitelist_config()
    
    # Check if IP already exists
    existing_ips = [item["ip"] for item in config.get("ips", [])]
    if ip in existing_ips:
        return {
            "ok": False,
            "message": f"IP {ip} is already in the whitelist"
        }
    
    # Add new IP
    config.setdefault("ips", []).append({
        "ip": ip,
        "label": label or f"Added via Dashboard"
    })
    
    if save_whitelist_config(config):
        return {
            "ok": True,
            "message": f"IP {ip} added successfully"
        }
    else:
        return {
            "ok": False,
            "message": "Failed to save configuration"
        }

def remove_ip_from_whitelist(ip: str) -> Dict:
    """Remove IP from whitelist"""
    config = load_whitelist_config()
    
    # Filter out the IP
    original_count = len(config.get("ips", []))
    config["ips"] = [item for item in config.get("ips", []) if item["ip"] != ip]
    
    if len(config["ips"]) == original_count:
        return {
            "ok": False,
            "message": f"IP {ip} not found in whitelist"
        }
    
    if save_whitelist_config(config):
        return {
            "ok": True,
            "message": f"IP {ip} removed successfully"
        }
    else:
        return {
            "ok": False,
            "message": "Failed to save configuration"
        }

def get_allowed_ips() -> set:
    """Get set of allowed IPs for middleware"""
    config = load_whitelist_config()
    return {item["ip"] for item in config.get("ips", [])}

def is_whitelist_enabled() -> bool:
    """Check if whitelist is enabled"""
    config = load_whitelist_config()
    return config.get("enabled", False)
