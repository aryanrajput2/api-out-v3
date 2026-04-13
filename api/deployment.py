"""
Deployment and Environment Management System
Handles test/staging/production environment switching and releases
"""

import json
import os
from datetime import datetime
from typing import Dict, List, Optional
from pathlib import Path

class DeploymentManager:
    """Manages deployments across different environments"""
    
    def __init__(self):
        self.config_file = Path("deployment_config.json")
        self.releases_file = Path("releases_history.json")
        self.load_config()
    
    def load_config(self):
        """Load deployment configuration"""
        if self.config_file.exists():
            with open(self.config_file, 'r') as f:
                self.config = json.load(f)
        else:
            self.config = self._default_config()
            self.save_config()
    
    def _default_config(self) -> Dict:
        """Default deployment configuration"""
        return {
            "environments": {
                "test": {
                    "name": "Test Environment",
                    "url": "http://localhost:8000",
                    "status": "active",
                    "description": "Local testing environment"
                },
                "staging": {
                    "name": "Staging Environment",
                    "url": "https://staging-api.example.com",
                    "status": "inactive",
                    "description": "Pre-production staging"
                },
                "admin": {
                    "name": "Admin Environment",
                    "url": "https://admin-api.example.com",
                    "status": "inactive",
                    "description": "Admin/Production environment"
                }
            },
            "current_environment": "test",
            "release_approval_required": True,
            "auto_backup": True,
            "last_updated": datetime.now().isoformat()
        }
    
    def save_config(self):
        """Save configuration to file"""
        self.config["last_updated"] = datetime.now().isoformat()
        with open(self.config_file, 'w') as f:
            json.dump(self.config, f, indent=2)
    
    def get_current_environment(self) -> Dict:
        """Get current active environment"""
        env_name = self.config.get("current_environment", "test")
        return self.config["environments"].get(env_name, {})
    
    def switch_environment(self, env_name: str) -> Dict:
        """Switch to a different environment"""
        if env_name not in self.config["environments"]:
            return {"ok": False, "error": f"Environment '{env_name}' not found"}
        
        old_env = self.config["current_environment"]
        self.config["current_environment"] = env_name
        self.save_config()
        
        return {
            "ok": True,
            "message": f"Switched from {old_env} to {env_name}",
            "current_environment": env_name,
            "environment_details": self.config["environments"][env_name]
        }
    
    def get_all_environments(self) -> Dict:
        """Get all available environments"""
        return {
            "ok": True,
            "current": self.config["current_environment"],
            "environments": self.config["environments"]
        }
    
    def create_release(self, version: str, changes: str, from_env: str = "test", to_env: str = "admin") -> Dict:
        """Create a release from one environment to another"""
        release = {
            "id": f"release-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
            "version": version,
            "timestamp": datetime.now().isoformat(),
            "from_environment": from_env,
            "to_environment": to_env,
            "changes": changes,
            "status": "pending_approval" if self.config["release_approval_required"] else "approved",
            "approved_by": None,
            "approved_at": None
        }
        
        self._save_release(release)
        return {"ok": True, "release": release}
    
    def approve_release(self, release_id: str, approved_by: str = "admin") -> Dict:
        """Approve a pending release"""
        releases = self._load_releases()
        
        for release in releases:
            if release["id"] == release_id:
                if release["status"] == "approved":
                    return {"ok": False, "error": "Release already approved"}
                
                release["status"] = "approved"
                release["approved_by"] = approved_by
                release["approved_at"] = datetime.now().isoformat()
                self._save_releases(releases)
                
                return {"ok": True, "message": "Release approved", "release": release}
        
        return {"ok": False, "error": f"Release '{release_id}' not found"}
    
    def get_releases(self, limit: int = 10) -> Dict:
        """Get release history"""
        releases = self._load_releases()
        return {
            "ok": True,
            "total": len(releases),
            "releases": releases[-limit:][::-1]  # Most recent first
        }
    
    def _save_release(self, release: Dict):
        """Save release to history"""
        releases = self._load_releases()
        releases.append(release)
        self._save_releases(releases)
    
    def _load_releases(self) -> List[Dict]:
        """Load release history"""
        if self.releases_file.exists():
            with open(self.releases_file, 'r') as f:
                return json.load(f)
        return []
    
    def _save_releases(self, releases: List[Dict]):
        """Save release history"""
        with open(self.releases_file, 'w') as f:
            json.dump(releases, f, indent=2)
    
    def update_environment_url(self, env_name: str, new_url: str) -> Dict:
        """Update environment URL"""
        if env_name not in self.config["environments"]:
            return {"ok": False, "error": f"Environment '{env_name}' not found"}
        
        old_url = self.config["environments"][env_name]["url"]
        self.config["environments"][env_name]["url"] = new_url
        self.save_config()
        
        return {
            "ok": True,
            "message": f"Updated {env_name} URL",
            "old_url": old_url,
            "new_url": new_url
        }
    
    def get_deployment_status(self) -> Dict:
        """Get overall deployment status"""
        return {
            "ok": True,
            "current_environment": self.config["current_environment"],
            "environment_details": self.get_current_environment(),
            "release_approval_required": self.config["release_approval_required"],
            "auto_backup": self.config["auto_backup"],
            "last_updated": self.config["last_updated"]
        }


# Global instance
deployment_manager = DeploymentManager()
