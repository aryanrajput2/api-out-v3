const API_BASE = window.location.origin;
let globalSearchBody = null;
try {
  const saved = sessionStorage.getItem("tj_global_search");
  if (saved) globalSearchBody = JSON.parse(saved);
} catch (e) { console.warn("Failed to restore search body", e); }

/* =========================================
   Liquid Background Animation (Click Triggered)
   ========================================= */
let liquidAnimationActive = false;

document.addEventListener('DOMContentLoaded', () => {
  // Add click listener to entire document for liquid animation
  document.addEventListener('click', (e) => {
    // Don't trigger on certain elements to avoid excessive animations
    const target = e.target;
    if (!target.closest('input, textarea, select')) {
      triggerLiquidAnimation();
    }
  });
});

function triggerLiquidAnimation() {
  if (liquidAnimationActive) return; // Prevent overlapping animations
  
  liquidAnimationActive = true;
  const body = document.body;
  
  // Add active class to trigger animation
  body.classList.add('liquid-active');
  
  // Remove class after animation completes
  setTimeout(() => {
    body.classList.remove('liquid-active');
    liquidAnimationActive = false;
  }, 1400);
}

// Login credentials
const VALID_EMAIL = "aryan.singh@tripjack.com";
const VALID_PASSWORD = "123@abc";

/* =========================================
   Login Functions
   ========================================= */
function handleLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  const errorDiv = document.getElementById("login-error");
  const errorText = document.getElementById("login-error-text");

  // Validate credentials
  if (email === VALID_EMAIL && password === VALID_PASSWORD) {
    // Store login state
    localStorage.setItem("tj_user_logged_in", "true");
    localStorage.setItem("tj_user_email", email);
    
    // Hide login page and show search page
    hideAllPages();
    document.getElementById("search-page").classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Clear form
    document.getElementById("login-form").reset();
    errorDiv.style.display = "none";
  } else {
    // Show error
    errorText.textContent = "Invalid email or password. Please try again.";
    errorDiv.style.display = "flex";
  }
}

function togglePasswordVisibility() {
  const passwordInput = document.getElementById("login-password");
  const toggleIcon = document.getElementById("password-toggle-icon");
  
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    toggleIcon.className = "ph ph-eye-slash";
  } else {
    passwordInput.type = "password";
    toggleIcon.className = "ph ph-eye";
  }
}

function checkLoginStatus() {
  const isLoggedIn = localStorage.getItem("tj_user_logged_in") === "true";
  const logoutBtn = document.getElementById("logout-btn");
  
  if (!isLoggedIn) {
    // Show login page
    hideAllPages();
    document.getElementById("login-page").classList.remove("hidden");
    if (logoutBtn) logoutBtn.style.display = "none";
  } else {
    // Show search page
    hideAllPages();
    document.getElementById("search-page").classList.remove("hidden");
    if (logoutBtn) logoutBtn.style.display = "flex";
  }
}

function logout() {
  localStorage.removeItem("tj_user_logged_in");
  localStorage.removeItem("tj_user_email");
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) logoutBtn.style.display = "none";
  checkLoginStatus();
}

const OPTION_TYPES = {
  SRSM: { name: "Same Room Same Mealplan", desc: "All rooms are the same room type AND all have the same meal plan." },
  SRCM: { name: "Same Room Cross Mealplan", desc: "All rooms are the same room type BUT meal plans differ across rooms." },
  CRSM: { name: "Cross Room Same Mealplan", desc: "Rooms are of different types BUT all share the same meal plan." },
  CRCM: { name: "Cross Room Cross Mealplan", desc: "Rooms differ in type AND meal plan varies per room." },
  SINGLE: { name: "Single Option", desc: "Single option provided." }
};

/* =========================================
   API Response Time Tracking
   ========================================= */
let apiResponseTimes = {
  search: null,
  detail: null,
  staticDetail: null,
  review: null,
  booking: null,
  bookingDetail: null,
  batchTimes: {} // For tracking individual batch response times
};

function recordApiTime(endpoint, ms) {
  apiResponseTimes[endpoint] = ms;
  console.log(`API Time recorded: ${endpoint} = ${ms}ms`, apiResponseTimes);
  updateApiTimesDisplay();
}

function recordBatchTime(batchId, ms) {
  apiResponseTimes.batchTimes[batchId] = ms;
  console.log(`Batch time recorded: ${batchId} = ${ms}ms`, apiResponseTimes);
  updateApiTimesDisplay();
}

function updateApiTimesDisplay() {
  let container = document.getElementById("api-times-container");
  
  // If container not found, try again after a short delay
  if (!container) {
    console.warn("api-times-container not found, retrying...");
    setTimeout(() => {
      container = document.getElementById("api-times-container");
      if (!container) {
        console.error("api-times-container still not found after retry");
        return;
      }
      displayApiTimes(container);
    }, 100);
    return;
  }
  
  displayApiTimes(container);
}

function displayApiTimes(container) {
  console.log("displayApiTimes called with container:", container);
  console.log("apiResponseTimes object:", apiResponseTimes);
  
  // Force the container to be visible by overriding any CSS rules
  container.classList.remove('hidden');
  container.style.setProperty('display', 'block', 'important');
  container.style.setProperty('visibility', 'visible', 'important');
  container.style.setProperty('opacity', '1', 'important');
  
  let html = '<div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center;">';
  let hasAnyTime = false;
  
  console.log("Checking apiResponseTimes.search:", apiResponseTimes.search);
  
  if (apiResponseTimes.search) {
    html += `<div class="api-time-badge"><i class="ph ph-magnifying-glass"></i> Search: ${formatDuration(apiResponseTimes.search)}</div>`;
    hasAnyTime = true;
  }
  
  // Show batch times if they exist
  if (Object.keys(apiResponseTimes.batchTimes).length > 0) {
    Object.entries(apiResponseTimes.batchTimes).forEach(([batchId, ms]) => {
      html += `<div class="api-time-badge"><i class="ph ph-stack"></i> ${batchId}: ${formatDuration(ms)}</div>`;
      hasAnyTime = true;
    });
  }
  
  if (apiResponseTimes.detail) {
    html += `<div class="api-time-badge"><i class="ph ph-info"></i> Detail: ${formatDuration(apiResponseTimes.detail)}</div>`;
    hasAnyTime = true;
  }
  
  if (apiResponseTimes.staticDetail) {
    html += `<div class="api-time-badge"><i class="ph ph-image"></i> Static: ${formatDuration(apiResponseTimes.staticDetail)}</div>`;
    hasAnyTime = true;
  }
  
  if (apiResponseTimes.review) {
    html += `<div class="api-time-badge"><i class="ph ph-list-checks"></i> Review: ${formatDuration(apiResponseTimes.review)}</div>`;
    hasAnyTime = true;
  }
  if (apiResponseTimes.booking) {
    html += `<div class="api-time-badge"><i class="ph ph-check-circle"></i> Booking: ${formatDuration(apiResponseTimes.booking)}</div>`;
    hasAnyTime = true;
  }
  if (apiResponseTimes.bookingDetail) {
    html += `<div class="api-time-badge"><i class="ph ph-receipt"></i> Booking Detail: ${formatDuration(apiResponseTimes.bookingDetail)}</div>`;
    hasAnyTime = true;
  }
  
  html += '</div>';
  
  console.log("hasAnyTime:", hasAnyTime, "html:", html);
  
  // Only show container if there are times to display
  if (hasAnyTime) {
    container.innerHTML = html;
    container.classList.remove('hidden');
    container.style.setProperty('display', 'block', 'important');
    container.style.setProperty('visibility', 'visible', 'important');
    container.style.setProperty('opacity', '1', 'important');
    console.log("API times displayed successfully:", apiResponseTimes);
  } else {
    container.classList.add('hidden');
    container.style.setProperty('display', 'none', 'important');
    container.style.setProperty('visibility', 'hidden', 'important');
    container.style.setProperty('opacity', '0', 'important');
    console.log("No API times to display");
  }
  
  // Also update results page API times display
  updateResultsPageApiTimes();
  // Also update search page API times display
  updateSearchPageApiTimes();
}

function updateSearchPageApiTimes() {
  // Update the search page API times display
  const searchApiTimesContainer = document.getElementById("search-api-times");
  if (!searchApiTimesContainer) return;

  let html = '<div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center;">';
  let hasAnyTime = false;
  
  if (apiResponseTimes.search) {
    html += `<div class="api-time-badge"><i class="ph ph-magnifying-glass"></i> Search: ${formatDuration(apiResponseTimes.search)}</div>`;
    hasAnyTime = true;
  }
  
  // Show batch times if they exist
  if (Object.keys(apiResponseTimes.batchTimes).length > 0) {
    Object.entries(apiResponseTimes.batchTimes).forEach(([batchId, ms]) => {
      html += `<div class="api-time-badge"><i class="ph ph-stack"></i> ${batchId}: ${formatDuration(ms)}</div>`;
      hasAnyTime = true;
    });
  }
  
  html += '</div>';
  
  // Only show container if there are times to display
  if (hasAnyTime) {
    searchApiTimesContainer.innerHTML = html;
    searchApiTimesContainer.style.display = 'block';
    console.log("Search page API times displayed:", apiResponseTimes);
  } else {
    searchApiTimesContainer.style.display = 'none';
  }
}

function updateResultsPageApiTimes() {
  // Update the results page API times display
  const resultsApiTimesContainer = document.getElementById("results-api-times-container");
  if (!resultsApiTimesContainer) return;

  let html = '<div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center;">';
  let hasAnyTime = false;
  
  if (apiResponseTimes.search) {
    html += `<div class="api-time-badge"><i class="ph ph-magnifying-glass"></i> Search: ${formatDuration(apiResponseTimes.search)}</div>`;
    hasAnyTime = true;
  }
  
  // Show batch times if they exist
  if (Object.keys(apiResponseTimes.batchTimes).length > 0) {
    Object.entries(apiResponseTimes.batchTimes).forEach(([batchId, ms]) => {
      html += `<div class="api-time-badge"><i class="ph ph-stack"></i> ${batchId}: ${formatDuration(ms)}</div>`;
      hasAnyTime = true;
    });
  }
  
  html += '</div>';
  
  // Only show container if there are times to display
  if (hasAnyTime) {
    resultsApiTimesContainer.innerHTML = html;
    resultsApiTimesContainer.style.display = 'block';
    console.log("Results page API times displayed:", apiResponseTimes);
  } else {
    resultsApiTimesContainer.style.display = 'none';
  }
}

function formatSearchInfo() {
  const checkin = document.getElementById("checkin")?.value;
  const checkout = document.getElementById("checkout")?.value;
  const currency = document.getElementById("currency")?.value || "INR";
  
  if (!checkin || !checkout) return "";
  
  const rooms = readRoomsFromUi();
  const totalAdults = rooms.reduce((sum, r) => sum + (r.adults || 0), 0);
  const totalChildren = rooms.reduce((sum, r) => sum + (r.children || 0), 0);
  
  const start = new Date(checkin);
  const end = new Date(checkout);
  const nights = Math.round((end - start) / (1000 * 60 * 60 * 24));
  
  let info = `${rooms.length} Room(s) for ${totalAdults} Adult(s)`;
  if (totalChildren > 0) {
    info += ` & ${totalChildren} Child(ren)`;
  }
  info += ` · ${nights} Night(s) (${checkin} → ${checkout}) · ${currency}`;
  
  return info;
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;

  const seconds = Math.floor(ms / 1000);
  const remainingMs = ms % 1000;

  if (seconds < 60) {
    return `${seconds}s ${remainingMs}ms`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s ${remainingMs}ms`;
}

let searchTimerInterval = null;
let searchSecondsElapsed = 0;

function setSearchLoading(isLoading) {
  const btn = document.getElementById("search-button");
  const label = document.getElementById("search-button-label");
  const spinner = document.getElementById("search-button-spinner");
  const icon = btn?.querySelector(".search-icon");

  if (!btn || !label || !spinner) return;

  btn.disabled = isLoading;

  // Clear any existing timer loops
  if (searchTimerInterval) {
    clearInterval(searchTimerInterval);
    searchTimerInterval = null;
  }

  if (isLoading) {
    searchSecondsElapsed = 0;
    label.innerHTML = `Searching... <span style="opacity:0.8; margin-left:6px;">0s</span>`;

    searchTimerInterval = setInterval(() => {
      searchSecondsElapsed++;
      label.innerHTML = `Searching... <span style="opacity:0.8; margin-left:6px;">${searchSecondsElapsed}s</span>`;
    }, 1000);

    spinner.classList.remove("hidden");
    if (icon) icon.classList.add("hidden");
  } else {
    label.textContent = "Search Hotels";
    spinner.classList.add("hidden");
    if (icon) icon.classList.remove("hidden");
  }
}

function showSearchError(message, details, rawError) {
  const el = document.getElementById("search-error");
  const msgEl = el?.querySelector(".message");
  const preEl = el?.querySelector(".raw-error");
  if (!el || !msgEl) return;

  el.classList.remove("hidden");
  msgEl.textContent = message + (details ? ` (${details})` : "");

  if (preEl) {
    if (rawError) {
      preEl.textContent = typeof rawError === "object" ? JSON.stringify(rawError, null, 2) : String(rawError);
      preEl.classList.remove("hidden");
    } else {
      preEl.classList.add("hidden");
      preEl.textContent = "";
    }
  }
}

function clearSearchError() {
  const el = document.getElementById("search-error");
  const msgEl = el?.querySelector(".message");
  const preEl = el?.querySelector(".raw-error");
  if (!el || !msgEl) return;

  el.classList.add("hidden");
  msgEl.textContent = "";
  if (preEl) {
    preEl.classList.add("hidden");
    preEl.textContent = "";
  }
}

/* =========================================
   Hotel ID Batch Search
   ========================================= */
function updateHotelIdCounter() {
  const input = document.getElementById("hotelids");
  const counter = document.getElementById("hotel-id-counter");
  
  if (!input || !counter) return;
  
  // Parse hotel IDs from input
  const hotelIds = input.value
    .split(",")
    .map(id => id.trim())
    .filter(id => id.length > 0);
  
  const count = hotelIds.length;
  const maxCount = 100;
  
  // Update counter display
  counter.textContent = `${count}/${maxCount}`;
  
  // Change color based on count
  if (count === 0) {
    counter.style.color = "#64748b";
    counter.style.background = "#f1f5f9";
  } else if (count < maxCount) {
    counter.style.color = "#0284c7";
    counter.style.background = "#e0f2fe";
  } else if (count === maxCount) {
    counter.style.color = "#16a34a";
    counter.style.background = "#dcfce7";
  } else {
    counter.style.color = "#dc2626";
    counter.style.background = "#fee2e2";
  }
  
  // Auto-trigger batch search when exactly 100 codes are entered
  if (count === maxCount) {
    setTimeout(() => {
      const confirmSearch = confirm(`You've entered 100 hotel codes. Start batch search now?`);
      if (confirmSearch) {
        searchHotels();
      }
    }, 300);
  }
}

/* =========================================
   Configuration & Environment
   ========================================= */
const PREDEFINED_KEYS = [
  "6116982da6b759-28f8-4cdf-b210-04cb98116165",
  "7510455af381d5-d315-41e2-8e5e-e94cc0a960fe",
  "8112616278b36e4e-6996-4088-b66b-bf5d6787fe13",
  "81139487b3f2160f-acb8-41d6-9177-4bc69df0148a",
  "711814269fe755f1-cdc6-44bf-acbc-d91b1a451878",
  "412801f9073cf9-6dd0-40fa-b016-c2f5abf02355",
  "112571637e862b-8a47-475e-8fe4-1604fdf3ba03",
  "7128778166f20c-45ac-4608-8960-191b2c68f922"
];

function saveConfigState() {
  const envEl = document.getElementById("config-env");
  if (!envEl) return;

  localStorage.setItem("tj_env", envEl.value);
  updateEnvBanners(envEl.value);
}

function handleApiKeySelection() {
  const selectEl = document.getElementById("config-apikey-select");
  const customContainer = document.getElementById("custom-apikey-container");

  if (!selectEl) return;

  if (selectEl.value === "custom") {
    customContainer.style.display = "grid";
    unmaskCustomKey();
  } else {
    customContainer.style.display = "none";
    localStorage.setItem("tj_apikey", selectEl.value);
    updateGlobalSecurityBadge();
  }
}

function saveCustomApiKey() {
  const inputEl = document.getElementById("config-apikey-custom");
  if (!inputEl) return;
  const rawData = inputEl.value;

  // Guard against saving asterisks accidentally natively typing over the mask
  if (!rawData.includes("***")) {
    localStorage.setItem("tj_apikey", rawData.trim());
    updateGlobalSecurityBadge();
  }
}

function unmaskCustomKey() {
  const inputEl = document.getElementById("config-apikey-custom");
  if (inputEl) {
    const raw = localStorage.getItem("tj_apikey") || "";
    inputEl.value = raw;
  }
}

function maskCustomKey() {
  const inputEl = document.getElementById("config-apikey-custom");
  const rawKey = localStorage.getItem("tj_apikey") || "";

  if (inputEl && rawKey.length > 10) {
    inputEl.value = rawKey.substring(0, 10) + "******************";
  } else if (inputEl) {
    inputEl.value = rawKey;
  }
}

function loadConfigState() {
  const envEl = document.getElementById("config-env");
  const savedEnv = localStorage.getItem("tj_env") || "https://tj-hotel-admin.tripjack.com/";
  if (envEl) envEl.value = savedEnv;
  updateEnvBanners(savedEnv);

  const savedApikey = localStorage.getItem("tj_apikey") || "7510455af381d5-d315-41e2-8e5e-e94cc0a960fe";
  const selectEl = document.getElementById("config-apikey-select");
  const customContainer = document.getElementById("custom-apikey-container");

  // Save the API key to localStorage if not already set
  if (!localStorage.getItem("tj_apikey")) {
    localStorage.setItem("tj_apikey", savedApikey);
  }

  if (PREDEFINED_KEYS.includes(savedApikey)) {
    if (selectEl) selectEl.value = savedApikey;
    if (customContainer) customContainer.style.display = "none";
  } else {
    if (selectEl) selectEl.value = "custom";
    if (customContainer) customContainer.style.display = "grid";
    maskCustomKey(); // initialize masked
  }
  
  updateGlobalSecurityBadge();
}

function updateEnvBanners(envStr) {
  const warnBanner = document.getElementById("env-warning-banner");
  const warnName = document.getElementById("banner-env-name-danger");
  const safeBanner = document.getElementById("env-safe-banner");

  if (!warnBanner || !safeBanner) return;

  if (envStr.includes("apitest-hms")) {
    warnBanner.classList.add("hidden");
    safeBanner.classList.remove("hidden");
  } else {
    safeBanner.classList.add("hidden");
    warnBanner.classList.remove("hidden");
    if (warnName) warnName.textContent = envStr.includes("admin") ? "Admin TJ" : "Prod Tripjack";
  }

  updateGlobalSecurityBadge();
}

function updateGlobalSecurityBadge() {
  const envNameEl = document.getElementById("gs-env-name");
  const apiKeyEl = document.getElementById("gs-api-key");

  if (!envNameEl || !apiKeyEl) return;

  const envStr = localStorage.getItem("tj_env") || "https://tj-hotel-admin.tripjack.com/";
  const keyStr = localStorage.getItem("tj_apikey") || "";

  // Set Environment Text & Color
  if (envStr.includes("apitest-hms")) {
    envNameEl.textContent = "API Test Sandbox";
    envNameEl.style.color = "#0284c7"; // Safe Blue
  }
  else if (envStr.includes("admin")) {
    envNameEl.textContent = "Admin TJ";
    envNameEl.style.color = "#ea580c"; // Warning Orange
  }
  else {
    envNameEl.textContent = "Prod Tripjack";
    envNameEl.style.color = "#dc2626"; // Danger Red
  }

  // Set Masked Key Text
  if (keyStr.length > 10) {
    apiKeyEl.innerHTML = `${keyStr.substring(0, 10)}<span style="color:#94a3b8">***</span>`;
  } else if (keyStr) {
    apiKeyEl.textContent = keyStr;
  } else {
    apiKeyEl.textContent = "Not Set";
  }
}

function getConfigPayload() {
  return {
    env: localStorage.getItem("tj_env") || "https://tj-hotel-admin.tripjack.com/",
    apiKey: localStorage.getItem("tj_apikey") || ""
  };
}

/* =========================================
   Recent Bookings Flow
   ========================================= */
function saveRecentBooking(bookingId) {
  if (!bookingId) return;
  try {
    let bookings = JSON.parse(localStorage.getItem('tj_recent_bookings_data') || '[]');
    // Remove if already exists
    bookings = bookings.filter(b => b.id !== bookingId);
    // Add new booking at the beginning
    bookings.unshift({
      id: bookingId,
      createdAt: new Date().toISOString()
    });
    // Keep only last 10 bookings
    if (bookings.length > 10) bookings = bookings.slice(0, 10);
    localStorage.setItem('tj_recent_bookings_data', JSON.stringify(bookings));
    renderRecentBookings();
  } catch (e) { }
}

function renderRecentBookings() {
  const container = document.getElementById('recent-bookings-container');
  const list = document.getElementById('recent-bookings-list');
  const manageBtn = document.getElementById('manage-bookings-btn');
  if (!container || !list) return;

  try {
    let bookings = JSON.parse(localStorage.getItem('tj_recent_bookings_data') || '[]');
    if (bookings.length === 0) {
      list.innerHTML = '<div style="color: var(--text-muted); font-size: 0.9rem; padding: 8px 0;"><i class="ph ph-info"></i> No recent bookings yet. Make a booking to see it here.</div>';
      if (manageBtn) manageBtn.style.display = 'none';
      return;
    }

    if (manageBtn) manageBtn.style.display = 'inline-flex';
    list.innerHTML = bookings.slice(0, 5).map(booking => {
      const date = new Date(booking.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' });
      return `
        <a href="#" onclick="event.preventDefault(); window.history.pushState({ view: 'booking-detail' }, '', '/ui/booking-detail?id=${booking.id}'); showBookingDetailPage(); window.scrollTo({ top: 0, behavior: 'smooth' }); fetchAndRenderBookingDetail('${booking.id}');" style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px; background: #fff; border: 1px solid #d1d5db; border-radius: 8px; color: var(--text-main); font-size: 0.85rem; font-weight: 500; text-decoration: none; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05);" onmouseover="this.style.borderColor='var(--primary)'; this.style.color='var(--primary)';" onmouseout="this.style.borderColor='#d1d5db'; this.style.color='var(--text-main)';">
          <i class="ph ph-receipt" style="color: var(--primary);"></i> 
          <div style="text-align: left;">
            <div style="font-weight: 600;">${booking.id}</div>
            <div style="font-size: 0.75rem; opacity: 0.7;">${date}</div>
          </div>
        </a>
      `;
    }).join('');
  } catch (e) { }
}

async function searchHotels(cachedBody = null) {
  clearSearchError();
  setSearchLoading(true);

  try {
    let body;
    const config = getConfigPayload();

    if (cachedBody) {
      body = cachedBody;
    } else {
      const checkin = document.getElementById("checkin").value;
      const checkout = document.getElementById("checkout").value;
      const currency = document.getElementById("currency").value || "INR";
      const correlationInput = document.getElementById("correlationId").value.trim();
      const correlationId = correlationInput || `ui-${Date.now().toString(36).toUpperCase()}`;

      let hotelids = document.getElementById("hotelids").value.split(",");
      hotelids = hotelids.map((id) => parseInt(id.trim(), 10)).filter(Boolean);

      const rooms = readRoomsFromUi();

      body = {
        checkIn: checkin,
        checkOut: checkout,
        rooms,
        currency,
        correlationId,
        hids: hotelids,
        env: config.env,
        apiKey: config.apiKey
      };
      
      // Add optional nationality if selected
      const nationality = document.getElementById("nationality")?.value;
      if (nationality) {
        body.nationality = nationality;
      }
      
      // Add optional timeoutMs if provided
      const timeoutMs = document.getElementById("timeoutMs")?.value;
      if (timeoutMs) {
        body.timeoutMs = parseInt(timeoutMs, 10);
      }
    }

    // Check if we have exactly 100 hotel codes - use batch search
    if (body.hids && body.hids.length === 100) {
      console.log("Detected 100 hotel codes - using batch search endpoint");
      
      const startTime = performance.now();
      const batchBody = {
        checkIn: body.checkIn,
        checkOut: body.checkOut,
        rooms: body.rooms,
        currency: body.currency,
        correlationId: body.correlationId,
        hotelCodes: body.hids,
        location: "custom",
        env: body.env,
        apiKey: body.apiKey
      };

      const res = await fetch(`${API_BASE}/batch-search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batchBody),
      });

      const data = await res.json();
      const duration = Math.round(performance.now() - startTime);

      // Record API response time FIRST, before checking for errors
      recordApiTime('search', duration);

      if (!res.ok || data.ok === false) {
        const detail =
          data && typeof data === "object"
            ? `${data.status_code || res.status} ${data.reason || ""}`.trim()
            : `${res.status}`;
        showSearchError("Batch search failed. Check API response details.", detail, data);
        displayHotels(null);
        setSearchLoading(false);
        return;
      }

      // Record individual batch times if available
      if (data.batch_details && Array.isArray(data.batch_details)) {
        data.batch_details.forEach(batch => {
          if (batch.correlation_id) {
            // Calculate approximate batch time (total time / number of batches)
            const batchTime = Math.round(duration / data.batch_details.length);
            recordBatchTime(batch.correlation_id, batchTime);
          }
        });
      }

      // Format batch response for display
      const displayData = {
        ...data,
        hotels: data.hotels || data.data || []
      };

      displayHotels(displayData);
      globalSearchBody = body;
      sessionStorage.setItem("tj_global_search", JSON.stringify(body));
      switchToResultsPage(body, duration, displayData);
      setSearchLoading(false);
      return;
    }

    // Standard search for less than 100 codes
    const startTime = performance.now();
    const res = await fetch(`${API_BASE}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    const duration = Math.round(performance.now() - startTime);

    // Record API response time FIRST, before checking for errors
    recordApiTime('search', duration);

    if (!res.ok || data.ok === false) {
      const detail =
        data && typeof data === "object"
          ? `${data.status_code || res.status} ${data.reason || ""}`.trim()
          : `${res.status}`;
      showSearchError("Search failed. Check API response details.", detail, data);
      displayHotels(null);
      return;
    }

    displayHotels(data);
    globalSearchBody = body; // Cache for detail queries
    sessionStorage.setItem("tj_global_search", JSON.stringify(body));
    switchToResultsPage(body, duration, data);
  } catch (err) {
    showSearchError("Unexpected error while searching hotels.", err?.message);
    displayHotels(null);
  } finally {
    setSearchLoading(false);
  }
}

function readRoomsFromUi() {
  const container = document.getElementById("rooms-container");
  if (!container) return [{ adults: 2 }];

  const rooms = [];
  const rows = container.querySelectorAll(".room-row");

  rows.forEach((row) => {
    const adultsInput = row.querySelector('input[name="adults"]');
    const childrenInput = row.querySelector('input[name="children"]');
    const agesInput = row.querySelector('input[name="childAges"]');

    const adults = parseInt(adultsInput?.value || "0", 10) || 0;
    const children = parseInt(childrenInput?.value || "0", 10) || 0;
    const childAge = agesInput && agesInput.value.trim().length
      ? agesInput.value.split(",").map((v) => parseInt(v.trim(), 10)).filter((n) => Number.isFinite(n))
      : [];

    if (!adults && !children) return;

    const room = { adults };
    if (children > 0) {
      room.children = children;
      if (childAge.length) room.childAge = childAge;
    }
    rooms.push(room);
  });

  return rooms.length ? rooms : [{ adults: 2 }];
}

function displayHotels(data) {
  const results = document.getElementById("results");
  const meta = document.getElementById("results-meta");

  if (!results) return;

  // Handle batch search response format
  let hotels = [];
  if (data && data.hotels && Array.isArray(data.hotels)) {
    hotels = data.hotels;
  } else if (data && data.data && Array.isArray(data.data)) {
    hotels = data.data;
  }

  if (!data || hotels.length === 0) {
    results.classList.add("empty");
    results.innerHTML = `
      <div class="empty-state">
        <i class="ph ph-magnifying-glass"></i>
        <p>No hotels found for the given criteria.</p>
      </div>`;
    if (meta) meta.textContent = "";
    document.getElementById("results-filters-container").style.display = "none";
    document.getElementById("results-count").textContent = "";
    return;
  }

  document.getElementById("results-filters-container").style.display = "flex";
  document.getElementById("results-count").textContent = `(${hotels.length} Total)`;

  // Reset Results filters
  document.getElementById("r-filter-name").value = "";
  document.getElementById("r-filter-meal").value = "";
  document.getElementById("r-filter-gst").value = "";
  document.getElementById("r-filter-refund").value = "";
  document.getElementById("r-filter-pan").value = "";
  document.getElementById("r-filter-price").value = "";

  results.classList.remove("empty");
  results.innerHTML = "";
  if (meta) meta.textContent = `${hotels.length} option(s) returned`;

  hotels.forEach((hotel, index) => {
    const option = hotel.options?.[0];
    if (!option) return;

    const card = document.createElement("div");
    card.className = "hotel-card fade-in";
    card.style.animationDelay = `${index * 0.05}s`;
    card.dataset.originalIndex = index;

    // Basic Info
    const name = hotel.name || "Unknown Hotel";
    const roomName = option.roomInfo?.[0]?.name ?? "Standard Room";

    let locationStr = hotel.city || "";
    if (hotel.country) locationStr += (locationStr ? ", " : "") + hotel.country;
    let stars = hotel.starRating ? ` · <span style="color:#eab308"><i class="ph-fill ph-star"></i> ${hotel.starRating}</span>` : "";

    // Data Extraction
    const currency = option.pricing?.currency ?? "INR";
    const basePrice = (option.pricing?.basePrice ?? 0).toFixed(2);
    const taxes = (option.pricing?.taxes ?? 0).toFixed(2);
    const discount = (option.pricing?.discount ?? 0).toFixed(2);
    const mf = (option.pricing?.mf ?? 0).toFixed(2);
    const mft = (option.pricing?.mft ?? 0).toFixed(2);
    const totalPrice = (option.pricing?.totalPrice ?? 0).toFixed(2);

    const mealBasis = option.mealBasis || "Room Only";
    const isRefundable = option.cancellation?.isRefundable;

    const rawOptionType = option.optionType || "UNKNOWN";
    const optionTypeData = OPTION_TYPES[rawOptionType] || { name: rawOptionType, desc: "" };
    const optionTypeTitle = optionTypeData.desc ? `title="${optionTypeData.desc}"` : "";

    const gstType = option.compliance?.gstType || "NA";
    const panRequired = option.compliance?.panRequired ? "Yes" : "No";
    const passRequired = option.compliance?.passportRequired ? "Yes" : "No";

    const commercialType = option.commercial?.type || "Net";
    const commission = option.commercial?.commission ? option.commercial.commission.toFixed(2) : "0.00";

    // Pill generators
    const refundPill = isRefundable
      ? `<span class="data-pill pill-success"><i class="ph ph-check-circle"></i> Refundable</span>`
      : `<span class="data-pill pill-danger"><i class="ph ph-warning-circle"></i> Non-Refundable</span>`;

    // Add dataset fields matching Detail format for filtering
    const roomIdsString = option.roomInfo?.map(r => r.id).join(" ").toLowerCase() || "";
    card.dataset.hotelName = name.toLowerCase();
    card.dataset.roomName = roomName.toLowerCase();
    card.dataset.optionId = option.optionId.toLowerCase();
    card.dataset.hotelId = hotel.hotelId.toLowerCase();
    card.dataset.roomId = roomIdsString;
    card.dataset.meal = mealBasis.toLowerCase();
    card.dataset.gst = gstType.toLowerCase();
    card.dataset.refundable = isRefundable ? "true" : "false";
    card.dataset.pan = option.compliance?.panRequired ? "true" : "false";
    card.dataset.passport = option.compliance?.passportRequired ? "true" : "false";
    card.dataset.price = totalPrice;

    card.innerHTML = `
      <div class="hotel-header">
        <h3 class="hotel-name">
          ${name}
          <div style="display:flex; gap:8px;">
            <span class="hotel-id-badge">Option ID: ${option.optionId}</span>
            <span class="hotel-id-badge">ID: ${hotel.hotelId}</span>
          </div>
        </h3>
        <div class="hotel-location">
          <i class="ph ph-map-pin"></i> ${locationStr}${stars}
        </div>
      </div>
      
      <div class="room-details-section">
        <div class="room-title">
          <i class="ph ph-bed"></i> ${roomName}
        </div>
        <div class="hotel-tags">
          <span class="data-pill pill-warning" ${optionTypeTitle}><i class="ph ph-tag"></i> ${optionTypeData.name}</span>
          <span class="data-pill pill-primary"><i class="ph ph-fork-knife"></i> ${mealBasis}</span>
          ${refundPill}
          <span class="data-pill pill-neutral">GST: ${gstType}</span>
          <span class="data-pill pill-neutral">PAN Req: ${panRequired}</span>
          <span class="data-pill pill-neutral">PassPortRequired: ${passRequired}</span>
          <span class="data-pill pill-purple"><i class="ph ph-receipt"></i> Type: ${commercialType} (${currency} ${commission})</span>
        </div>
      </div>

      <div class="hotel-price-row">
        <div class="price-breakdown">
          <div class="price-item">
            <span class="price-label">Base</span>
            <span class="price-value">${currency} ${basePrice}</span>
          </div>
          <div class="price-item">
            <span class="price-label">Taxes</span>
            <span class="price-value">+ ${currency} ${taxes}</span>
          </div>
          <div class="price-item">
            <span class="price-label">Discount</span>
            <span class="price-value" style="color:var(--success-text)">- ${currency} ${discount}</span>
          </div>
          <div class="price-item">
            <span class="price-label">MF</span>
            <span class="price-value">+ ${currency} ${mf}</span>
          </div>
          <div class="price-item">
            <span class="price-label">MFT</span>
            <span class="price-value">+ ${currency} ${mft}</span>
          </div>
          <div class="price-item">
            <span class="price-label">Total</span>
            <span class="price-total">${currency} ${totalPrice}</span>
          </div>
          <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 0.8rem; color: #64748b; font-style: italic;">
            ${amountToWords(parseFloat(totalPrice), currency)}
          </div>
        </div>
        
        <button class="btn-premium" onclick="fetchHotelDetails('${hotel.hotelId}')">
          View Rooms <i class="ph ph-arrow-right"></i>
        </button>
      </div>
    `;

    results.appendChild(card);
  });
}

function applySearchFilters() {
  const searchTerm = document.getElementById("r-filter-name").value.toLowerCase();
  const mealFilter = document.getElementById("r-filter-meal").value.toLowerCase();
  const gstFilter = document.getElementById("r-filter-gst").value.toLowerCase();
  const refundFilter = document.getElementById("r-filter-refund").value;
  const panFilter = document.getElementById("r-filter-pan").value;
  const priceSort = document.getElementById("r-filter-price").value;

  const resultsContainer = document.getElementById("results");
  
  // Store cards BEFORE clearing
  let cards = Array.from(resultsContainer.querySelectorAll(".hotel-card"));
  
  // Show loading state
  resultsContainer.innerHTML = `
    <div style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; gap: 16px;">
      <div class="loader" style="border-color: var(--primary); border-top-color: transparent; width: 40px; height: 40px;"></div>
      <div style="text-align: center;">
        <p style="font-size: 1rem; font-weight: 600; color: var(--text-main); margin-bottom: 4px;">Applying Filter...</p>
        <p style="font-size: 0.9rem; color: var(--text-muted);">Please wait while we sort and filter your options</p>
      </div>
    </div>
  `;

  // Use setTimeout to allow UI to update before processing
  setTimeout(() => {
    // Sort cards
    if (priceSort === "low_to_high") {
      cards.sort((a, b) => parseFloat(a.dataset.price) - parseFloat(b.dataset.price));
    } else if (priceSort === "high_to_low") {
      cards.sort((a, b) => parseFloat(b.dataset.price) - parseFloat(a.dataset.price));
    } else {
      cards.sort((a, b) => parseInt(a.dataset.originalIndex) - parseInt(b.dataset.originalIndex));
    }

    // Clear container and re-add sorted cards
    resultsContainer.innerHTML = '';
    cards.forEach(card => resultsContainer.appendChild(card));

    let visibleCount = 0;

    cards.forEach(card => {
      const ds = card.dataset;
      let isMatch = true;

      // Search input (Name, OptionID, RoomID, HotelID)
      if (searchTerm) {
        if (!ds.hotelName.includes(searchTerm) &&
          !ds.roomName.includes(searchTerm) &&
          !ds.optionId.includes(searchTerm) &&
          !ds.hotelId.includes(searchTerm) &&
          !ds.roomId.includes(searchTerm)) {
          isMatch = false;
        }
      }
      // Dropdowns
      if (mealFilter && ds.meal !== mealFilter) isMatch = false;
      if (gstFilter && ds.gst !== gstFilter) isMatch = false;
      if (refundFilter && ds.refundable !== refundFilter) isMatch = false;
      if (panFilter && ds.pan !== panFilter) isMatch = false;

      if (isMatch) {
        card.style.display = "flex";
        card.classList.add("fade-in");
        visibleCount++;
      } else {
        card.style.display = "none";
        card.classList.remove("fade-in");
      }
  });

  const countSpan = document.getElementById("results-count");
  if (countSpan) {
    countSpan.textContent = `(${visibleCount} Visible / ${cards.length} Total)`;
  }

  // Handle Empty Block
  let existingEmpty = document.getElementById("r-filter-empty");
  if (visibleCount === 0) {
    if (!existingEmpty) {
      const emptyState = document.createElement("div");
      emptyState.id = "r-filter-empty";
      emptyState.className = "empty-state";
      emptyState.style.width = "100%";
      emptyState.innerHTML = `<i class="ph ph-funnel-x" style="font-size:3rem; color: #cbd5e1; margin-bottom:12px;"></i><p>Sorry, no hotels available for this filter constraint. Please try another combination.</p>`;
      resultsContainer.appendChild(emptyState);
    }
  } else if (existingEmpty) {
    existingEmpty.remove();
  }
  }, 300); // Small delay to show loading state
}

function hideAllPages() {
  const pages = ["login-page", "search-page", "results-page", "detail-page", "review-page", "booking-detail-page", "manage-bookings-page"];
  pages.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add("hidden");
      el.classList.remove("fade-in");
    }
  });
}

function switchToResultsPage(lastSearchBody, durationMs, data) {
  const resultsPage = document.getElementById("results-page");
  const summary = document.getElementById("results-summary");
  const searchInfoDisplay = document.getElementById("search-info-display");

  hideAllPages();
  if (resultsPage) {
    resultsPage.classList.remove("hidden");
    resultsPage.classList.add("fade-in");
  }

  // Smooth scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Update URL
  if (window.location.pathname !== '/ui/results') {
    history.pushState({ view: 'results' }, '', '/ui/results');
  }

  // Display search info
  if (searchInfoDisplay) {
    const searchInfo = formatSearchInfo();
    if (searchInfo) {
      searchInfoDisplay.querySelector('span').textContent = searchInfo;
    }
  }

  if (summary && lastSearchBody) {
    let stayNights = 1;
    if (lastSearchBody.checkIn && lastSearchBody.checkOut) {
      const start = new Date(lastSearchBody.checkIn);
      const end = new Date(lastSearchBody.checkOut);
      stayNights = Math.round((end - start) / (1000 * 60 * 60 * 24));
    }

    let totalAdults = 0;
    let totalChildren = 0;
    let childAges = [];
    lastSearchBody.rooms?.forEach((r) => {
      totalAdults += r.adults || 0;
      totalChildren += r.children || 0;
      if (r.childAge) childAges.push(...r.childAge);
    });

    let guestStr = `${totalAdults} Adult(s)`;
    if (totalChildren > 0) {
      guestStr += `, ${totalChildren} Child(ren)`;
      if (childAges.length > 0) {
        guestStr += ` (Ages: ${childAges.join(", ")})`;
      }
    }

    const searchedIds = lastSearchBody.hids?.length || 0;
    const returnedHotels = data?.hotels?.length || 0;
    const roomCount = lastSearchBody.rooms?.length || 0;
    const currency = lastSearchBody.currency || "INR";

    summary.innerHTML = `
      Searched <strong>${searchedIds}</strong> hotel(s), found <strong>${returnedHotels}</strong> hotel(s) in result.<br>
      <span style="display:inline-block; margin-top:8px;">
        <strong>${roomCount}</strong> Room(s) for <strong>${guestStr}</strong> &middot; 
        <strong>${stayNights}</strong> Night(s) (${lastSearchBody.checkIn} &rarr; ${lastSearchBody.checkOut}) &middot; 
        <strong>${currency}</strong>
      </span>
    `;
  }
}

function backToSearch() {
  // Clear any existing search to guarantee fresh UI state
  window.location.href = '/ui/search';
}

function backToResults() {
  const resultsPage = document.getElementById("results-page");
  const detailPage = document.getElementById("detail-page");

  if (detailPage) {
    detailPage.classList.remove("fade-in");
    detailPage.classList.add("hidden");
  }
  if (resultsPage) {
    resultsPage.classList.remove("hidden");
    resultsPage.classList.add("fade-in");
    
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Update URL
  if (window.location.pathname !== '/ui/results') {
    history.pushState({ view: 'results' }, '', '/ui/results');
  }
}

async function fetchHotelDetails(hotelId) {
  if (!globalSearchBody) return;

  const detailPage = document.getElementById("detail-page");
  const header = document.getElementById("hotel-detail-header");
  const resultsContainer = document.getElementById("detail-results");
  const errorBox = document.getElementById("detail-error");

  // Reset View
  hideAllPages();
  if (detailPage) {
    detailPage.classList.remove("hidden");
    detailPage.classList.add("fade-in");
  }

  // Smooth scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Update URL
  if (window.location.search !== `?hid=${hotelId}`) {
    history.pushState({ view: 'detail', hid: hotelId }, '', `/ui/detail?hid=${hotelId}`);
  }

  header.innerHTML = `<h2 class="hotel-name">Loading Details...</h2>`;
  resultsContainer.innerHTML = `
    <div class="empty-state">
      <div class="loader" style="margin-bottom: 16px; border-color: var(--primary); border-top-color: transparent; width: 30px; height: 30px;"></div>
      <p>Fetching dynamic hotel details...</p>
    </div>
  `;
  errorBox.classList.add("hidden");

  try {
    const config = getConfigPayload();
    const body = {
      ...globalSearchBody,
      hid: hotelId,
      env: config.env,
      apiKey: config.apiKey
    };
    delete body.hids; // Detail API takes hid, not an array of hids

    const staticBody = {
      hid: hotelId,
      env: config.env,
      apiKey: config.apiKey
    };

    const startTime = performance.now();

    // Fetch static details in parallel
    const staticStartTime = performance.now();
    fetch(`${API_BASE}/static-detail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(staticBody)
    })
      .then(res => res.json())
      .then(data => {
        const staticDuration = Math.round(performance.now() - staticStartTime);
        recordApiTime('staticDetail', staticDuration);
        renderStaticDetails(data);
      })
      .catch(err => console.error("Static details fetch failed:", err));

    const res = await fetch(`${API_BASE}/dynamic-detail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    const durationMs = Math.round(performance.now() - startTime);

    if (!res.ok || data.ok === false) {
      errorBox.classList.remove("hidden");
      errorBox.querySelector(".message").textContent = "Failed to load dynamic hotel details.";
      const rawHtml = JSON.stringify(data, null, 2);
      const pre = errorBox.querySelector(".raw-error");
      pre.textContent = rawHtml;
      pre.classList.remove("hidden");
      resultsContainer.innerHTML = "";
      return;
    }

    // Record API response time
    recordApiTime('detail', durationMs);

    // Display search info
    const detailSearchInfo = document.getElementById("detail-search-info");
    if (detailSearchInfo) {
      const searchInfo = formatSearchInfo();
      if (searchInfo) {
        detailSearchInfo.querySelector('span').textContent = searchInfo;
      }
    }

    // Show room filters once dynamic data loads
    const filters = document.getElementById("room-filters");
    if (filters) filters.style.display = 'flex';

    renderHotelDetails(data);
  } catch (err) {
    errorBox.classList.remove("hidden");
    errorBox.querySelector(".message").textContent = err.message;
    resultsContainer.innerHTML = "";
  }
}

function renderStaticDetails(data) {
  const container = document.getElementById("static-detail-container");
  if (!container) return;

  if (!data || data.ok === false) return; // Silent fail for static details

  const staticDetails = data;
  if (!staticDetails.name && !staticDetails.images && !staticDetails.descriptions) return;

  // 1. Photos Gallery with Zoom
  let imagesHtml = '';
  if (staticDetails.images && staticDetails.images.length > 0) {
    const allImages = staticDetails.images;
    imagesHtml = `
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 1.1rem; color: #1e293b; margin-bottom: 12px; font-weight: 600;"><i class="ph ph-image"></i> Photo Gallery</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin-bottom: 16px;">
          ${allImages.slice(0, 12).map((img, idx) => {
            const url = img.links?.original?.href || img.url || "";
            if (!url) return '';
            return `
              <div style="position: relative; overflow: hidden; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); cursor: pointer; transition: transform 0.3s ease;" 
                   onclick="openImageZoom('${url}')" 
                   onmouseover="this.style.transform='scale(1.05)'" 
                   onmouseout="this.style.transform='scale(1)'">
                <img src="${url}" alt="Hotel Image ${idx + 1}" style="width: 100%; height: 160px; object-fit: cover;"/>
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0); transition: background 0.3s ease;" 
                     onmouseover="this.style.background='rgba(0,0,0,0.3)'" 
                     onmouseout="this.style.background='rgba(0,0,0,0)'">
                  <i class="ph ph-magnifying-glass" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-size: 1.5rem; opacity: 0; transition: opacity 0.3s ease;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0'"></i>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // 2. Star rating & Property Type
  let propertyTypeHtml = '';
  if (staticDetails.property_type && staticDetails.property_type.name) {
    propertyTypeHtml = `<span style="display:inline-block; padding: 6px 14px; background: linear-gradient(135deg, rgba(99,102,241,0.1), rgba(59,130,246,0.1)); color: var(--primary); font-size: 0.85rem; font-weight: 600; border-radius: 999px; margin-bottom: 12px; border: 1px solid rgba(59,130,246,0.2);"><i class="ph ph-building"></i> ${staticDetails.property_type.name}</span>`;
  }

  let starsHtml = '';
  if (staticDetails.star_rating) {
    starsHtml = `<div style="color: #eab308; font-size: 1.2rem; margin-bottom: 12px; font-weight: 600;"><i class="ph-fill ph-star"></i> ${staticDetails.star_rating} Star Rating</div>`;
  }

  // 3. Address & Contact
  let addressHtml = '';
  if (staticDetails.locale && staticDetails.locale.address) {
    const add = staticDetails.locale.address;
    const parts = [add.line_1, add.city, add.statename, add.countryname, add.postal_code].filter(Boolean);
    const phone = staticDetails.locale.phone ? staticDetails.locale.phone[0] : '';
    addressHtml = `
      <div style="background: linear-gradient(135deg, rgba(59,130,246,0.05), rgba(99,102,241,0.05)); padding: 16px; border-radius: 12px; border-left: 4px solid var(--primary); margin-bottom: 16px;">
        <div style="font-size: 0.95rem; color: #475569; margin-bottom: 8px;"><i class="ph ph-map-pin" style="color: var(--primary); margin-right: 8px;"></i> ${parts.join(', ')}</div>
        ${phone ? `<div style="font-size: 0.95rem; color: #475569;"><i class="ph ph-phone" style="color: var(--primary); margin-right: 8px;"></i> ${phone}</div>` : ''}
      </div>
    `;
  }

  // 4. Description
  let descHtml = '';
  if (staticDetails.descriptions) {
    const headline = staticDetails.descriptions.headline || '';
    const location = staticDetails.descriptions.default ? JSON.parse(staticDetails.descriptions.default).location || '' : '';
    const attractions = staticDetails.descriptions.default ? JSON.parse(staticDetails.descriptions.default).attractions || '' : '';
    
    descHtml = `
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 1.1rem; color: #1e293b; margin-bottom: 12px; font-weight: 600;"><i class="ph ph-info"></i> About Hotel</h3>
        <p style="font-size: 0.95rem; color: #475569; line-height: 1.6; margin-bottom: 16px;">${headline}</p>
        ${location ? `<div style="font-size: 0.9rem; color: #64748b; line-height: 1.6; padding: 12px; background: #f8fafc; border-radius: 8px; margin-bottom: 12px;"><strong>Location:</strong> ${location}</div>` : ''}
        ${attractions ? `<div style="font-size: 0.9rem; color: #64748b; line-height: 1.6; padding: 12px; background: #f8fafc; border-radius: 8px;"><strong>Nearby Attractions:</strong> ${attractions}</div>` : ''}
      </div>
    `;
  }

  // 5. Amenities
  let amenitiesHtml = '';
  if (staticDetails.amenities) {
    const amenitiesValues = Object.values(staticDetails.amenities);
    if (amenitiesValues.length > 0) {
      amenitiesHtml = `
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 1.1rem; color: #1e293b; margin-bottom: 12px; font-weight: 600;"><i class="ph ph-star"></i> Amenities (${amenitiesValues.length})</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px;">
            ${amenitiesValues.map(am => `
              <div style="font-size: 0.85rem; padding: 8px 12px; background: linear-gradient(135deg, #f0f9ff, #f8fafc); color: #334155; border-radius: 8px; border: 1px solid #e0f2fe; font-weight: 500; display: flex; align-items: center; gap: 6px;">
                <i class="ph ph-check-circle" style="color: var(--primary); font-size: 1rem;"></i> ${am.name}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
  }

  // 6. Policies & Check-in Info
  let policiesHtml = '';
  if (staticDetails.policies) {
    const policies = staticDetails.policies;
    const checkin = policies.checkInCheckOut || {};
    const specialInstructions = policies.special_instructions ? JSON.parse(policies.special_instructions) : {};
    const knowBeforeYouGo = policies.know_before_you_go ? JSON.parse(policies.know_before_you_go) : {};
    const mandatoryFees = policies.mandatory_fees ? JSON.parse(policies.mandatory_fees) : {};
    
    policiesHtml = `
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 1.1rem; color: #1e293b; margin-bottom: 12px; font-weight: 600;"><i class="ph ph-info"></i> Important Information</h3>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px; margin-bottom: 16px;">
          ${checkin.checkin_from ? `
            <div style="background: linear-gradient(135deg, rgba(34,197,94,0.05), rgba(74,222,128,0.05)); padding: 12px; border-radius: 8px; border-left: 4px solid #22c55e;">
              <div style="font-size: 0.8rem; color: #64748b; font-weight: 600; margin-bottom: 4px;"><i class="ph ph-sign-in"></i> Check-in</div>
              <div style="font-size: 0.9rem; color: #1e293b; font-weight: 600;">${checkin.checkin_from} - ${checkin.checkin_till || 'Late'}</div>
            </div>
          ` : ''}
          ${checkin.checkout_from ? `
            <div style="background: linear-gradient(135deg, rgba(239,68,68,0.05), rgba(248,113,113,0.05)); padding: 12px; border-radius: 8px; border-left: 4px solid #ef4444;">
              <div style="font-size: 0.8rem; color: #64748b; font-weight: 600; margin-bottom: 4px;"><i class="ph ph-sign-out"></i> Check-out</div>
              <div style="font-size: 0.9rem; color: #1e293b; font-weight: 600;">${checkin.checkout_from}</div>
            </div>
          ` : ''}
          ${checkin.checkin_min_age ? `
            <div style="background: linear-gradient(135deg, rgba(168,85,247,0.05), rgba(196,181,253,0.05)); padding: 12px; border-radius: 8px; border-left: 4px solid #a855f7;">
              <div style="font-size: 0.8rem; color: #64748b; font-weight: 600; margin-bottom: 4px;"><i class="ph ph-user"></i> Min. Age</div>
              <div style="font-size: 0.9rem; color: #1e293b; font-weight: 600;">${checkin.checkin_min_age}+</div>
            </div>
          ` : ''}
        </div>

        ${specialInstructions['Special Instructions'] ? `
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
            <div style="font-size: 0.85rem; color: #92400e; font-weight: 600; margin-bottom: 6px;"><i class="ph ph-warning"></i> Special Instructions</div>
            <div style="font-size: 0.85rem; color: #b45309; line-height: 1.5;">${specialInstructions['Special Instructions']}</div>
          </div>
        ` : ''}

        ${knowBeforeYouGo['know_before_you_go'] ? `
          <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
            <div style="font-size: 0.85rem; color: #1e40af; font-weight: 600; margin-bottom: 6px;"><i class="ph ph-info"></i> Know Before You Go</div>
            <div style="font-size: 0.85rem; color: #1e3a8a; line-height: 1.5;">${knowBeforeYouGo['know_before_you_go']}</div>
          </div>
        ` : ''}

        ${mandatoryFees['Mandatory'] ? `
          <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; border-radius: 8px;">
            <div style="font-size: 0.85rem; color: #991b1b; font-weight: 600; margin-bottom: 6px;"><i class="ph ph-receipt"></i> Mandatory Fees</div>
            <div style="font-size: 0.85rem; color: #b91c1c; line-height: 1.5;">${mandatoryFees['Mandatory']}</div>
          </div>
        ` : ''}
      </div>
    `;
  }

  // 7. Chain & Active Status
  let chainHtml = '';
  if (staticDetails.chain || staticDetails.is_active !== undefined) {
    const chainName = staticDetails.chain?.name || 'Independent';
    const isActive = staticDetails.is_active ? '<i class="ph ph-check-circle" style="color: #22c55e;"></i> Active' : '<i class="ph ph-x-circle" style="color: #ef4444;"></i> Inactive';
    chainHtml = `
      <div style="display: flex; gap: 12px; margin-bottom: 24px;">
        <div style="flex: 1; background: linear-gradient(135deg, rgba(99,102,241,0.1), rgba(59,130,246,0.1)); padding: 12px; border-radius: 8px; border: 1px solid rgba(59,130,246,0.2);">
          <div style="font-size: 0.8rem; color: #64748b; font-weight: 600; margin-bottom: 4px;"><i class="ph ph-link"></i> Chain</div>
          <div style="font-size: 0.95rem; color: #1e293b; font-weight: 600;">${chainName}</div>
        </div>
        <div style="flex: 1; background: linear-gradient(135deg, rgba(34,197,94,0.1), rgba(74,222,128,0.1)); padding: 12px; border-radius: 8px; border: 1px solid rgba(34,197,94,0.2);">
          <div style="font-size: 0.8rem; color: #64748b; font-weight: 600; margin-bottom: 4px;"><i class="ph ph-info"></i> Status</div>
          <div style="font-size: 0.95rem; color: #1e293b; font-weight: 600;">${isActive}</div>
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="glass-panel fade-in-up" style="padding: 24px; margin-bottom: 24px; border-top: 4px solid var(--primary);">
      ${imagesHtml}
      ${propertyTypeHtml}
      ${starsHtml}
      ${addressHtml}
      ${chainHtml}
      ${descHtml}
      ${amenitiesHtml}
      ${policiesHtml}
    </div>
  `;
}

// Image Zoom Modal
function openImageZoom(imageUrl) {
  const modal = document.createElement('div');
  modal.id = 'image-zoom-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: fadeIn 0.3s ease;
  `;
  
  modal.innerHTML = `
    <div style="position: relative; max-width: 90vw; max-height: 90vh;">
      <img src="${imageUrl}" alt="Zoomed Hotel Image" style="width: 100%; height: 100%; object-fit: contain; border-radius: 8px;"/>
      <button onclick="closeImageZoom()" style="position: absolute; top: 16px; right: 16px; background: rgba(255,255,255,0.2); border: none; color: white; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 1.5rem; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
        <i class="ph ph-x"></i>
      </button>
    </div>
  `;
  
  document.body.appendChild(modal);
  modal.onclick = (e) => {
    if (e.target === modal) closeImageZoom();
  };
}

function closeImageZoom() {
  const modal = document.getElementById('image-zoom-modal');
  if (modal) {
    modal.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => modal.remove(), 300);
  }
}

function renderHotelDetails(data) {
  const header = document.getElementById("hotel-detail-header");
  const resultsContainer = document.getElementById("detail-results");
  resultsContainer.innerHTML = ""; // Clear loader

  // Tripjack sometimes returns a flat root object with `hotelId` and `options`,
  // OR wraps it in `data.hotel` / `data.hotels`.
  let hotel;
  if (data.hotelId || data.hotelName || data.options) hotel = data;
  else if (data.hotel && !Array.isArray(data.hotel)) hotel = data.hotel;
  else if (data.hotel && Array.isArray(data.hotel)) hotel = data.hotel[0];
  else if (data.hotels && Array.isArray(data.hotels)) hotel = data.hotels[0];

  if (!hotel) {
    resultsContainer.innerHTML = `<div class="empty-state"><i class="ph ph-warning-circle"></i><p>No details found for this hotel.</p></div>`;
    return;
  }

  // Check if price changed
  let priceAlert = "";
  if (data.priceChanged) {
    if (typeof data.priceChanged === 'object' && data.priceChanged.oldPrice && data.priceChanged.newPrice) {
      const pCurrency = data.priceChanged.currency || "INR";
      priceAlert = `<div class="alert-box warning fade-in" style="margin-bottom: 16px;"><i class="ph ph-warning"></i> <span>Note: The price has changed from <strong>${pCurrency} ${data.priceChanged.oldPrice.toFixed(2)}</strong> to <strong>${pCurrency} ${data.priceChanged.newPrice.toFixed(2)}</strong>. Please review the new price below.</span></div>`;
    } else {
      priceAlert = `<div class="alert-box warning fade-in" style="margin-bottom: 16px;"><i class="ph ph-warning"></i> <span>Note: The price and/or availability has changed since your search! Please review the new price below.</span></div>`;
    }
  }

  // Header Details
  const name = hotel.name || hotel.hotelName || "Unknown Hotel";
  const reviewHash = data.reviewHash || hotel.reviewHash || "";
  let locationStr = hotel.city || "";
  if (hotel.country) locationStr += (locationStr ? ", " : "") + hotel.country;
  let stars = hotel.starRating ? ` · <span style="color:#eab308"><i class="ph-fill ph-star"></i> ${hotel.starRating}</span>` : "";

  header.innerHTML = `
        <h2 class="hotel-name" style="font-size: 1.8rem;">
          ${name}
      <span class="hotel-id-badge" style="font-size: 0.8rem; align-self: center;">ID: ${hotel.hotelId}</span>
    </h2>
        <div class="hotel-location" style="font-size: 1rem; margin-top: 8px;">
          <i class="ph ph-map-pin"></i> ${locationStr}${stars}
        </div>
      `;

  if (!hotel.options || hotel.options.length === 0) {
    document.getElementById("detail-room-count").textContent = "(0 Total)";
    resultsContainer.innerHTML = `<div class="empty-state"><i class="ph ph-bed"></i><p>No room options currently available.</p></div>`;
    return;
  }

  document.getElementById("detail-room-count").textContent = `(${hotel.options.length} Total)`;

  // Reset filter inputs
  document.getElementById("filter-room-name").value = "";
  document.getElementById("filter-meal").value = "";
  document.getElementById("filter-gst").value = "";
  document.getElementById("filter-refund").value = "";
  document.getElementById("filter-pan").value = "";
  document.getElementById("filter-price").value = "";

  // Render each option as a card inside the detail list
  hotel.options.forEach((option, index) => {
    const card = document.createElement("div");
    card.className = "hotel-card detail-option-card fade-in";
    card.dataset.originalIndex = index;

    // Fallback UI mapping (reuse same logic as search options)
    const roomNames = option.roomInfo?.map(r => `<i class="ph ph-bed"></i> ${r.name} ${r.id ? `<span class="hotel-id-badge" style="font-size:0.7rem; margin-left:6px; background:rgba(255,255,255,0.6);"><i class="ph ph-identification-badge"></i> ID: ${r.id}</span>` : ''}`).join("<br>") ?? '<i class="ph ph-bed"></i> Standard Room';

    // String for searching room IDs
    const roomIdsString = option.roomInfo?.map(r => r.id).join(" ").toLowerCase() || "";

    const currency = option.pricing?.currency ?? "INR";
    const basePrice = (option.pricing?.basePrice ?? 0).toFixed(2);
    const taxes = (option.pricing?.taxes ?? 0).toFixed(2);
    const discount = (option.pricing?.discount ?? 0).toFixed(2);
    const mf = (option.pricing?.mf ?? 0).toFixed(2);
    const mft = (option.pricing?.mft ?? 0).toFixed(2);
    const totalPrice = (option.pricing?.totalPrice ?? 0).toFixed(2);

    const mealBasis = option.mealBasis || "Room Only";
    const isRefundable = option.cancellation?.isRefundable;

    const rawOptionType = option.optionType || "UNKNOWN";
    const optionTypeData = OPTION_TYPES[rawOptionType] || { name: rawOptionType, desc: "" };
    const optionTypeTitle = optionTypeData.desc ? `title="${optionTypeData.desc}"` : "";

    const gstType = option.compliance?.gstType || "NA";
    const panRequired = option.compliance?.panRequired ? "Yes" : "No";
    const passRequired = option.compliance?.passportRequired ? "Yes" : "No";

    const commercialType = option.commercial?.type || "Net";
    const commission = option.commercial?.commission ? option.commercial.commission.toFixed(2) : "0.00";

    let penaltiesHtml = "";
    
    if (option.cancellation?.penalties?.length > 0) {
      const penaltyRows = option.cancellation.penalties.map(p => {
        const fromDate = p.from ? new Date(p.from).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "—";
        const toDate = p.to ? new Date(p.to).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "—";
        const penaltyAmount = p.amount ? `${currency} ${p.amount.toFixed(2)}` : "—";
        const borderColor = isRefundable ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)';
        return `<tr style="border-bottom:1px solid ${borderColor};">
          <td style="padding:10px 12px; font-size:0.8rem; color:${isRefundable ? '#166534' : '#7f1d1d'};">${fromDate}</td>
          <td style="padding:10px 12px; font-size:0.8rem; color:${isRefundable ? '#166534' : '#7f1d1d'};">${toDate}</td>
          <td style="padding:10px 12px; text-align:center; font-size:0.8rem; font-weight:700; color:${isRefundable ? '#16a34a' : '#dc2626'};">${penaltyAmount}</td>
        </tr>`;
      }).join("");
      
      const bgColor = isRefundable ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)';
      const borderColor = isRefundable ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)';
      const headerBg = isRefundable ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';
      const headerBorder = isRefundable ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)';
      const headerColor = isRefundable ? '#166534' : '#991b1b';
      const title = isRefundable ? 'Refundable - Cancellation Policy' : 'Non-Refundable - Cancellation Policy';
      
      penaltiesHtml = `<div style="margin-top:12px; background:${bgColor}; border:1px solid ${borderColor}; border-radius:var(--radius-sm); padding:10px 14px; overflow-x:auto;">
        <div style="font-size:0.8rem; font-weight:600; color:${headerColor}; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px;">${title}</div>
        <table style="width:100%; border-collapse:collapse; font-size:0.8rem;">
          <thead>
            <tr style="background:${headerBg}; border-bottom:1px solid ${headerBorder};">
              <th style="padding:8px 12px; text-align:left; font-weight:600; color:${headerColor}; font-size:0.7rem; text-transform:uppercase;">From</th>
              <th style="padding:8px 12px; text-align:left; font-weight:600; color:${headerColor}; font-size:0.7rem; text-transform:uppercase;">To</th>
              <th style="padding:8px 12px; text-align:center; font-weight:600; color:${headerColor}; font-size:0.7rem; text-transform:uppercase;">Penalty</th>
            </tr>
          </thead>
          <tbody>
            ${penaltyRows}
          </tbody>
        </table>
      </div>`;
    }

    // Add dataset attributes for filtering
    card.dataset.roomName = roomNames.replace(/(<([^>]+)>)/gi, "").toLowerCase(); // strip html back to basic string
    card.dataset.optionId = option.optionId.toLowerCase();
    card.dataset.roomId = roomIdsString;
    card.dataset.meal = mealBasis.toLowerCase();
    card.dataset.gst = gstType.toLowerCase();
    card.dataset.refundable = isRefundable ? "true" : "false";
    card.dataset.pan = option.compliance?.panRequired ? "true" : "false";
    card.dataset.passport = option.compliance?.passportRequired ? "true" : "false";
    card.dataset.price = totalPrice;

    const refundPill = isRefundable
      ? `<span class="data-pill pill-success"><i class="ph ph-check-circle"></i> Refundable</span>`
      : `<span class="data-pill pill-danger"><i class="ph ph-warning-circle"></i> Non - Refundable</span>`;

    // Room availability badge
    const roomLeft = option.roomLeft ?? 0;
    const roomAvailabilityColor = roomLeft > 5 ? '#10b981' : roomLeft > 0 ? '#f59e0b' : '#ef4444';
    const roomAvailabilityBg = roomLeft > 5 ? 'rgba(16, 185, 129, 0.1)' : roomLeft > 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)';
    const roomAvailabilityPill = roomLeft > 0 
      ? `<span class="data-pill" style="background: ${roomAvailabilityBg}; color: ${roomAvailabilityColor}; border: 1px solid ${roomAvailabilityColor}33;"><i class="ph ph-door"></i> ${roomLeft} Room${roomLeft !== 1 ? 's' : ''} Left</span>`
      : `<span class="data-pill pill-danger"><i class="ph ph-warning-circle"></i> No Rooms Available</span>`;

    card.innerHTML = `
        <div class="room-details-section">
        <div class="room-title" style="flex-direction: column; align-items: flex-start; gap: 8px;">
          ${roomNames}
        </div>
        <div style="margin-top: 12px; margin-bottom: 8px;">
          <span class="hotel-id-badge" style="font-size: 0.75rem;"><i class="ph ph-hash"></i> ${option.optionId}</span>
        </div>
        <div class="hotel-tags">
          <span class="data-pill pill-warning" ${optionTypeTitle}><i class="ph ph-tag"></i> ${optionTypeData.name}</span>
          <span class="data-pill pill-primary"><i class="ph ph-fork-knife"></i> ${mealBasis}</span>
          ${refundPill}
          ${roomAvailabilityPill}
          <span class="data-pill pill-neutral"><i class="ph ph-coins"></i> Currency: ${currency}</span>
          <span class="data-pill pill-neutral">GST: ${gstType}</span>
          <span class="data-pill pill-neutral">PAN Req: ${panRequired}</span>
          <span class="data-pill pill-neutral">PassPort Required: ${passRequired}</span>
          <span class="data-pill pill-purple"><i class="ph ph-receipt"></i> Type: ${commercialType} (${currency} ${commission})</span>
        </div>
        ${penaltiesHtml}
      </div>

        <div class="hotel-price-row">
          <div class="price-breakdown">
            <div class="price-item">
              <span class="price-label">Base</span>
              <span class="price-value">${currency} ${basePrice}</span>
            </div>
            <div class="price-item">
              <span class="price-label">Taxes</span>
              <span class="price-value">+ ${currency} ${taxes}</span>
            </div>
            <div class="price-item">
              <span class="price-label">Discount</span>
              <span class="price-value" style="color:var(--success-text)">- ${currency} ${discount}</span>
            </div>
            <div class="price-item">
              <span class="price-label">MF</span>
              <span class="price-value">+ ${currency} ${mf}</span>
            </div>
            <div class="price-item">
              <span class="price-label">MFT</span>
              <span class="price-value">+ ${currency} ${mft}</span>
            </div>
            <div class="price-item">
              <span class="price-label">Total</span>
              <span class="price-total">${currency} ${totalPrice}</span>
            </div>
            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 0.8rem; color: #64748b; font-style: italic;">
              ${amountToWords(parseFloat(totalPrice), currency)}
            </div>
          </div>

          <button class="btn-premium" onclick="reviewRoom('${option.optionId}', '${data.correlationId}', ${option.pricing?.totalPrice ?? 0}, '${reviewHash}', '${hotel.hotelId}')">
            <i class="ph ph-lock-key"></i> Review & Lock
          </button>
        </div>
      `;

    resultsContainer.appendChild(card);
  });
}

function applyRoomFilters() {
  const searchTerm = document.getElementById("filter-room-name").value.toLowerCase();
  const mealFilter = document.getElementById("filter-meal").value.toLowerCase();
  const gstFilter = document.getElementById("filter-gst").value.toLowerCase();
  const refundFilter = document.getElementById("filter-refund").value;
  const panFilter = document.getElementById("filter-pan").value;
  const passportFilter = document.getElementById("filter-passport").value;
  const priceSort = document.getElementById("filter-price").value;

  const resultsContainer = document.getElementById("detail-results");
  
  // Store cards BEFORE clearing
  let cards = Array.from(document.querySelectorAll(".detail-option-card"));
  
  // Show loading state
  resultsContainer.innerHTML = `
    <div style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; gap: 16px;">
      <div class="loader" style="border-color: var(--primary); border-top-color: transparent; width: 40px; height: 40px;"></div>
      <div style="text-align: center;">
        <p style="font-size: 1rem; font-weight: 600; color: var(--text-main); margin-bottom: 4px;">Applying Filter...</p>
        <p style="font-size: 0.9rem; color: var(--text-muted);">Please wait while we sort and filter your options</p>
      </div>
    </div>
  `;

  // Use setTimeout to allow UI to update before processing
  setTimeout(() => {
    if (priceSort === "low_to_high") {
      cards.sort((a, b) => parseFloat(a.dataset.price) - parseFloat(b.dataset.price));
    } else if (priceSort === "high_to_low") {
      cards.sort((a, b) => parseFloat(b.dataset.price) - parseFloat(a.dataset.price));
    } else {
      cards.sort((a, b) => parseInt(a.dataset.originalIndex) - parseInt(b.dataset.originalIndex));
    }

    // Clear container and re-add sorted cards
    resultsContainer.innerHTML = '';
    cards.forEach(card => resultsContainer.appendChild(card));

    let visibleCount = 0;

    cards.forEach(card => {
      const ds = card.dataset;
      let isMatch = true;

      // Search input (Name, OptionID, or RoomID)
      if (searchTerm) {
        if (!ds.roomName.includes(searchTerm) && !ds.optionId.includes(searchTerm) && !ds.roomId.includes(searchTerm)) {
          isMatch = false;
        }
      }
      // Dropdowns
      if (mealFilter && ds.meal !== mealFilter) isMatch = false;
      if (gstFilter && ds.gst !== gstFilter) isMatch = false;
      if (refundFilter && ds.refundable !== refundFilter) isMatch = false;
      if (panFilter && ds.pan !== panFilter) isMatch = false;
      if (passportFilter && ds.passport !== passportFilter) isMatch = false;

      if (isMatch) {
        card.style.display = "flex";
        card.classList.add("fade-in");
        visibleCount++;
      } else {
        card.style.display = "none";
        card.classList.remove("fade-in");
      }
    });

    const countSpan = document.getElementById("detail-room-count");
    if (countSpan) {
      countSpan.textContent = `(${visibleCount} Visible / ${cards.length} Total)`;
    }

  // Handle empty block
  let existingEmpty = document.getElementById("d-filter-empty");
  if (visibleCount === 0) {
    if (!existingEmpty) {
      const emptyState = document.createElement("div");
      emptyState.id = "d-filter-empty";
      emptyState.className = "empty-state";
      emptyState.style.width = "100%";
      emptyState.innerHTML = `<i class="ph ph-funnel-x" style="font-size:3rem; color: #cbd5e1; margin-bottom:12px;"></i> <p>Sorry, no room options available for this filter constraint. Please try another combination.</p>`;
      resultsContainer.appendChild(emptyState);
    }
  } else if (existingEmpty) {
    existingEmpty.remove();
  }
  }, 300); // Small delay to show loading state
}

async function reviewRoom(optionId, correlationId, searchDisplayPrice, reviewHash, hotelId) {
  // Store the price shown in search results for comparison
  window._searchDisplayPrice = searchDisplayPrice ?? null;

  // Update URL with full context for refresh support
  const params = new URLSearchParams();
  params.set('hid', hotelId);
  params.set('oid', optionId);
  params.set('cid', correlationId);
  if (reviewHash) params.set('rh', reviewHash);
  if (searchDisplayPrice) params.set('sdp', searchDisplayPrice);

  const newUrl = `/ui/review?${params.toString()}`;
  if (window.location.search !== `?${params.toString()}`) {
    history.pushState({ view: 'review' }, '', newUrl);
  }

  try {
    const config = getConfigPayload();
    const currency = globalSearchBody?.currency || "INR";
    const body = { optionId, correlationId, reviewHash, hotelId, currency, env: config.env, apiKey: config.apiKey };

    // Switch UI to review page with loading state
    switchToReviewPage();

    const t0 = performance.now();
    const res = await fetch(`${API_BASE}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const responseMs = Math.round(performance.now() - t0);

    const data = await res.json();
    if (!res.ok || data.ok === false) {
      renderReviewError(data.reason || "Review failed. Please check API configuration or response.", data);
      return;
    }

    // Record API response time
    recordApiTime('review', responseMs);

    // Display search info
    const reviewSearchInfo = document.getElementById("review-search-info");
    if (reviewSearchInfo) {
      const searchInfo = formatSearchInfo();
      if (searchInfo) {
        reviewSearchInfo.querySelector('span').textContent = searchInfo;
      }
    }

    renderReviewDetails(data, responseMs);
  } catch (err) {
    renderReviewError("Unexpected error while reviewing room.", err.message);
  }
}

function switchToReviewPage() {
  const reviewPage = document.getElementById("review-page");
  const reviewContent = document.getElementById("review-content");

  hideAllPages();
  if (reviewPage) {
    reviewPage.classList.remove("hidden");
    reviewPage.classList.add("fade-in");
  }

  if (reviewContent) {
    reviewContent.innerHTML = `
        <div class="empty-state">
          <div class="loader" style="margin-bottom: 16px; border-color: var(--primary); border-top-color: transparent; width: 30px; height: 30px;"></div>
          <p>Fetching review details and current pricing...</p>
        </div>
     `;
  }
}

function backToDetailFromReview() {
  const reviewPage = document.getElementById("review-page");
  const detailPage = document.getElementById("detail-page");

  if (reviewPage) {
    reviewPage.classList.remove("fade-in");
    reviewPage.classList.add("hidden");
  }
  if (detailPage) {
    detailPage.classList.remove("hidden");
    detailPage.classList.add("fade-in");
  }

  // Back to Detail URL - try to keep the hid if we have it
  const params = new URLSearchParams(window.location.search);
  const hid = params.get('hid');
  const newUrl = hid ? `/ui/detail?hid=${hid}` : '/ui/detail';

  if (window.location.pathname !== '/ui/detail') {
    history.pushState({ view: 'detail', hid }, '', newUrl);
  }
}

function showBookingDetailPage() {
  hideAllPages();
  const el = document.getElementById("booking-detail-page");
  if (el) {
    el.classList.remove("hidden");
    el.classList.add("fade-in");
  }
  if (window.location.pathname !== '/ui/booking-detail') {
    history.pushState({ view: 'booking-detail' }, '', '/ui/booking-detail');
  }
}

function backToReviewFromBookingDetail() {
  hideAllPages();
  const reviewPage = document.getElementById("review-page");
  if (reviewPage) {
    reviewPage.classList.remove("hidden");
    reviewPage.classList.add("fade-in");
  }
  if (window.location.pathname !== '/ui/review') {
    history.pushState({ view: 'review' }, '', '/ui/review');
  }
}

function renderReviewError(message, rawError) {
  const content = document.getElementById("review-content");
  if (!content) return;

  const rawHtml = rawError ? `<pre style="margin-top:12px; font-size: 0.75rem; background: rgba(0,0,0,0.05); padding: 8px; border-radius: 4px; overflow-x: auto; max-height: 200px;">${JSON.stringify(rawError, null, 2)}</pre>` : "";

  content.innerHTML = `
    <div class="alert-box error fade-in" style="flex-direction: column; align-items: flex-start;">
      <div style="display:flex; gap:8px; align-items:center;">
        <i class="ph ph-warning-circle" style="font-size: 1.2rem;"></i>
        <span class="message" style="font-weight: 600;">${message}</span>
      </div>
      ${rawHtml}
    </div>
  `;
}

function renderReviewDetails(data, responseMs) {
  const container = document.getElementById("review-content");
  if (!container) return;

  const { hotelId, hotelName, bookingId, option, correlationId } = data;

  if (!option) {
    renderReviewError("Invalid response format: Missing options block", data);
    return;
  }

  // Store for guard checks in bookRoom
  window._lastReviewData = data;

  // Timing badge
  const timeSec = responseMs ? (responseMs / 1000).toFixed(2) : null;
  const timingBadge = timeSec
    ? `<div style="display:inline-flex; align-items:center; gap:6px; font-size:0.78rem; color:var(--text-muted); background:rgba(0,0,0,0.04); border:1px solid #e2e8f0; border-radius:999px; padding:3px 10px; margin-bottom:14px;">
         <i class="ph ph-clock"></i> API responded in <strong style="color:var(--text-dark);">${timeSec}s</strong> (${responseMs}ms)
       </div>`
    : '';

  const roomNames = option.roomInfo?.map(r => `<i class="ph ph-bed"></i> ${r.name} <span style="font-size:0.75rem;color:var(--text-muted);">(ID: ${r.id})</span>`).join("<br>") ?? '<i class="ph ph-bed"></i> Standard Room';
  const currency = option.pricing?.currency ?? "INR";
  const totalPrice = (option.pricing?.totalPrice ?? 0).toFixed(2);
  const basePrice = (option.pricing?.basePrice ?? 0).toFixed(2);
  const taxes = (option.pricing?.taxes ?? 0).toFixed(2);
  const discount = (option.pricing?.discount ?? 0).toFixed(2);
  const mf = (option.pricing?.mf ?? 0).toFixed(2);
  const mft = (option.pricing?.mft ?? 0).toFixed(2);
  const isRefundable = option.cancellation?.isRefundable;
  const priceChangedBadge = data.priceChanged
    ? `<span class="data-pill pill-warning" style="font-size:0.8rem;"><i class="ph ph-warning"></i> Price Changed</span>`
    : `<span class="data-pill pill-success" style="font-size:0.8rem;"><i class="ph ph-check-circle"></i> Price Confirmed</span>`;

  const refundPill = isRefundable
    ? `<span class="data-pill pill-success"><i class="ph ph-check-circle"></i> Refundable</span>`
    : `<span class="data-pill pill-danger"><i class="ph ph-warning-circle"></i> Non-Refundable</span>`;

  const optionTypeMap = {
    SINGLE: { code: 'SINGLE', name: 'Single Option', desc: 'Standard single selection option.' },
    SRSM: { code: 'SRSM', name: 'Same Room Same Mealplan', desc: 'All rooms are the same type with the same meal plan.' },
    SRCM: { code: 'SRCM', name: 'Same Room Cross Mealplan', desc: 'All rooms are the same type but meal plans differ.' },
    CRSM: { code: 'CRSM', name: 'Cross Room Same Mealplan', desc: 'Rooms differ in type but all share the same meal plan.' },
    CRCM: { code: 'CRCM', name: 'Cross Room Cross Mealplan', desc: 'Rooms differ in type and meal plan varies per room.' },
  };
  const optType = option.optionType || 'SINGLE';
  const optInfo = optionTypeMap[optType] || { code: optType, name: optType, desc: 'Option type information.' };
  const optionTypeHtml = `
    <div style="margin-top:12px; background:rgba(99,102,241,0.05); border:1px solid rgba(99,102,241,0.2); border-radius:var(--radius-sm); padding:10px 14px; font-size:0.85rem;">
      <div style="display:flex; align-items:center; gap:8px; font-weight:600; color:#4338ca;">
        <i class="ph ph-stack"></i>
        <span>${optInfo.code}</span>
        <span style="font-weight:400; color:var(--text-muted);">— ${optInfo.name}</span>
      </div>
      <div style="margin-top:4px; color:var(--text-muted);">${optInfo.desc}</div>
    </div>
  `;

  const panReqHtml = option.compliance?.panRequired
    ? `<span class="data-pill pill-warning"><i class="ph ph-identification-card"></i> PAN Required</span>`
    : `<span class="data-pill pill-neutral" style="opacity:0.6;"><i class="ph ph-identification-card"></i> PAN Not Required</span>`;
  const passReqHtml = option.compliance?.passportRequired
    ? `<span class="data-pill pill-warning"><i class="ph ph-passport"></i> Passport Required</span>`
    : `<span class="data-pill pill-neutral" style="opacity:0.6;"><i class="ph ph-passport"></i> Passport Not Required</span>`;

  let penaltiesHtml = "";
  if (option.cancellation?.penalties?.length > 0) {
    const penaltyRows = option.cancellation.penalties.map(p => {
      const fromDate = p.from ? new Date(p.from).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "—";
      const toDate = p.to ? new Date(p.to).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "—";
      const penaltyAmount = p.amount ? `${currency} ${p.amount.toFixed(2)}` : "—";
      const borderColor = isRefundable ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)';
      return `<tr style="border-bottom:1px solid ${borderColor};">
        <td style="padding:10px 12px; font-size:0.85rem; color:${isRefundable ? '#166534' : '#7f1d1d'};">${fromDate}</td>
        <td style="padding:10px 12px; font-size:0.85rem; color:${isRefundable ? '#166534' : '#7f1d1d'};">${toDate}</td>
        <td style="padding:10px 12px; text-align:center; font-size:0.85rem; font-weight:700; color:${isRefundable ? '#16a34a' : '#dc2626'};">${penaltyAmount}</td>
      </tr>`;
    }).join("");

    const bgColor = isRefundable ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)';
    const borderColor = isRefundable ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)';
    const headerBg = isRefundable ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';
    const headerBorder = isRefundable ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)';
    const headerColor = isRefundable ? '#166534' : '#991b1b';
    const title = isRefundable ? 'Refundable - Cancellation Policy' : 'Non-Refundable - Cancellation Policy';

    penaltiesHtml = `
      <div style="margin-top:16px; background:${bgColor}; border:1px solid ${borderColor}; border-radius:var(--radius-sm); padding:16px; overflow-x:auto;">
        <div style="font-size:0.9rem; font-weight:600; color:${headerColor}; margin-bottom:10px; text-transform:uppercase; letter-spacing:0.5px;">${title}</div>
        <table style="width:100%; border-collapse:collapse;">
          <thead>
            <tr style="background:${headerBg}; border-bottom:1px solid ${headerBorder};">
              <th style="padding:10px 12px; text-align:left; font-weight:600; color:${headerColor}; font-size:0.75rem; text-transform:uppercase;">From Date</th>
              <th style="padding:10px 12px; text-align:left; font-weight:600; color:${headerColor}; font-size:0.75rem; text-transform:uppercase;">To Date</th>
              <th style="padding:10px 12px; text-align:center; font-weight:600; color:${headerColor}; font-size:0.75rem; text-transform:uppercase;">Penalty Amount</th>
            </tr>
          </thead>
          <tbody>
            ${penaltyRows}
          </tbody>
        </table>
      </div>`;
  } else if (isRefundable) {
    penaltiesHtml = `
      <div style="margin-top:16px; background:rgba(34, 197, 94, 0.05); border:1px solid rgba(34, 197, 94, 0.2); border-radius:var(--radius-sm); padding:16px;">
        <div style="font-size:0.9rem; font-weight:600; color:#166534; margin-bottom:4px;">Fully Refundable</div>
        <div style="font-size:0.85rem; color: #166534;">Free cancellation. No penalties listed.</div>
      </div>`;
  }

  // Room Left Info
  const roomLeftHtml = option.roomLeft !== undefined
    ? `<div style="margin-top: 12px; font-size: 0.9rem; color: #b45309; display: flex; align-items: center; gap: 6px;">
         <i class="ph ph-fire"></i> <strong>Only ${option.roomLeft} room(s) left on our site</strong>
       </div>`
    : '';

  // Commercial / Commission Info
  const commissionAmt = option.commercial?.commission ? option.commercial.commission.toFixed(2) : "0.00";
  const commercialHtml = `
    <div style="margin-top: 16px; font-size: 0.85rem; color: var(--text-muted); display: flex; flex-direction: column; gap: 4px;">
       <div style="display: flex; align-items: center; gap: 6px;"><i class="ph ph-receipt"></i> <strong>Commercial:</strong> ${option.commercial?.type || "Net"}</div>
       <div style="display: flex; align-items: center; gap: 6px;"><i class="ph ph-percent"></i> <strong>Commission:</strong> ${currency} ${commissionAmt}</div>
    </div>
  `;

  // Additional Compliance Info
  const panReq = option.compliance?.panRequired ? `<span class="data-pill pill-warning"><i class="ph ph-identification-card"></i> PAN Required</span>` : '';
  const passReq = option.compliance?.passportRequired ? `<span class="data-pill pill-warning"><i class="ph ph-passport"></i> Passport Required</span>` : '';

  // Check if price changed
  let priceAlert = "";
  if (data.priceChanged) {
    const oldPrice = window._searchDisplayPrice;
    const newPrice = option.pricing?.totalPrice;
    const pCur = currency;
    if (oldPrice != null && newPrice != null && Math.abs(oldPrice - newPrice) > 0.01) {
      const diff = newPrice - oldPrice;
      const diffStr = (diff > 0 ? '+' : '') + pCur + ' ' + diff.toFixed(2);
      const diffColor = diff > 0 ? '#dc2626' : '#16a34a';
      priceAlert = `
        <div style="background:linear-gradient(135deg,#fef3c7,#fff7ed); border:1.5px solid #f59e0b; border-radius:12px; padding:16px 20px; margin-bottom:20px; display:flex; align-items:center; gap:16px; flex-wrap:wrap;">
          <div style="font-size:1.8rem;"><i class="ph ph-warning-circle" style="color:#d97706;"></i></div>
          <div style="flex:1; min-width:200px;">
            <div style="font-weight:700; color:#92400e; font-size:0.95rem; margin-bottom:6px;">⚠️ Price Has Changed Since Your Search</div>
            <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
              <div style="text-decoration:line-through; color:#9ca3af; font-size:0.9rem;">Was: ${pCur} ${oldPrice.toFixed(2)}</div>
              <div style="color:#374151; font-size:0.9rem;">→</div>
              <div style="font-weight:700; color:#1f2937; font-size:1rem;">Now: ${pCur} ${newPrice.toFixed(2)}</div>
              <div style="font-weight:700; color:${diffColor}; font-size:0.9rem;">(${diffStr})</div>
            </div>
          </div>
        </div>`;
    } else {
      priceAlert = `
        <div style="background:linear-gradient(135deg,#fef3c7,#fff7ed); border:1.5px solid #f59e0b; border-radius:12px; padding:14px 20px; margin-bottom:20px; display:flex; align-items:center; gap:12px;">
          <i class="ph ph-warning" style="font-size:1.4rem; color:#d97706;"></i>
          <span style="font-weight:600; color:#92400e;">Price and/or availability has changed since your search. Please review the updated price below.</span>
        </div>`;
    }
  }

  // Stay Details (Dates, Nights, Rooms)
  let stayNights = 0;
  if (globalSearchBody?.checkIn && globalSearchBody?.checkOut) {
    const start = new Date(globalSearchBody.checkIn);
    const end = new Date(globalSearchBody.checkOut);
    stayNights = Math.round((end - start) / (1000 * 60 * 60 * 24));
  }
  const roomCount = globalSearchBody?.rooms?.length || 0;

  const stayDetailsHtml = `
    <div style="background: rgba(248, 250, 252, 0.8); border: 1px solid #e2e8f0; border-radius: var(--radius-md); padding: 16px; margin-top: 16px;">
       <h4 style="margin-top: 0; margin-bottom: 12px; font-size: 1.1rem; color: var(--text-dark); display:flex; align-items:center; gap:8px;">
         <i class="ph ph-calendar-check"></i> Stay Details
       </h4>
       <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
         <div style="display: flex; flex-direction: column; gap: 4px;">
           <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Check-in</span>
           <span style="font-weight: 700; color: var(--text-main);">${globalSearchBody?.checkIn || 'N/A'}</span>
         </div>
         <div style="display: flex; flex-direction: column; gap: 4px;">
           <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Check-out</span>
           <span style="font-weight: 700; color: var(--text-main);">${globalSearchBody?.checkOut || 'N/A'}</span>
         </div>
         <div style="display: flex; flex-direction: column; gap: 4px;">
           <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Stay Duration</span>
           <span style="font-weight: 700; color: var(--text-main);">${stayNights} Night(s)</span>
         </div>
         <div style="display: flex; flex-direction: column; gap: 4px;">
           <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Rooms</span>
           <span style="font-weight: 700; color: var(--text-main);">${roomCount} Room(s)</span>
         </div>
       </div>
    </div>
  `;

  container.innerHTML = `
    ${timingBadge}
    ${priceAlert}
    
    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 24px;">
      
      <!-- Left Column: Hotel & Room Info -->
      <div style="flex: 1; min-width: 300px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
           <div class="logo-circle" style="width: 48px; height: 48px; font-size: 1.2rem; background: var(--primary); color: white;"><i class="ph ph-buildings"></i></div>
           <div>
             <h3 style="margin: 0; font-size: 1.4rem; color: var(--text-main);">${hotelName || 'Selected Hotel'}</h3>
             <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px; display:flex; gap: 12px; flex-wrap: wrap;">
               <span><i class="ph ph-hash"></i> Hotel ID: <strong>${hotelId || 'N/A'}</strong></span>
               <span><i class="ph ph-briefcase"></i> Booking ID: <strong style="color:var(--primary);">${bookingId || 'N/A'}</strong></span>
               ${data.reviewHash ? `<span><i class="ph ph-fingerprint"></i> Review Hash: <strong style="font-family: monospace;">${data.reviewHash}</strong></span>` : ''}
             </div>
           </div>
        </div>

        ${stayDetailsHtml}

        <div style="background: rgba(248, 250, 252, 0.8); border: 1px solid #e2e8f0; border-radius: var(--radius-md); padding: 16px; margin-top: 20px;">
           <h4 style="margin-top: 0; margin-bottom: 12px; font-size: 1.1rem; color: var(--text-dark); display:flex; align-items:center; justify-content:space-between;">
             <span><i class="ph ph-bed"></i> Room Selection</span>
             <span class="hotel-id-badge" style="font-size: 0.75rem;"><i class="ph ph-hash"></i> Opt: ${option.optionId}</span>
           </h4>
           <div style="font-weight: 500; color: var(--text-main); line-height: 1.6;">${roomNames}</div>
           
           ${roomLeftHtml}

           <div class="hotel-tags" style="margin-top: 16px;">
             ${refundPill}
             <span class="data-pill pill-primary"><i class="ph ph-fork-knife"></i> ${option.mealBasis || 'Room Only'}</span>
             <span class="data-pill pill-neutral"><i class="ph ph-tag"></i> GST: ${option.compliance?.gstType || 'NA'}</span>
               ${panReqHtml}
               ${passReqHtml}
           </div>

           ${optionTypeHtml}
           
           ${commercialHtml}
        </div>

        ${penaltiesHtml}


        <!-- Traveller Info Form — Premium -->
        <div id="traveller-form-section" style="margin-top:24px; border-radius:16px; overflow:hidden; box-shadow:0 2px 16px rgba(99,102,241,0.08); border:1px solid rgba(99,102,241,0.15);">
          <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed); padding:16px 20px; display:flex; align-items:center; gap:10px;">
            <i class="ph ph-users-three" style="font-size:1.3rem; color:white;"></i>
            <div>
              <div style="font-weight:700; color:white; font-size:1rem;">Traveller Details</div>
              <div style="font-size:0.75rem; color:rgba(255,255,255,0.7); margin-top:2px;">Fill in name for each guest. PAN &amp; Passport are optional.</div>
            </div>
          </div>
          <div id="traveller-rows" style="padding:18px; background:white; display:flex; flex-direction:column; gap:14px;">
            ${buildTravellerFormRows(globalSearchBody)}
          </div>
        </div>

        <!-- Delivery Info Form — Premium -->
        <div style="margin-top:16px; border-radius:16px; overflow:hidden; box-shadow:0 2px 16px rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.2);">
          <div style="background:linear-gradient(135deg,#059669,#0d9488); padding:16px 20px; display:flex; align-items:center; gap:10px;">
            <i class="ph ph-paper-plane-tilt" style="font-size:1.3rem; color:white;"></i>
            <div>
              <div style="font-weight:700; color:white; font-size:1rem;">Delivery Info</div>
              <div style="font-size:0.75rem; color:rgba(255,255,255,0.7); margin-top:2px;">Booking confirmation will be sent here.</div>
            </div>
          </div>
          <div style="padding:18px; background:white; display:flex; flex-direction:column; gap:14px;">
            <div style="display:flex; gap:10px;">
              <div style="flex:0 0 82px;">
                <label style="display:block; font-size:0.75rem; font-weight:600; color:#6b7280; margin-bottom:5px; text-transform:uppercase; letter-spacing:0.5px;">Code</label>
                <input id="delivery-code" type="text" value="+91" style="width:100%; padding:10px 10px; border:1.5px solid #e5e7eb; border-radius:10px; font-size:0.9rem; background:#f9fafb; transition:border-color 0.2s;" onfocus="this.style.borderColor='#4f46e5';this.style.background='white'" onblur="this.style.borderColor='#e5e7eb';this.style.background='#f9fafb'" />
              </div>
              <div style="flex:1;">
                <label style="display:block; font-size:0.75rem; font-weight:600; color:#6b7280; margin-bottom:5px; text-transform:uppercase; letter-spacing:0.5px;">Mobile Number</label>
                <input id="delivery-phone" type="tel" placeholder="9876543210" style="width:100%; padding:10px 14px; border:1.5px solid #e5e7eb; border-radius:10px; font-size:0.9rem; background:#f9fafb; transition:border-color 0.2s;" onfocus="this.style.borderColor='#4f46e5';this.style.background='white'" onblur="this.style.borderColor='#e5e7eb';this.style.background='#f9fafb'" />
              </div>
            </div>
            <div>
              <label style="display:block; font-size:0.75rem; font-weight:600; color:#6b7280; margin-bottom:5px; text-transform:uppercase; letter-spacing:0.5px;">Email Address</label>
              <input id="delivery-email" type="email" placeholder="traveller@example.com" style="width:100%; padding:10px 14px; border:1.5px solid #e5e7eb; border-radius:10px; font-size:0.9rem; background:#f9fafb; transition:border-color 0.2s;" onfocus="this.style.borderColor='#059669';this.style.background='white'" onblur="this.style.borderColor='#e5e7eb';this.style.background='#f9fafb'" />
            </div>
          </div>
        </div>

      </div>

      <!-- Right Column: Price & Action -->
      <div style="flex: 0 0 320px; background: white; border: 1px solid #e2e8f0; border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); overflow: hidden;">
        <div style="background: var(--bg-secondary); border-bottom: 1px solid #e2e8f0; padding: 16px 20px;">
           <h4 style="margin: 0; display:flex; justify-content:space-between; align-items:center; font-size: 1rem; color: var(--text-main);">
             Price Summary
             <span style="display:flex;gap:6px;align-items:center;">
               <span class="data-pill pill-neutral" style="font-size: 0.75rem;"><i class="ph ph-coins"></i> ${currency}</span>
               ${priceChangedBadge}
             </span>
           </h4>
        </div>
        
        <div style="padding: 20px;">
          <div style="display:flex; justify-content:space-between; margin-bottom: 10px; color: var(--text-muted); font-size:0.9rem;">
            <span>Base Price</span>
            <span style="font-weight: 500; color: var(--text-main);">${currency} ${basePrice}</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom: 10px; color: var(--text-muted); font-size:0.9rem;">
            <span>Taxes &amp; Fees</span>
            <span style="font-weight: 500; color: var(--text-main);">${currency} ${taxes}</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom: 10px; color: var(--text-muted); font-size:0.9rem;">
            <span>Discount</span>
            <span style="font-weight: 500; color: #16a34a;">- ${currency} ${discount}</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom: 10px; color: var(--text-muted); font-size:0.9rem;">
            <span>Markup Fee (MF)</span>
            <span style="font-weight: 500; color: var(--text-main);">${currency} ${mf}</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom: 10px; color: var(--text-muted); font-size:0.9rem;">
            <span>Markup Fee Tax (MFT)</span>
            <span style="font-weight: 500; color: var(--text-main);">${currency} ${mft}</span>
          </div>
          
          <hr style="border: none; border-top: 1px dashed #cbd5e1; margin: 16px 0;" />
          
          <div style="display:flex; justify-content:space-between; align-items: center; margin-bottom: 12px;">
            <span style="font-size: 1.1rem; font-weight: 600; color: var(--text-dark);">Total Price</span>
            <span style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">${currency} ${totalPrice}</span>
          </div>
          
          <div style="padding: 10px 12px; background: #f8fafc; border-left: 3px solid var(--primary); border-radius: 4px; font-size: 0.85rem; color: #64748b; font-style: italic; margin-bottom: 16px;">
            ${amountToWords(parseFloat(totalPrice), currency)}
          </div>

          <!-- Two booking action buttons -->
          <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:8px;">
            <button class="btn-primary btn-large" style="width:100%;display:flex;justify-content:center;align-items:center;gap:8px;" onclick="submitBooking('VOUCHER','${bookingId}','${correlationId}',${option.pricing?.totalPrice ?? 0})">
              <i class="ph ph-credit-card"></i> Voucher Booking
            </button>
            <button class="btn-secondary btn-large" style="width:100%;display:flex;justify-content:center;align-items:center;gap:8px;background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.3);color:#4338ca;" onclick="submitBooking('HOLD','${bookingId}','${correlationId}',null)">
              <i class="ph ph-clock-countdown"></i> Hold Booking
            </button>
          </div>
          <div style="font-size:0.75rem;color:var(--text-muted);text-align:center;margin-bottom:16px;">
            <i class="ph ph-info"></i> Voucher confirms &amp; pays · Hold reserves without payment
          </div>
          
          <!-- Booking Status Container inside Review -->
          <div id="booking" class="empty" style="margin-top: 8px; padding-top: 16px; border-top: 1px solid #e2e8f0;"></div>
        </div>
      </div>
    
    </div>
  `;
}

/* =========================================
   Traveller Form Builder
   ========================================= */
function buildTravellerFormRows(searchBody) {
  // globalSearchBody.rooms uses { adults, children, childAge } structure
  const rooms = searchBody?.rooms || [{ adults: 1 }];
  let rows = '';
  let tNum = 0;

  const inputStyle = "width:100%; padding:9px 12px; border:1.5px solid #e5e7eb; border-radius:10px; font-size:0.87rem; background:#f9fafb; outline:none; transition:border-color 0.2s, box-shadow 0.2s;";
  const titleStyle = "width:100%; padding:9px 8px; border:1.5px solid #e5e7eb; border-radius:10px; font-size:0.87rem; background:#f9fafb; outline:none; cursor:pointer;";
  const labelStyle = "display:block; font-size:0.7rem; font-weight:700; text-transform:uppercase; letter-spacing:0.6px; color:#9ca3af; margin-bottom:4px;";

  const renderTitleSelect = (id) => `
    <div><label style="${labelStyle}">Title</label>
      <select id="${id}" style="${titleStyle}">
        <option>Mr</option><option>Ms</option><option>Mrs</option><option>Miss</option><option>Master</option>
      </select></div>`;

  const renderInput = (id, placeholder, label) =>
    `<div><label style="${labelStyle}">${label}</label><input id="${id}" type="text" placeholder="${placeholder}" style="${inputStyle}" /></div>`;

  rooms.forEach((room, rIdx) => {
    const adults = room.adults || 1;
    const children = room.children || 0;
    const childAges = room.childAge || [];

    if (rooms.length > 1) {
      rows += `<div style="display:flex; align-items:center; gap:8px; margin:4px 0 2px;">
        <div style="flex:1; height:1px; background:linear-gradient(90deg,#e0e7ff,transparent);"></div>
        <span style="font-size:0.72rem; font-weight:700; color:#6366f1; text-transform:uppercase; letter-spacing:1px; background:#eef2ff; padding:3px 10px; border-radius:999px;"><i class="ph ph-door"></i> Room ${rIdx + 1}</span>
        <div style="flex:1; height:1px; background:linear-gradient(90deg,transparent,#e0e7ff);"></div>
      </div>`;
    }

    for (let i = 0; i < adults; i++) {
      tNum++;
      const labelText = rooms.length > 1 ? `Adult ${i + 1} · Room ${rIdx + 1}` : `Adult ${i + 1}`;
      rows += `
        <div class="traveller-row" data-room="${rIdx}" data-pax="ADULT"
             style="border:1.5px solid #e0e7ff; border-left:4px solid #6366f1; border-radius:12px; padding:14px; background:linear-gradient(135deg,#fafbff,#f0f4ff); display:flex; flex-direction:column; gap:10px; margin-bottom:12px;">
          <div style="font-size:0.78rem; font-weight:700; color:#6366f1; display:flex; align-items:center; gap:6px;">
            <i class="ph ph-person"></i> ${labelText}
          </div>
          <div style="display:grid; grid-template-columns:100px 1fr 1fr; gap:10px;">
            ${renderTitleSelect(`t-title-${tNum}`)}
            ${renderInput(`t-fn-${tNum}`, 'First Name', 'First Name *')}
            ${renderInput(`t-ln-${tNum}`, 'Last Name', 'Last Name *')}
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
            ${renderInput(`t-pan-${tNum}`, 'ABCDE1234F', 'PAN (optional)')}
            ${renderInput(`t-pass-${tNum}`, 'Passport No.', 'Passport (optional)')}
          </div>
        </div>`;
    }

    for (let i = 0; i < children; i++) {
      tNum++;
      const ageStr = childAges[i] ? ` · Age ${childAges[i]}` : '';
      const labelText = rooms.length > 1 ? `Child ${i + 1} · Room ${rIdx + 1}${ageStr}` : `Child ${i + 1}${ageStr}`;
      rows += `
        <div class="traveller-row" data-room="${rIdx}" data-pax="CHILD"
             style="border:1.5px solid #fde68a; border-left:4px solid #f59e0b; border-radius:12px; padding:14px; background:linear-gradient(135deg,#fffdf5,#fef9ee); display:flex; flex-direction:column; gap:10px; margin-bottom:12px;">
          <div style="font-size:0.78rem; font-weight:700; color:#d97706; display:flex; align-items:center; gap:6px;">
            <i class="ph ph-baby"></i> ${labelText}
          </div>
          <div style="display:grid; grid-template-columns:100px 1fr 1fr; gap:10px;">
            ${renderTitleSelect(`t-title-${tNum}`)}
            ${renderInput(`t-fn-${tNum}`, 'First Name', 'First Name *')}
            ${renderInput(`t-ln-${tNum}`, 'Last Name', 'Last Name *')}
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
            ${renderInput(`t-pan-${tNum}`, 'ABCDE1234F', 'PAN (optional)')}
            ${renderInput(`t-pass-${tNum}`, 'Passport No.', 'Passport (optional)')}
          </div>
        </div>`;
    }
  });

  return rows || `<div style="color:var(--text-muted); font-size:0.85rem; padding:8px;">No travellers detected from search. Please go back and search again.</div>`;
}

/* =========================================
   Submit Booking (Hold or Voucher)
   ========================================= */
async function submitBooking(bookingType, bookingId, correlationId, amount) {
  const bookingEl = document.getElementById("booking");

  // ── Guard 1: Refundability ────────────────────────────────────────────
  const reviewData = window._lastReviewData;
  const isRefundable = reviewData?.option?.cancellation?.isRefundable;
  if (isRefundable === false) {
    if (bookingEl) {
      bookingEl.classList.remove("empty");
      bookingEl.innerHTML = `
        <div class="alert-box error fade-in" style="flex-direction:column; align-items:flex-start;">
          <div style="display:flex; gap:8px; align-items:center; font-weight:600;">
            <i class="ph ph-shield-warning" style="font-size:1.3rem;"></i> Booking Blocked — Non-Refundable
          </div>
          <div style="margin-top:6px; font-size:0.9rem;">Non-refundable bookings are not permitted. Please select a refundable room option.</div>
        </div>`;
      bookingEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return;
  }

  // ── Guard 2: 3-month check-in minimum ────────────────────────────────
  const checkin = globalSearchBody?.checkIn;
  if (checkin) {
    const checkinDate = new Date(checkin);
    const minDate = new Date();
    minDate.setMonth(minDate.getMonth() + 3);
    if (checkinDate < minDate) {
      const minStr = minDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
      if (bookingEl) {
        bookingEl.classList.remove("empty");
        bookingEl.innerHTML = `
          <div class="alert-box error fade-in" style="flex-direction:column; align-items:flex-start;">
            <div style="display:flex; gap:8px; align-items:center; font-weight:600;">
              <i class="ph ph-calendar-x" style="font-size:1.3rem;"></i> Booking Blocked — Check-in Too Soon
            </div>
            <div style="margin-top:6px; font-size:0.9rem;">Earliest allowed check-in: <strong>${minStr}</strong>.</div>
          </div>`;
        bookingEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
  }

  // ── Collect traveller info from form ──────────────────────────────────
  const travellerRows = document.querySelectorAll(".traveller-row");
  const travellers = [];
  let tNum = 0;
  let hasError = false;

  travellerRows.forEach((row, idx) => {
    tNum = idx + 1;
    const roomIndex = parseInt(row.dataset.room || "0");
    const paxType = row.dataset.pax || "ADULT";
    const title = document.getElementById(`t-title-${tNum}`)?.value || "Mr";
    const fn = (document.getElementById(`t-fn-${tNum}`)?.value || "").trim();
    const ln = (document.getElementById(`t-ln-${tNum}`)?.value || "").trim();
    const pan = (document.getElementById(`t-pan-${tNum}`)?.value || "").trim();
    const passport = (document.getElementById(`t-pass-${tNum}`)?.value || "").trim();

    if (!fn || !ln) {
      hasError = true;
      document.getElementById(`t-fn-${tNum}`)?.style && (document.getElementById(`t-fn-${tNum}`).style.borderColor = "#ef4444");
      document.getElementById(`t-ln-${tNum}`)?.style && (document.getElementById(`t-ln-${tNum}`).style.borderColor = "#ef4444");
    }

    const t = { roomIndex, paxType, title, firstName: fn, lastName: ln };
    if (pan) t.pan = pan;
    if (passport) t.passportNumber = passport;
    travellers.push(t);
  });

  if (hasError) {
    if (bookingEl) {
      bookingEl.classList.remove("empty");
      bookingEl.innerHTML = `<div class="alert-box error fade-in"><i class="ph ph-warning"></i> <span>Please fill in all traveller First Name and Last Name fields.</span></div>`;
      bookingEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return;
  }

  // ── Collect delivery info ──────────────────────────────────────────────
  const email = (document.getElementById("delivery-email")?.value || "").trim();
  const phone = (document.getElementById("delivery-phone")?.value || "").trim();
  const code = (document.getElementById("delivery-code")?.value || "+91").trim();

  // ── Show loading ───────────────────────────────────────────────────────
  if (bookingEl) {
    bookingEl.classList.remove("empty");
    bookingEl.innerHTML = `
      <div class="empty-state fade-in">
        <div class="loader" style="margin-bottom:16px; border-color:var(--primary); border-top-color:transparent; width:30px; height:30px;"></div>
        <p>${bookingType === 'HOLD' ? 'Placing hold on booking...' : 'Confirming voucher booking...'}</p>
      </div>`;
    bookingEl.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  try {
    const config = getConfigPayload();
    const body = {
      bookingId,
      correlationId,
      bookingType,
      travellers,
      deliveryInfo: {
        emails: email ? [email] : [],
        contacts: phone ? [phone] : [],
        codes: code ? [code] : ["+91"],
      },
      env: config.env,
      apiKey: config.apiKey,
    };

    if (bookingType === 'VOUCHER' && amount !== null) {
      body.amount = amount;
    }

    const res = await fetch(`${API_BASE}/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const t0 = performance.now();
    const data = await res.json();
    const bookingResponseMs = Math.round(performance.now() - t0);
    if (!bookingEl) return;

    const typeLabel = bookingType === 'HOLD' ? 'Hold' : 'Voucher';
    const confirmedBookingId = data.order?.bookingId || data.bookingId;

    if (!res.ok || !confirmedBookingId || data.errors || data.status?.success === false) {
      let errorMsg = data.reason || data.message || "Check response";
      if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        errorMsg = data.errors[0].message || errorMsg;
      }
      bookingEl.innerHTML = `
        <div class="alert-box error fade-in">
          <i class="ph ph-warning-circle"></i>
          <span class="message">${typeLabel} booking failed: ${errorMsg}</span>
        </div>
        <pre style="margin-top:12px; font-size:0.78rem; background:#fdf2f2; padding:10px; border-radius:8px; overflow-x:auto;">${JSON.stringify(data, null, 2)}</pre>`;
      return;
    }

    // Record API response time
    recordApiTime('booking', bookingResponseMs);

    // ── Success! ─────────────────
    const isHold = bookingType === 'HOLD';
    saveRecentBooking(confirmedBookingId);

    bookingEl.innerHTML = `
      <div class="alert-box success fade-in" style="flex-direction:column; align-items:flex-start; margin-bottom: 16px;">
        <div style="display:flex; gap:8px; align-items:center;">
          <i class="ph ph-check-circle" style="font-size: 1.2rem;"></i>
          <span class="message" style="font-weight: 600;">${isHold ? 'Booking Placed on Hold!' : 'Booking Confirmed!'}</span>
        </div>
        <div style="margin-top:6px; font-size:0.9rem;">
          <a href="#" onclick="event.preventDefault(); window.history.pushState({ view: 'booking-detail' }, '', '/ui/booking-detail?id=${confirmedBookingId}'); showBookingDetailPage(); window.scrollTo({ top: 0, behavior: 'smooth' }); fetchAndRenderBookingDetail('${confirmedBookingId}');" style="color: var(--primary); font-weight: 600; text-decoration: underline; cursor: pointer;">
            Click here to view Booking Details for ID: ${confirmedBookingId}
          </a>
        </div>
      </div>
    `;

  } catch (err) {
    if (!bookingEl) return;
    bookingEl.innerHTML = `
      <div class="alert-box error fade-in">
        <i class="ph ph-warning"></i>
        <span class="message">Unexpected error while creating booking.</span>
      </div>`;
  }
}

/* =========================================
   Fetch & Render Full Booking Detail
   ========================================= */
async function fetchAndRenderBookingDetail(bookingId) {
  const bdLoading = document.getElementById("bd-loading");
  const bdError = document.getElementById("bd-error");
  const bdContent = document.getElementById("bd-content");
  const bookingSearchInfo = document.getElementById("booking-search-info");

  if (!bdLoading || !bdError || !bdContent) return;

  // reset view
  bdLoading.classList.remove("hidden");
  bdError.classList.add("hidden");
  bdContent.classList.add("hidden");

  try {
    const t0 = performance.now();
    const res = await fetch(`${API_BASE}/booking-detail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId }),
    });
    const bookingDetailMs = Math.round(performance.now() - t0);

    const d = await res.json();

    bdLoading.classList.add("hidden");

    if (!res.ok || d.ok === false) {
      bdError.innerHTML = `<div><i class="ph ph-warning"></i> <span>Failed to fetch booking details: ${d.message || d.reason || res.status}</span></div>`;
      bdError.classList.remove("hidden");
      return;
    }

    // Record API response time
    recordApiTime('bookingDetail', bookingDetailMs);

    // Display search info
    if (bookingSearchInfo) {
      const searchInfo = formatSearchInfo();
      if (searchInfo) {
        bookingSearchInfo.querySelector('span').textContent = searchInfo;
      }
    }

    const order = d.order || {};
    const hotelInfo = d.itemInfos?.HOTEL?.hInfo || {};
    const ops = hotelInfo.ops || [];
    const room = ops[0]?.ris?.[0] || {};
    const cnp = ops[0]?.cnp || {};
    const addr = hotelInfo.ad || {};

    // Basic Header
    document.getElementById("bd-booking-id").textContent = order.bookingId || bookingId;
    const statusBadge = document.getElementById("bd-status-badge");
    statusBadge.textContent = order.status || '—';
    if (order.status === 'ON_HOLD') {
      statusBadge.style.color = '#fdfdfdff'; statusBadge.style.backgroundColor = 'rgba(67,56,202,0.1)'; statusBadge.style.borderColor = 'rgba(67,56,202,0.2)';
    } else if (order.status === 'CANCELLED') {
      statusBadge.style.color = '#dc2626'; statusBadge.style.backgroundColor = 'rgba(220,38,38,0.1)'; statusBadge.style.borderColor = 'rgba(220,38,38,0.2)';
    } else {
      statusBadge.style.color = '#16a34a'; statusBadge.style.backgroundColor = 'rgba(22,163,74,0.1)'; statusBadge.style.borderColor = 'rgba(22,163,74,0.2)';
    }

    // Success Banner
    const isHold = order.status === 'ON_HOLD';
    document.getElementById("bd-success-banner").innerHTML = isHold ? `
      <div style="background: linear-gradient(135deg, #312e81 0%, #4338ca 100%); border-radius: 14px; padding: 20px 24px; color: #ffffffff; box-shadow: 0 4px 14px rgba(67,56,202,0.25);">
        <div style="display:flex; align-items:center; gap:16px;">
          <div style="font-size:1.8rem; flex-shrink:0;"><i class="ph-fill ph-clock-countdown"></i></div>
          <div>
            <div style="font-size:1.2rem; font-weight:700;">Booking On Hold!</div>
            <div style="opacity:0.8; font-size:0.9rem; margin-top:2px;">Your booking has been successfully placed on hold.</div>
          </div>
        </div>
      </div>
    ` : `
      <div style="background: linear-gradient(135deg, #14532d 0%, #16a34a 100%); border-radius: 14px; padding: 20px 24px; color: #fff; box-shadow: 0 4px 14px rgba(22,163,74,0.25);">
        <div style="display:flex; align-items:center; gap:16px;">
          <div style="font-size:1.8rem; flex-shrink:0;"><i class="ph-fill ph-check-circle"></i></div>
          <div>
            <div style="font-size:1.2rem; font-weight:700;">Voucher Confirmed!</div>
            <div style="opacity:0.8; font-size:0.9rem; margin-top:2px;">Congratulations! Your voucher booking was successfully created.</div>
          </div>
        </div>
      </div>
    `;

    // Helpers
    const fmtDate = (s) => s ? new Date(s).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
    const fmtAmt = (n) => n != null ? `INR ${parseFloat(n).toFixed(2)}` : '—';

    // Hotel & Room
    document.getElementById("bd-hotel-name").textContent = hotelInfo.name || '—';
    document.getElementById("bd-hotel-stars").textContent = '★'.repeat(Math.round(hotelInfo.rt || 0));
    document.getElementById("bd-hotel-address").innerHTML = `${addr.adr || ''}<br>${addr.ctn || ''}${addr.sn || ''} ${addr.cn || ''} ${addr.postalCode || ''}`;

    let checkinInfoHtml = '';
    if (hotelInfo.checkInTime) checkinInfoHtml += `<div><i class="ph ph-sign-in"></i> Check-in from <strong>${hotelInfo.checkInTime.beginTime}</strong></div>`;
    if (hotelInfo.checkOutTime) checkinInfoHtml += `<div><i class="ph ph-sign-out"></i> Check-out by <strong>${hotelInfo.checkOutTime.beginTime}</strong></div>`;
    document.getElementById("bd-checkin-info").innerHTML = checkinInfoHtml;

    document.getElementById("bd-room-name").textContent = room.rc || room.rt || '—';
    document.getElementById("bd-room-meal").textContent = room.mb || '';

    document.getElementById("bd-room-tags").innerHTML = `
      <span class="data-pill pill-neutral" style="font-size:0.72rem;"><i class="ph ph-user"></i> ${room.adt || 0} Adult${(room.adt || 0) !== 1 ? 's' : ''}</span>
      ${room.chd > 0 ? `<span class="data-pill pill-neutral" style="font-size:0.72rem;"><i class="ph ph-baby"></i> ${room.chd} Child</span>` : ''}
    `;

    // Payment Summary
    const totalAmount = parseFloat(order.amount);
    const amountInWords = amountToWords(totalAmount);
    
    document.getElementById("bd-payment-info").innerHTML = `
      <div style="display:flex; gap:32px; flex-wrap:wrap; align-items:flex-start;">
        <div>
          <div style="font-size:0.75rem; color:#64748b; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.5px;">Total Amount</div>
          <div style="font-size:1.25rem; font-weight:800; color:var(--primary); margin-bottom:6px;">${fmtAmt(order.amount)}</div>
          <div style="font-size:0.8rem; color:#64748b; font-style:italic; background:#f8fafc; padding:6px 10px; border-radius:6px; border-left:3px solid var(--primary);">
            ${amountInWords}
          </div>
        </div>
        ${order.markup ? `<div><div style="font-size:0.75rem; color:#64748b; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.5px;">Markup</div><div style="font-size:1rem; font-weight:600; color:#f59e0b;">${fmtAmt(order.markup)}</div></div>` : ''}
        <div><div style="font-size:0.75rem; color:#64748b; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.5px;">Created On</div><div style="font-size:0.9rem; font-weight:600; color:#334155;">${fmtDate(order.createdOn)}</div></div>
      </div>
    `;

    // Flags
    document.getElementById("bd-flags").innerHTML = `
      <span class="data-pill ${cnp.ifra ? 'pill-success' : 'pill-danger'}" style="font-size:0.72rem;">${cnp.ifra ? '✓ Refundable' : '✗ Non-refundable'}</span>
      ${cnp.panReq ? `<span class="data-pill pill-warning" style="font-size:0.72rem;">PAN Required</span>` : ''}
    `;

    // Travellers
    const travCont = document.getElementById("bd-travellers");
    const travHtml = (room.ti || []).map(t => `
      <div style="display:flex; align-items:center; gap:10px; padding:10px 14px; background:#fff; border:1px solid #e2e8f0; border-radius:10px; font-size:0.88rem;">
        <div style="background:#eff6ff; color:#3b82f6; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center;"><i class="ph-fill ph-user"></i></div>
        <div style="flex:1;"><strong style="color:#1e293b;">${t.ti} ${t.fN} ${t.lN}</strong></div>
        <span class="data-pill pill-neutral" style="font-size:0.75rem;">${t.pt}</span>
      </div>`).join('');

    if (travHtml) {
      travCont.innerHTML = travHtml;
      document.getElementById("bd-travellers-section").classList.remove("hidden");
    } else {
      document.getElementById("bd-travellers-section").classList.add("hidden");
    }

    // Delivery Info
    const deliveryCont = document.getElementById("bd-delivery");
    let delivHtml = '';
    if (order.deliveryInfo?.emails?.length) delivHtml += `<div><span style="color:#64748b;">Email: </span><strong style="color:#334155;">${order.deliveryInfo.emails.join(', ')}</strong></div>`;
    if (order.deliveryInfo?.contacts?.length) delivHtml += `<div><span style="color:#64748b;">Phone: </span><strong style="color:#334155;">${(order.deliveryInfo.code?.[0] || '+91')} ${order.deliveryInfo.contacts.join(', ')}</strong></div>`;

    if (delivHtml) {
      deliveryCont.innerHTML = delivHtml;
      document.getElementById("bd-delivery-section").classList.remove("hidden");
    } else {
      document.getElementById("bd-delivery-section").classList.add("hidden");
    }

    // Cancellation
    const cancCont = document.getElementById("bd-cancellation");
    if (cnp.pd?.length) {
      const isRefundable = cnp.isRefundable;
      const tableRows = cnp.pd.map(p => {
        const isFreeCancel = parseFloat(p.am) === 0;
        const penaltyColor = isRefundable ? '#16a34a' : '#ef4444';
        const penaltyBg = isRefundable ? '#ecfdf5' : '#fef2f2';
        const textColor = isRefundable ? '#166534' : '#7f1d1d';
        return `
          <tr style="border-bottom:1px solid ${isRefundable ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'};">
            <td style="padding:12px 14px; font-size:0.85rem; color:${textColor}; font-weight:500;">${fmtDate(p.fdt)}</td>
            <td style="padding:12px 14px; font-size:0.85rem; color:${textColor}; font-weight:500;">${fmtDate(p.tdt)}</td>
            <td style="padding:12px 14px; text-align:center;">
              <span style="background:${penaltyBg}; color:${penaltyColor}; padding:6px 12px; border-radius:6px; font-weight:700; font-size:0.85rem; display:inline-block;">
                ${isFreeCancel ? '✓ Free Cancel' : fmtAmt(p.am)}
              </span>
            </td>
          </tr>`;
      }).join('');
      
      const bgColor = isRefundable ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)';
      const borderColor = isRefundable ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)';
      const headerBg = isRefundable ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';
      const headerBorder = isRefundable ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)';
      const headerColor = isRefundable ? '#166534' : '#991b1b';
      const title = isRefundable ? 'Refundable - Cancellation Policy' : 'Non-Refundable - Cancellation Policy';
      
      cancCont.innerHTML = `
        <div style="background:${bgColor}; border:1px solid ${borderColor}; border-radius:8px; padding:16px; overflow-x:auto;">
          <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:${headerColor}; margin-bottom:12px;">${title}</div>
          <table style="width:100%; border-collapse:collapse; background:#fff; border-radius:8px; overflow:hidden;">
            <thead>
              <tr style="background:${headerBg}; border-bottom:2px solid ${headerBorder};">
                <th style="padding:12px 14px; text-align:left; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:${headerColor};">From Date</th>
                <th style="padding:12px 14px; text-align:left; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:${headerColor};">To Date</th>
                <th style="padding:12px 14px; text-align:center; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:${headerColor};">Penalty Amount</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>`;
      document.getElementById("bd-cancellation-section").classList.remove("hidden");
    } else {
      document.getElementById("bd-cancellation-section").classList.add("hidden");
    }

    // Instructions
    const instCont = document.getElementById("bd-instructions");
    let instHtml = '';
    if (hotelInfo.inst) {
      instHtml = hotelInfo.inst.map(desc => `<div style="font-size:0.85rem; color:#475569; padding-bottom:8px; border-bottom:1px solid #f1f5f9; line-height:1.5;"><strong>${desc.type || 'Instruction'}:</strong> ${desc.msg || ''}</div>`).join('');
    }
    if (instHtml) {
      instCont.innerHTML = instHtml;
      document.getElementById("bd-instructions-section").classList.remove("hidden");
    } else {
      document.getElementById("bd-instructions-section").classList.add("hidden");
    }

    // Amenities
    const amenitiesCont = document.getElementById("bd-amenities");
    const benefits = room.rexb?.BENEFIT?.[0]?.values || [];
    if (benefits.length) {
      amenitiesCont.innerHTML = benefits.map(b => `<span class="data-pill pill-neutral" style="background:#fff; border-color:#e2e8f0; font-size:0.8rem;"><i class="ph ph-check" style="color:#10b981;"></i> ${b}</span>`).join('');
      document.getElementById("bd-amenities-section").classList.remove("hidden");
    } else {
      document.getElementById("bd-amenities-section").classList.add("hidden");
    }

    // Show content
    bdContent.classList.remove("hidden");

  } catch (err) {
    bdLoading.classList.add("hidden");
    bdError.innerHTML = `<div><i class="ph ph-warning"></i> <span>Could not load booking details: ${err.message}</span></div>`;
    bdError.classList.remove("hidden");
  }
}



async function bookRoom(optionId, correlationId) {

  const bookingEl = document.getElementById("booking");

  // ── Guard 1: Refundability check ──────────────────────────────────────
  const reviewData = window._lastReviewData;
  const isRefundable = reviewData?.option?.cancellation?.isRefundable;
  if (isRefundable === false) {
    if (bookingEl) {
      bookingEl.classList.remove("empty");
      bookingEl.innerHTML = `
        <div class="alert-box error fade-in" style="flex-direction:column; align-items:flex-start;">
          <div style="display:flex; gap:8px; align-items:center; font-weight:600; font-size:1rem;">
            <i class="ph ph-shield-warning" style="font-size:1.4rem;"></i>
            Booking Blocked — Non-Refundable
          </div>
          <div style="margin-top:8px; font-size:0.9rem; line-height:1.6;">
            This option is <strong>non-refundable</strong>. For security reasons, non-refundable bookings are not permitted through this tool.<br>
            Please select a <strong>refundable</strong> room option to proceed.
          </div>
        </div>`;
      bookingEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return;
  }

  // ── Guard 2: Minimum 3-month check-in date ────────────────────────────
  const checkin = globalSearchBody?.checkIn;
  if (checkin) {
    const checkinDate = new Date(checkin);
    const minDate = new Date();
    minDate.setMonth(minDate.getMonth() + 3);
    if (checkinDate < minDate) {
      const minStr = minDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
      if (bookingEl) {
        bookingEl.classList.remove("empty");
        bookingEl.innerHTML = `
          <div class="alert-box error fade-in" style="flex-direction:column; align-items:flex-start;">
            <div style="display:flex; gap:8px; align-items:center; font-weight:600; font-size:1rem;">
              <i class="ph ph-calendar-x" style="font-size:1.4rem;"></i>
              Booking Blocked — Check-in Too Soon
            </div>
            <div style="margin-top:8px; font-size:0.9rem; line-height:1.6;">
              Bookings can only be made for check-in dates <strong>at least 3 months from today</strong>.<br>
              Earliest allowed check-in: <strong>${minStr}</strong>.<br>
              Please adjust your search dates and try again.
            </div>
          </div>`;
        bookingEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
  }

  // ── Proceed with booking ──────────────────────────────────────────────
  if (bookingEl) {
    bookingEl.classList.remove("empty");
    bookingEl.innerHTML = `
      <div class="empty-state fade-in">
        <div class="loader" style="margin-bottom: 16px; border-color: var(--primary); border-top-color: transparent; width: 30px; height: 30px;"></div>
        <p>Confirming your booking...</p>
      </div>
    `;

    // Smooth scroll to booking section
    bookingEl.scrollIntoView({ behavior: "smooth", block: "center" });

  }

  try {
    const config = getConfigPayload();
    const body = {
      optionId,
      correlationId,
      guestDetails: [
        { title: "Mr", firstName: "Test", lastName: "User" },
      ],
      env: config.env,
      apiKey: config.apiKey
    };

    const res = await fetch(`${API_BASE}/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!bookingEl) return;

    if (!res.ok || data.ok === false || (data.status && data.status.success === false)) {
      // Handle the new Duplicate Booking Array format
      let errorMsg = data.reason || "Check response";
      let dupBookingHtml = "";

      if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        const errObj = data.errors[0];
        errorMsg = errObj.message || errorMsg;

        // If it's a duplicate booking error (code 2502)
        if (errObj.errCode === "2502" && errObj.details) {
          const dupId = errObj.details;
          dupBookingHtml = `
            <div style="margin-top: 12px; padding: 12px; background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2); border-radius: 8px;">
              <div style="font-weight: 600; color:var(--primary); margin-bottom: 6px;"><i class="ph ph-copy"></i> Duplicate Detected</div>
              <div style="font-size: 0.85rem; color: #334155; margin-bottom: 8px;">You already have an existing, identical booking.</div>
              <a href="#" onclick="event.preventDefault(); window.history.pushState({ view: 'booking-detail' }, '', '/ui/booking-detail?id=${dupId}'); showBookingDetailPage(); window.scrollTo({ top: 0, behavior: 'smooth' }); fetchAndRenderBookingDetail('${dupId}');" style="display: inline-block; padding: 6px 12px; background: #4f46e5; color: white; border-radius: 6px; font-weight: 600; text-decoration: none; font-size: 0.8rem;">
                View Original Booking (${dupId})
              </a>
            </div>
          `;
        }
      }

      bookingEl.innerHTML = `
        <div class="alert-box error fade-in" style="flex-direction: column; align-items: flex-start;">
          <div style="display:flex; gap:8px; align-items:center;">
            <i class="ph ph-warning-circle" style="font-size: 1.2rem;"></i>
            <span class="message" style="font-weight:600;">Booking failed: ${errorMsg}</span>
          </div>
          ${dupBookingHtml}
        </div>
        <pre style="margin-top:12px; font-size: 0.8rem; background: #fdf2f2; padding: 10px; border-radius: 8px; overflow-x: auto;">${JSON.stringify(data, null, 2)}</pre>
      `;
      return;
    }

    const confirmedBookingId = data.order?.bookingId || data.bookingId;
    if (confirmedBookingId) saveRecentBooking(confirmedBookingId);

    bookingEl.innerHTML = `
      <div class="alert-box success fade-in">
        <i class="ph ph-check-circle"></i>
        <span class="message">Booking confirmed successfully!</span>
      </div>
      <pre style="margin-top:12px; font-size: 0.8rem; background: #f0fdf4; padding: 10px; border-radius: 8px; overflow-x: auto;">${JSON.stringify(data, null, 2)}</pre>
    `;
  } catch (err) {
    if (!bookingEl) return;
    bookingEl.innerHTML = `
      <div class="alert-box error fade-in">
        <i class="ph ph-warning"></i>
        <span class="message">Unexpected error while creating booking.</span>
      </div>
    `;
  }
}

/* =========================================
   Rooms UI Helpers
   ========================================= */
function addRoom() {
  const container = document.getElementById("rooms-container");
  if (!container) return;

  const existing = container.querySelectorAll(".room-row").length;
  const index = existing + 1;

  const wrapper = document.createElement("div");
  wrapper.className = "room-row";
  wrapper.innerHTML = `
    <div class="room-row-header">
      <span><i class="ph ph-door"></i> Room ${index}</span>
      ${index > 1 ? '<button type="button" onclick="removeRoom(this)"><i class="ph ph-trash"></i> Remove</button>' : ""}
    </div>
    <div class="room-fields">
      <div class="input-group" style="margin-bottom:0">
        <label>Adults</label>
        <input type="number" name="adults" min="1" value="2" />
      </div>
      <div class="input-group" style="margin-bottom:0">
        <label>Children</label>
        <input type="number" name="children" min="0" value="0" />
      </div>
      <div class="input-group" style="margin-bottom:0">
        <label>Child Ages</label>
        <input type="text" name="childAges" placeholder="e.g. 3, 5" />
      </div>
    </div>
  `;
  container.appendChild(wrapper);
}

function removeRoom(buttonEl) {
  const row = buttonEl.closest(".room-row");
  const container = document.getElementById("rooms-container");
  if (!row || !container) return;

  row.style.animation = "slideFadeIn 0.2s ease-out reverse";
  setTimeout(() => {
    row.remove();
    const rows = container.querySelectorAll(".room-row");
    rows.forEach((r, idx) => {
      const labelSpan = r.querySelector(".room-row-header span");
      if (labelSpan) labelSpan.innerHTML = `<i class="ph ph-door"></i> Room ${idx + 1}`;
    });
  }, 190);
}

function initializeDates() {
  const checkinInput = document.getElementById("checkin");
  const checkoutInput = document.getElementById("checkout");

  if (!checkinInput || !checkoutInput) return;

  // Set default to 6 months from today (check-in) and 6 months + 1 day (check-out) - one night only
  const today = new Date();

  const checkinDate = new Date(today);
  checkinDate.setMonth(checkinDate.getMonth() + 6); // 6 months from today

  const checkoutDate = new Date(checkinDate);
  checkoutDate.setDate(checkoutDate.getDate() + 1); // One night stay

  // Format as YYYY-MM-DD
  const formatIso = (date) => date.toISOString().split('T')[0];

  checkinInput.value = formatIso(checkinDate);
  checkoutInput.value = formatIso(checkoutDate);
}

/* =========================================
   Number to Words Conversion
   ========================================= */
function numberToWords(num) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const scales = ['', 'Thousand', 'Lakh', 'Crore'];

  function convertHundreds(n) {
    let result = '';
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;

    if (hundred > 0) {
      result += ones[hundred] + ' Hundred';
    }

    if (remainder > 0) {
      if (result) result += ' ';
      if (remainder < 10) {
        result += ones[remainder];
      } else if (remainder < 20) {
        result += teens[remainder - 10];
      } else {
        const ten = Math.floor(remainder / 10);
        const one = remainder % 10;
        result += tens[ten];
        if (one > 0) {
          result += ' ' + ones[one];
        }
      }
    }

    return result;
  }

  if (num === 0) return 'Zero';

  let words = '';
  let scaleIndex = 0;

  while (num > 0) {
    if (num % 1000 !== 0) {
      words = convertHundreds(num % 1000) + (scales[scaleIndex] ? ' ' + scales[scaleIndex] : '') + (words ? ' ' + words : '');
    }
    num = Math.floor(num / 1000);
    scaleIndex++;
  }

  return words.trim();
}

function amountToWords(amount, currency = 'INR') {
  const parts = amount.toString().split('.');
  const rupees = parseInt(parts[0]);
  const paise = parseInt(parts[1] || 0);

  let words = numberToWords(rupees) + ' ' + currency;
  
  if (paise > 0) {
    words += ' and ' + numberToWords(paise) + ' Paise';
  }

  return words;
}

/* =========================================
   Manage Bookings Page
   ========================================= */
function showManageBookingsPage() {
  hideAllPages();
  document.getElementById("manage-bookings-page").classList.remove("hidden");
  renderManageBookings();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderManageBookings() {
  const list = document.getElementById('manage-bookings-list');
  const noMsg = document.getElementById('no-bookings-message');
  const count = document.getElementById('bookings-count');
  
  if (!list || !noMsg) return;

  try {
    let bookings = JSON.parse(localStorage.getItem('tj_recent_bookings_data') || '[]');
    
    if (bookings.length === 0) {
      list.style.display = 'none';
      noMsg.style.display = 'block';
      count.textContent = '(0)';
      return;
    }

    list.style.display = 'grid';
    noMsg.style.display = 'none';
    count.textContent = `(${bookings.length})`;

    list.innerHTML = bookings.map(booking => {
      const date = new Date(booking.createdAt);
      const formattedDate = date.toLocaleDateString(undefined, { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      return `
        <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.1); cursor: pointer;" onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)'; this.style.transform='translateY(-2px)';" onmouseout="this.style.boxShadow='0 1px 3px rgba(0,0,0,0.1)'; this.style.transform='translateY(0)';" onclick="window.history.pushState({ view: 'booking-detail' }, '', '/ui/booking-detail?id=${booking.id}'); showBookingDetailPage(); window.scrollTo({ top: 0, behavior: 'smooth' }); fetchAndRenderBookingDetail('${booking.id}');">
          <div style="display: flex; align-items: flex-start; gap: 12px;">
            <div style="background: linear-gradient(135deg, #3b82f6, #06b6d4); color: #fff; width: 48px; height: 48px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0;">
              <i class="ph ph-receipt"></i>
            </div>
            <div style="flex: 1; min-width: 0;">
              <div style="font-weight: 700; font-size: 0.95rem; color: #1f2937; margin-bottom: 4px; word-break: break-all;">
                ${booking.id}
              </div>
              <div style="font-size: 0.8rem; color: #6b7280; display: flex; align-items: center; gap: 4px;">
                <i class="ph ph-calendar"></i> ${formattedDate}
              </div>
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #f3f4f6;">
                <span style="display: inline-block; background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">
                  <i class="ph ph-arrow-right"></i> View Details
                </span>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (e) {
    console.error('Error rendering bookings:', e);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  // Check login status first
  checkLoginStatus();
  
  // Enable smooth scrolling and animations
  document.documentElement.style.scrollBehavior = 'smooth';
  
  // Prevent layout shift by ensuring consistent rendering
  document.body.style.willChange = 'auto';
  
  // Optimize animations for performance
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    document.documentElement.style.scrollBehavior = 'auto';
  }
  
  renderRecentBookings();
  const container = document.getElementById("rooms-container");
  if (container && container.children.length === 0) {
    addRoom();
  }
  initializeDates();
  loadConfigState();

  // Enforce stateless SPA routing validation on load
  const currentPath = window.location.pathname;
  const params = new URLSearchParams(window.location.search);

  if (currentPath.startsWith('/ui/booking-detail')) {
    const id = params.get('id');
    if (id) {
      showBookingDetailPage();
      fetchAndRenderBookingDetail(id);
      return;
    }
  }

  if (currentPath.startsWith('/ui/detail')) {
    const hid = params.get('hid');
    if (hid && globalSearchBody) {
      fetchHotelDetails(hid);
      return;
    }
  }

  if (currentPath.startsWith('/ui/review')) {
    const hid = params.get('hid');
    const oid = params.get('oid');
    const cid = params.get('cid');
    const rh = params.get('rh');
    const sdp = params.get('sdp') ? parseFloat(params.get('sdp')) : null;

    if (hid && oid && cid && globalSearchBody) {
      reviewRoom(oid, cid, sdp, rh, hid);
      return;
    }
  }

  if (currentPath.startsWith('/ui/results')) {
    if (globalSearchBody) {
      // Re-trigger visual search flow to populate results
      searchHotels(globalSearchBody);
      return;
    }
  }

  if (currentPath !== '/ui/' && currentPath !== '/ui/search') {
    if (!globalSearchBody) {
      window.location.replace('/ui/search');
    }
  }
});

// History API Handlers
window.addEventListener('popstate', (e) => {
  // Simple fallback for browser back/forward buttons: reload to restore clean state
  window.location.reload();
});


// Location-based Batch Search
async function searchLocationHotels(location) {
  clearSearchError();
  setSearchLoading(true);

  try {
    // First, load the hotel codes for the location
    const codesResponse = await fetch(`${API_BASE}/hotel-codes/${location}`);
    const codesData = await codesResponse.json();

    if (!codesData.ok) {
      showSearchError(`Failed to load ${location} hotel codes.`, codesData.message);
      setSearchLoading(false);
      return;
    }

    const hotelCodes = codesData.hotel_codes;
    console.log(`Loaded ${hotelCodes.length} hotel codes for ${location}`);

    // Get search parameters from UI
    const checkin = document.getElementById("checkin").value;
    const checkout = document.getElementById("checkout").value;
    const currency = document.getElementById("currency").value || "INR";
    const correlationInput = document.getElementById("correlationId").value.trim();
    const correlationId = correlationInput || `ui-batch-${Date.now().toString(36).toUpperCase()}`;
    const rooms = readRoomsFromUi();
    const config = getConfigPayload();

    if (!checkin || !checkout) {
      showSearchError("Please select check-in and check-out dates.");
      setSearchLoading(false);
      return;
    }

    // Prepare batch search request
    const batchBody = {
      checkIn: checkin,
      checkOut: checkout,
      rooms,
      currency,
      correlationId,
      hotelCodes: hotelCodes.map(code => parseInt(code, 10)),
      location: location,
      env: config.env,
      apiKey: config.apiKey
    };

    // Add optional nationality if selected
    const nationality = document.getElementById("nationality")?.value;
    if (nationality) {
      batchBody.nationality = nationality;
    }
    
    // Add optional timeoutMs if provided
    const timeoutMs = document.getElementById("timeoutMs")?.value;
    if (timeoutMs) {
      batchBody.timeoutMs = parseInt(timeoutMs, 10);
    }

    console.log(`Sending batch search for ${hotelCodes.length} hotels in batches of 100...`);

    const startTime = performance.now();
    const res = await fetch(`${API_BASE}/batch-search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(batchBody),
    });

    const data = await res.json();
    const duration = Math.round(performance.now() - startTime);

    // Record API response time
    recordApiTime('search', duration);

    // Record individual batch times if available
    if (data.batch_details && Array.isArray(data.batch_details)) {
      data.batch_details.forEach(batch => {
        if (batch.correlation_id) {
          const batchTime = Math.round(duration / data.batch_details.length);
          recordBatchTime(batch.correlation_id, batchTime);
        }
      });
    }

    if (!res.ok || data.ok === false) {
      const detail =
        data && typeof data === "object"
          ? `${data.status_code || res.status} ${data.reason || ""}`.trim()
          : `${res.status}`;
      showSearchError(`Batch search failed for ${location}.`, detail, data);
      displayHotels(null);
      setSearchLoading(false);
      return;
    }

    // Prepare display body for results page
    const displayBody = {
      checkIn: checkin,
      checkOut: checkout,
      rooms,
      currency,
      correlationId,
      hids: hotelCodes.map(code => parseInt(code, 10)),
      env: config.env,
      apiKey: config.apiKey
    };

    // Add optional nationality if selected
    if (nationality) {
      displayBody.nationality = nationality;
    }
    
    // Add optional timeoutMs if provided
    if (timeoutMs) {
      displayBody.timeoutMs = parseInt(timeoutMs, 10);
    }

    // Format batch response for display (ensure it has hotels array)
    const displayData = {
      ...data,
      hotels: data.hotels || data.data || []
    };

    displayHotels(displayData);
    globalSearchBody = displayBody;
    sessionStorage.setItem("tj_global_search", JSON.stringify(displayBody));
    switchToResultsPage(displayBody, duration, displayData);
  } catch (err) {
    showSearchError(`Unexpected error while searching ${location} hotels.`, err?.message);
    displayHotels(null);
  } finally {
    setSearchLoading(false);
  }
}

// Legacy function for backward compatibility
async function searchMumbaiHotels() {
  return searchLocationHotels('mumbai');
}
