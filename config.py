import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("API_KEY")
BASE_URL = os.getenv("BASE_URL", "https://apitest-hms.tripjack.com/")

# =========================================================================
# Single source of truth for ALL environment URLs and default API keys.
# Three environments: "sandbox" | "admin" | "prod".
# =========================================================================

# HMS APIs: Search, Detail (pricing), Review, Static Content
HMS_BASE = {
    "sandbox": "https://apitest-hms.tripjack.com",
    "admin":   "https://tj-hotel-admin.tripjack.com",
    "prod":    "https://hms-api.tripjack.com",
}

# OMS APIs: Book, Confirm, Cancel, Booking Detail
OMS_BASE = {
    "sandbox": "https://apitest-hotel-booker.tripjack.com",
    "admin":   "https://admin-hotel-booker.tripjack.com",
    "prod":    "https://hms-booker.tripjack.com",
}

DEFAULT_API_KEY = {
    "sandbox": "6116982da6b759-28f8-4cdf-b210-04cb98116165",
    "admin":   "751045f64b362c-7462-4f82-ad59-0a9c2b9b9fc9",
    "prod":    "751045f64b362c-7462-4f82-ad59-0a9c2b9b9fc9",
}


def resolve_env(env: str) -> str:
    """Map a raw env string (or booking host) to: sandbox | admin | prod."""
    e = (env or "").lower()
    if "apitest" in e:
        return "sandbox"
    if "admin" in e or "tj-hotel-admin" in e or "admin-hotel-booker" in e:
        return "admin"
    if "tripjack.com" in e:
        return "prod"
    return "sandbox"


def oms_base(env: str) -> str:
    """OMS (booking) base URL for the given env string."""
    return OMS_BASE[resolve_env(env)]


def default_key(env: str) -> str:
    """Fallback API key for the given env string."""
    return DEFAULT_API_KEY[resolve_env(env)]


def is_transient_auth_failure(result: dict) -> bool:
    """True if an upstream OMS JSON response looks like a transient 401 auth
    rejection. Tripjack's sandbox intermittently rejects the first booking/
    confirm/cancel call with a 401 "Invalid API key", then accepts an identical
    retry seconds later. A 401 is rejected at auth (no state changes upstream),
    so retrying the same request is safe."""
    if not isinstance(result, dict):
        return False
    status = result.get("status") or {}
    if status.get("httpStatus") == 401 and status.get("success") is False:
        return True
    for err in (result.get("errors") or []):
        if str(err.get("errCode")) == "401":
            return True
    return False

# ./start.sh