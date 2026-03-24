const API_BASE = window.location.origin;
let globalSearchBody = null; // Store the last search used for dynamic-detail

// Track response times for the entire booking journey
let journeyResponseTimes = {
  search: null,
  batchSearch: [],
  staticDetail: null,
  dynamicDetail: null,
  review: null,
  book: null,
  bookingDetail: null
};

// Function to display response times in UI
function displayResponseTimes() {
  console.log('displayResponseTimes: Called');
  
  let totalMs = 0;
  let hasAnyTime = false;
  let html = '';
  
  // Search time
  if (journeyResponseTimes.search) {
    hasAnyTime = true;
    totalMs += journeyResponseTimes.search;
    const seconds = (journeyResponseTimes.search / 1000).toFixed(2);
    html += `<div style="background: white; border: 2px solid #3b82f6; border-radius: 12px; padding: 16px; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);"><div style="font-size: 0.9rem; font-weight: 700; color: #1e293b; margin-bottom: 8px;">Search</div><div style="font-size: 1.8rem; font-weight: 900; color: #3b82f6;">${seconds}s</div></div>`;
  }
  
  // Batch search times
  if (journeyResponseTimes.batchSearch && journeyResponseTimes.batchSearch.length > 0) {
    hasAnyTime = true;
    journeyResponseTimes.batchSearch.forEach((time, idx) => {
      totalMs += time;
      const seconds = (time / 1000).toFixed(2);
      html += `<div style="background: white; border: 2px solid #8b5cf6; border-radius: 12px; padding: 16px; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.1);"><div style="font-size: 0.9rem; font-weight: 700; color: #1e293b; margin-bottom: 8px;">Batch Search ${idx + 1}</div><div style="font-size: 1.8rem; font-weight: 900; color: #8b5cf6;">${seconds}s</div></div>`;
    });
  }
  
  // Static detail time
  if (journeyResponseTimes.staticDetail) {
    hasAnyTime = true;
    totalMs += journeyResponseTimes.staticDetail;
    const seconds = (journeyResponseTimes.staticDetail / 1000).toFixed(2);
    html += `<div style="background: white; border: 2px solid #06b6d4; border-radius: 12px; padding: 16px; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; box-shadow: 0 4px 12px rgba(6, 182, 212, 0.1);"><div style="font-size: 0.9rem; font-weight: 700; color: #1e293b; margin-bottom: 8px;">Static Detail</div><div style="font-size: 1.8rem; font-weight: 900; color: #06b6d4;">${seconds}s</div></div>`;
  }
  
  // Dynamic detail time
  if (journeyResponseTimes.dynamicDetail) {
    hasAnyTime = true;
    totalMs += journeyResponseTimes.dynamicDetail;
    const seconds = (journeyResponseTimes.dynamicDetail / 1000).toFixed(2);
    html += `<div style="background: white; border: 2px solid #10b981; border-radius: 12px; padding: 16px; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);"><div style="font-size: 0.9rem; font-weight: 700; color: #1e293b; margin-bottom: 8px;">Dynamic Detail</div><div style="font-size: 1.8rem; font-weight: 900; color: #10b981;">${seconds}s</div></div>`;
  }
  
  // Review time
  if (journeyResponseTimes.review) {
    hasAnyTime = true;
    totalMs += journeyResponseTimes.review;
    const seconds = (journeyResponseTimes.review / 1000).toFixed(2);
    html += `<div style="background: white; border: 2px solid #f59e0b; border-radius: 12px; padding: 16px; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.1);"><div style="font-size: 0.9rem; font-weight: 700; color: #1e293b; margin-bottom: 8px;">Review</div><div style="font-size: 1.8rem; font-weight: 900; color: #f59e0b;">${seconds}s</div></div>`;
  }
  
  // Book time
  if (journeyResponseTimes.book) {
    hasAnyTime = true;
    totalMs += journeyResponseTimes.book;
    const seconds = (journeyResponseTimes.book / 1000).toFixed(2);
    html += `<div style="background: white; border: 2px solid #ef4444; border-radius: 12px; padding: 16px; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.1);"><div style="font-size: 0.9rem; font-weight: 700; color: #1e293b; margin-bottom: 8px;">Book</div><div style="font-size: 1.8rem; font-weight: 900; color: #ef4444;">${seconds}s</div></div>`;
  }
  
  // Booking detail time
  if (journeyResponseTimes.bookingDetail) {
    hasAnyTime = true;
    totalMs += journeyResponseTimes.bookingDetail;
    const seconds = (journeyResponseTimes.bookingDetail / 1000).toFixed(2);
    html += `<div style="background: white; border: 2px solid #ec4899; border-radius: 12px; padding: 16px; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; box-shadow: 0 4px 12px rgba(236, 72, 153, 0.1);"><div style="font-size: 0.9rem; font-weight: 700; color: #1e293b; margin-bottom: 8px;">Booking Detail</div><div style="font-size: 1.8rem; font-weight: 900; color: #ec4899;">${seconds}s</div></div>`;
  }
  
  if (hasAnyTime) {
    const list = document.getElementById('response-times-list');
    if (list) {
      list.innerHTML = html;
      list.style.display = 'grid !important';
      list.style.gridTemplateColumns = 'repeat(auto-fit, minmax(160px, 1fr))';
      list.style.gap = '12px';
      list.style.padding = '16px 0';
      list.style.visibility = 'visible';
      list.style.opacity = '1';
    }
    
    const section = document.getElementById('response-times-section');
    if (section) {
      section.style.display = 'block !important';
      section.style.visibility = 'visible !important';
      section.style.opacity = '1 !important';
      section.style.marginTop = '24px';
      section.style.minHeight = '200px';
      section.style.overflow = 'visible';
    }
    
    const totalDisplay = document.getElementById('response-times-total');
    const totalTimeDisplay = document.getElementById('total-time-display');
    if (totalDisplay && totalTimeDisplay) {
      totalDisplay.style.display = 'block !important';
      totalDisplay.style.visibility = 'visible !important';
      totalDisplay.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      totalDisplay.style.borderRadius = '12px';
      totalDisplay.style.padding = '20px';
      totalDisplay.style.marginTop = '16px';
      totalDisplay.style.textAlign = 'center';
      totalDisplay.style.color = 'white';
      totalDisplay.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.2)';
      totalTimeDisplay.textContent = formatTimeDisplay(totalMs);
      totalTimeDisplay.style.fontSize = '2rem';
      totalTimeDisplay.style.fontWeight = '900';
      totalTimeDisplay.style.color = 'white';
    }
    
    console.log('✅ Response times displayed - Total:', formatTimeDisplay(totalMs));
    console.log('✅ Section visible:', section.offsetHeight > 0);
    console.log('✅ List visible:', list.offsetHeight > 0);
  } else {
    const section = document.getElementById('response-times-section');
    if (section) {
      section.style.display = 'none';
    }
  }
}

// Helper function to format time display
function formatTimeDisplay(ms) {
  if (ms < 1000) return `${ms}ms`;
  const seconds = (ms / 1000).toFixed(2);
  return `${seconds}s`;
}

// Login credentials
const VALID_EMAIL = "aryan.singh@tripjack.com";
const VALID_PASSWORD = "123@abc";

/* =========================================
   Logging Utility - Logs to File Instead of Console
   ========================================= */
async function logToFile(message, data = null) {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      message,
      data: data || null
    };
    
    // Send log to backend to save to file
    await fetch(`${API_BASE}/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(logEntry)
    }).catch(() => {}); // Silently fail if logging endpoint doesn't exist
  } catch (e) {
    // Silently fail
  }
}

/* =========================================
   Login & Logout Functions
   ========================================= */
function handleLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  const errorEl = document.getElementById("login-error");
  const errorText = document.getElementById("login-error-text");
  
  if (email === VALID_EMAIL && password === VALID_PASSWORD) {
    localStorage.setItem("tj_user_logged_in", "true");
    localStorage.setItem("tj_user_email", email);
    checkLoginStatus();
  } else {
    errorEl.classList.remove("hidden");
    errorText.textContent = "Invalid email or password";
  }
}

function togglePasswordVisibility() {
  const input = document.getElementById("login-password");
  const icon = document.getElementById("password-toggle-icon");
  
  if (input.type === "password") {
    input.type = "text";
    icon.classList.remove("ph-eye");
    icon.classList.add("ph-eye-slash");
  } else {
    input.type = "password";
    icon.classList.remove("ph-eye-slash");
    icon.classList.add("ph-eye");
  }
}

function checkLoginStatus() {
  const isLoggedIn = localStorage.getItem("tj_user_logged_in") === "true";
  const logoutBtn = document.getElementById("logout-btn");
  
  if (!isLoggedIn) {
    // Show login page
    document.getElementById("login-page").classList.remove("hidden");
    document.getElementById("search-page").classList.add("hidden");
    if (logoutBtn) logoutBtn.style.display = "none";
  } else {
    // Show search page
    document.getElementById("login-page").classList.add("hidden");
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

window.addEventListener("DOMContentLoaded", () => {
  checkLoginStatus();
  setDefaultDates();
  loadRecentBookings();
  
  const currentPath = window.location.pathname;
  
  if (currentPath === '/ui/detail' || currentPath === '/ui/review') {
    const savedState = sessionStorage.getItem('tj_page_state');
    
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        
        if (state.page === 'detail' && currentPath === '/ui/detail') {
          globalSearchBody = state.searchBody;
          window.globalDetailData = state.detailData;
          
          const searchPage = document.getElementById("search-page");
          const resultsPage = document.getElementById("results-page");
          const detailPage = document.getElementById("detail-page");
          
          if (searchPage) searchPage.classList.add("hidden");
          if (resultsPage) resultsPage.classList.add("hidden");
          if (detailPage) {
            detailPage.classList.remove("hidden");
            detailPage.classList.add("fade-in");
          }
          
          const hotelId = state.requestedHotelId;
          const optionId = state.requestedOptionId;
          if (hotelId && optionId) {
            fetchHotelDetails(hotelId, optionId);
          } else {
            renderHotelDetails(state.detailData);
          }
        } else if (state.page === 'review' && currentPath === '/ui/review') {
          globalSearchBody = state.searchBody;
          window._lastReviewData = state.reviewData;
          
          const searchPage = document.getElementById("search-page");
          const resultsPage = document.getElementById("results-page");
          const detailPage = document.getElementById("detail-page");
          const reviewPage = document.getElementById("review-page");
          
          if (searchPage) searchPage.classList.add("hidden");
          if (resultsPage) resultsPage.classList.add("hidden");
          if (detailPage) detailPage.classList.add("hidden");
          if (reviewPage) {
            reviewPage.classList.remove("hidden");
            reviewPage.classList.add("fade-in");
          }
          
          const optionId = state.requestedOptionId;
          const correlationId = state.requestedCorrelationId;
          if (optionId && correlationId) {
            reviewRoom(optionId, correlationId, null);
          } else {
            renderReviewDetails(state.reviewData, state.responseMs || 0);
          }
        }
      } catch (e) {
        // Silent fail
      }
    } else {
      window.location.replace('/ui/search');
    }
  } else if (currentPath === '/ui/results') {
    const savedState = sessionStorage.getItem('tj_page_state');
    
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        if (state.page === 'results') {
          globalSearchBody = state.searchBody;
          displayHotels(state.resultsData);
          switchToResultsPage(state.searchBody, state.duration || 0, state.resultsData);
        }
      } catch (e) {
        // Silent fail
      }
    }
  } else {
    sessionStorage.removeItem('tj_page_state');
  }
});

// Function to set default dates (today and tomorrow for 1 night stay)
function setDefaultDates() {
  const checkinInput = document.getElementById("checkin");
  const checkoutInput = document.getElementById("checkout");
  
  if (checkinInput && checkoutInput) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Format dates as YYYY-MM-DD for input[type="date"]
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    checkinInput.value = formatDate(today);
    checkoutInput.value = formatDate(tomorrow);
    
    // Set minimum date to today
    checkinInput.min = formatDate(today);
    checkoutInput.min = formatDate(tomorrow);
    
    // Add event listener to automatically update checkout when checkin changes
    checkinInput.addEventListener('change', function() {
      const selectedCheckin = new Date(this.value);
      const nextDay = new Date(selectedCheckin);
      nextDay.setDate(nextDay.getDate() + 1);
      
      checkoutInput.value = formatDate(nextDay);
      checkoutInput.min = formatDate(nextDay);
    });
  }
}

// Load and display recent bookings on search page
async function loadRecentBookings() {
  try {
    console.log('loadRecentBookings: Starting...');
    console.log('loadRecentBookings: API_BASE =', API_BASE);
    
    const url = `${API_BASE}/recent-bookings`;
    console.log('loadRecentBookings: Fetching from URL:', url);
    
    const response = await fetch(url);
    console.log('loadRecentBookings: Response status:', response.status);
    
    const data = await response.json();
    console.log('loadRecentBookings: Response data:', data);
    
    const section = document.getElementById('recent-bookings-section');
    console.log('loadRecentBookings: Section element:', section);
    
    if (!data.ok) {
      console.log('loadRecentBookings: data.ok is false');
      if (section) section.style.display = 'none';
      return;
    }
    
    if (!data.bookings) {
      console.log('loadRecentBookings: data.bookings is undefined');
      if (section) section.style.display = 'none';
      return;
    }
    
    if (data.bookings.length === 0) {
      console.log('loadRecentBookings: No bookings in array');
      if (section) section.style.display = 'none';
      return;
    }
    
    const bookings = data.bookings;
    const list = document.getElementById('recent-bookings-list');
    const count = document.getElementById('bookings-count');
    
    console.log('loadRecentBookings: Found', bookings.length, 'bookings');
    console.log('loadRecentBookings: List element:', list);
    console.log('loadRecentBookings: Count element:', count);
    
    if (!list || !count) {
      console.log('loadRecentBookings: Missing list or count element');
      return;
    }
    
    count.textContent = `(${bookings.length})`;
    list.innerHTML = '';
    
    bookings.forEach((booking, index) => {
      console.log('loadRecentBookings: Processing booking', index, ':', booking);
      
      const createdDate = new Date(booking.createdAt);
      const formattedDate = createdDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric'
      });
      const formattedTime = createdDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      const fullDateTime = `${formattedDate} ${formattedTime}`;
      
      const isRecent = index < 5;
      const bookingCard = document.createElement('div');
      bookingCard.style.cssText = `
        background: linear-gradient(135deg, ${isRecent ? '#f0fdf4' : '#f8fafc'} 0%, ${isRecent ? '#dcfce7' : '#f1f5f9'} 100%);
        border: 1px solid ${isRecent ? 'rgba(34, 197, 94, 0.3)' : 'rgba(226, 232, 240, 0.8)'};
        border-radius: 12px;
        padding: 16px;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      `;
      
      bookingCard.onmouseover = function() {
        this.style.transform = 'translateY(-4px)';
        this.style.boxShadow = `0 8px 24px ${isRecent ? 'rgba(34, 197, 94, 0.15)' : 'rgba(59, 130, 246, 0.15)'}`;
      };
      
      bookingCard.onmouseout = function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = 'none';
      };
      
      bookingCard.onclick = () => viewBookingDetail(booking.id);
      
      const statusColor = isRecent ? '#16a34a' : '#64748b';
      
      bookingCard.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
          <div style="flex: 1;">
            <div style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 4px;">Booking ID</div>
            <div style="font-family: monospace; font-size: 0.9rem; font-weight: 700; color: #0f172a;">${booking.id}</div>
          </div>
        </div>
        
        <div style="display: flex; align-items: center; gap: 6px; color: #64748b; font-size: 0.8rem; margin-bottom: 12px;">
          <i class="ph ph-calendar" style="font-size: 0.9rem;"></i>
          <span>${fullDateTime}</span>
        </div>
        
        ${booking.totalResponseTime ? `
          <div style="background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 8px; padding: 8px 12px; margin-bottom: 12px; font-size: 0.8rem;">
            <div style="color: #64748b; font-weight: 600; margin-bottom: 4px;">Total Response Time</div>
            <div style="color: #3b82f6; font-weight: 700; font-size: 1rem;">${(booking.totalResponseTime / 1000).toFixed(2)}s</div>
          </div>
        ` : ''}
        
        <button onclick="event.stopPropagation(); viewBookingDetail('${booking.id}')" style="width: 100%; padding: 10px; background: linear-gradient(135deg, ${statusColor} 0%, ${statusColor}dd 100%); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.85rem; transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; gap: 6px;">
          <i class="ph ph-arrow-right"></i> View
        </button>
      `;
      
      list.appendChild(bookingCard);
      console.log('loadRecentBookings: Added booking card for', booking.id);
    });
    
    if (section) {
      section.style.display = 'block';
      console.log('loadRecentBookings: Section displayed');
    }
  } catch (err) {
    console.error('loadRecentBookings: ERROR -', err);
    console.error('loadRecentBookings: Error stack:', err.stack);
    const section = document.getElementById('recent-bookings-section');
    if (section) section.style.display = 'none';
  }
}

const OPTION_TYPES = {
  SRSM: { name: "Same Room Same Mealplan", desc: "All rooms are the same room type AND all have the same meal plan." },
  SRCM: { name: "Same Room Cross Mealplan", desc: "All rooms are the same room type BUT meal plans differ across rooms." },
  CRSM: { name: "Cross Room Same Mealplan", desc: "Rooms are of different types BUT all share the same meal plan." },
  CRCM: { name: "Cross Room Cross Mealplan", desc: "Rooms differ in type AND meal plan varies per room." },
  SINGLE: { name: "Single Option", desc: "Single option provided." }
};

function formatDuration(ms) {
  if (ms < 1000) return `<i class="ph ph-timer"></i> ${ms}ms`;

  const seconds = Math.floor(ms / 1000);
  const remainingMs = ms % 1000;

  if (seconds < 60) {
    return `<i class="ph ph-timer"></i> ${seconds}s ${remainingMs}ms`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `<i class="ph ph-timer"></i> ${minutes}m ${remainingSeconds}s ${remainingMs}ms`;
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
  if (!el || !msgEl) return;

  el.classList.remove("hidden");
  msgEl.textContent = message + (details ? ` (${details})` : "");
}

function clearSearchError() {
  const el = document.getElementById("search-error");
  const msgEl = el?.querySelector(".message");
  if (!el || !msgEl) return;

  el.classList.add("hidden");
  msgEl.textContent = "";
}

/* =========================================
   Search Criteria Display Functions
   ========================================= */
function generateSearchCriteriaDisplay(searchBody, location = null, isCompact = false) {
  if (!searchBody) {
    console.error('ERROR: searchBody is null/undefined');
    return '';
  }

  // Calculate stay duration
  let stayNights = 1;
  let checkInFormatted = '';
  let checkOutFormatted = '';
  
  if (searchBody.checkIn && searchBody.checkOut) {
    const start = new Date(searchBody.checkIn);
    const end = new Date(searchBody.checkOut);
    stayNights = Math.round((end - start) / (1000 * 60 * 60 * 24));
    
    checkInFormatted = start.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
    checkOutFormatted = end.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }

  // Calculate guest details
  let totalAdults = 0;
  let totalChildren = 0;
  let childAges = [];
  
  searchBody.rooms?.forEach((room) => {
    totalAdults += room.adults || 0;
    totalChildren += room.children || 0;
    if (room.childAge) childAges.push(...room.childAge);
  });

  const roomCount = searchBody.rooms?.length || 0;
  const currency = searchBody.currency || "INR";

  // Location information
  let locationText = '';
  if (location) {
    locationText = location.charAt(0).toUpperCase() + location.slice(1);
  }

  // Create modern, beautiful search criteria box
  return `
    <div id="search-criteria-box" style="background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); border: 2px solid transparent; background-clip: padding-box; border-radius: 16px; padding: 0; margin-bottom: 24px; box-shadow: 0 4px 20px rgba(59, 130, 246, 0.12), 0 0 0 1px rgba(59, 130, 246, 0.08); position: relative; overflow: hidden; animation: slideInUp 0.5s ease-out;">
      
      <!-- Decorative gradient border effect -->
      <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%); background-size: 200% 100%; animation: gradientShift 3s ease infinite;"></div>
      
      <!-- Header Section -->
      <div style="padding: 20px 24px; background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%); border-bottom: 1px solid rgba(59, 130, 246, 0.1);">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 44px; height: 44px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.1rem; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); position: relative;">
            <i class="ph ph-magnifying-glass"></i>
            <div style="position: absolute; inset: -2px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); border-radius: 12px; opacity: 0.3; filter: blur(8px); z-index: -1;"></div>
          </div>
          <div style="flex: 1;">
            <h4 style="margin: 0; font-size: 1.05rem; font-weight: 700; color: #1e293b; letter-spacing: -0.02em;">Your Search Criteria</h4>
            <p style="margin: 2px 0 0 0; color: #64748b; font-size: 0.85rem; font-weight: 500;">Booking details at a glance</p>
          </div>
          <div style="padding: 6px 12px; background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 20px; font-size: 0.75rem; font-weight: 600; color: #059669; text-transform: uppercase; letter-spacing: 0.5px;">
            <i class="ph ph-check-circle" style="margin-right: 4px;"></i> Active
          </div>
        </div>
      </div>

      <!-- Content Grid -->
      <div style="padding: 24px; display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px;">
        ${locationText ? `
          <div style="background: linear-gradient(135deg, #ffffff 0%, #fefefe 100%); border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 16px; text-align: center; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: default; position: relative; overflow: hidden;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 24px rgba(59, 130, 246, 0.15)'; this.style.borderColor='rgba(59, 130, 246, 0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'; this.style.borderColor='#e2e8f0';">
            <div style="position: absolute; top: 0; right: 0; width: 60px; height: 60px; background: radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%); border-radius: 0 0 0 100%;"></div>
            <div style="display: flex; align-items: center; justify-content: center; gap: 6px; margin-bottom: 8px;">
              <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(239, 68, 68, 0.25);">
                <i class="ph ph-map-pin" style="color: white; font-size: 0.95rem;"></i>
              </div>
            </div>
            <div style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.8px; color: #64748b; font-weight: 600; margin-bottom: 6px;">Location</div>
            <div style="font-weight: 700; color: #0f172a; font-size: 1rem; letter-spacing: -0.01em;">${locationText}</div>
          </div>
        ` : ''}
        
        <div style="background: linear-gradient(135deg, #ffffff 0%, #fefefe 100%); border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 16px; text-align: center; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: default; position: relative; overflow: hidden;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 24px rgba(59, 130, 246, 0.15)'; this.style.borderColor='rgba(59, 130, 246, 0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'; this.style.borderColor='#e2e8f0';">
          <div style="position: absolute; top: 0; right: 0; width: 60px; height: 60px; background: radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%); border-radius: 0 0 0 100%;"></div>
          <div style="display: flex; align-items: center; justify-content: center; gap: 6px; margin-bottom: 8px;">
            <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);">
              <i class="ph ph-calendar" style="color: white; font-size: 0.95rem;"></i>
            </div>
          </div>
          <div style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.8px; color: #64748b; font-weight: 600; margin-bottom: 6px;">Dates</div>
          <div style="font-weight: 700; color: #0f172a; font-size: 0.9rem; letter-spacing: -0.01em;">${checkInFormatted} - ${checkOutFormatted}</div>
        </div>

        <div style="background: linear-gradient(135deg, #ffffff 0%, #fefefe 100%); border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 16px; text-align: center; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: default; position: relative; overflow: hidden;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 24px rgba(59, 130, 246, 0.15)'; this.style.borderColor='rgba(59, 130, 246, 0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'; this.style.borderColor='#e2e8f0';">
          <div style="position: absolute; top: 0; right: 0; width: 60px; height: 60px; background: radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%); border-radius: 0 0 0 100%;"></div>
          <div style="display: flex; align-items: center; justify-content: center; gap: 6px; margin-bottom: 8px;">
            <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(139, 92, 246, 0.25);">
              <i class="ph ph-moon" style="color: white; font-size: 0.95rem;"></i>
            </div>
          </div>
          <div style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.8px; color: #64748b; font-weight: 600; margin-bottom: 6px;">Nights</div>
          <div style="font-weight: 700; color: #0f172a; font-size: 1.1rem; letter-spacing: -0.01em;">${stayNights}</div>
        </div>

        <div style="background: linear-gradient(135deg, #ffffff 0%, #fefefe 100%); border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 16px; text-align: center; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: default; position: relative; overflow: hidden;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 24px rgba(59, 130, 246, 0.15)'; this.style.borderColor='rgba(59, 130, 246, 0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'; this.style.borderColor='#e2e8f0';">
          <div style="position: absolute; top: 0; right: 0; width: 60px; height: 60px; background: radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%); border-radius: 0 0 0 100%;"></div>
          <div style="display: flex; align-items: center; justify-content: center; gap: 6px; margin-bottom: 8px;">
            <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);">
              <i class="ph ph-users" style="color: white; font-size: 0.95rem;"></i>
            </div>
          </div>
          <div style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.8px; color: #64748b; font-weight: 600; margin-bottom: 6px;">Guests</div>
          <div style="font-weight: 700; color: #0f172a; font-size: 0.9rem; letter-spacing: -0.01em;">${totalAdults}A${totalChildren > 0 ? `, ${totalChildren}C` : ''}</div>
          ${childAges.length > 0 ? `<div style="font-size: 0.7rem; color: #64748b; margin-top: 4px; font-weight: 500;">Ages: ${childAges.join(', ')}</div>` : ''}
        </div>

        <div style="background: linear-gradient(135deg, #ffffff 0%, #fefefe 100%); border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 16px; text-align: center; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: default; position: relative; overflow: hidden;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 24px rgba(59, 130, 246, 0.15)'; this.style.borderColor='rgba(59, 130, 246, 0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'; this.style.borderColor='#e2e8f0';">
          <div style="position: absolute; top: 0; right: 0; width: 60px; height: 60px; background: radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%); border-radius: 0 0 0 100%;"></div>
          <div style="display: flex; align-items: center; justify-content: center; gap: 6px; margin-bottom: 8px;">
            <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(245, 158, 11, 0.25);">
              <i class="ph ph-door" style="color: white; font-size: 0.95rem;"></i>
            </div>
          </div>
          <div style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.8px; color: #64748b; font-weight: 600; margin-bottom: 6px;">Rooms</div>
          <div style="font-weight: 700; color: #0f172a; font-size: 1.1rem; letter-spacing: -0.01em;">${roomCount}</div>
        </div>

        <div style="background: linear-gradient(135deg, #ffffff 0%, #fefefe 100%); border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 16px; text-align: center; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: default; position: relative; overflow: hidden;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 24px rgba(59, 130, 246, 0.15)'; this.style.borderColor='rgba(59, 130, 246, 0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'; this.style.borderColor='#e2e8f0';">
          <div style="position: absolute; top: 0; right: 0; width: 60px; height: 60px; background: radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%); border-radius: 0 0 0 100%;"></div>
          <div style="display: flex; align-items: center; justify-content: center; gap: 6px; margin-bottom: 8px;">
            <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(6, 182, 212, 0.25);">
              <i class="ph ph-currency-circle-dollar" style="color: white; font-size: 0.95rem;"></i>
            </div>
          </div>
          <div style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.8px; color: #64748b; font-weight: 600; margin-bottom: 6px;">Currency</div>
          <div style="font-weight: 700; color: #0f172a; font-size: 1rem; letter-spacing: -0.01em;">${currency}</div>
        </div>
      </div>
    </div>
  `;
}

/* =========================================
   Configuration & Environment
   ========================================= */
const PREDEFINED_KEYS = [
  "7510455af381d5-d315-41e2-8e5e-e94cc0a960fe",
  "8112616278b36e4e-6996-4088-b66b-bf5d6787fe13",
  "81139487b3f2160f-acb8-41d6-9177-4bc69df0148a",
  "711814269fe755f1-cdc6-44bf-acbc-d91b1a451878",
  "6116982da6b759-28f8-4cdf-b210-04cb98116165",
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

  if (PREDEFINED_KEYS.includes(savedApikey)) {
    if (selectEl) selectEl.value = savedApikey;
    if (customContainer) customContainer.style.display = "none";
  } else {
    if (selectEl) selectEl.value = "custom";
    if (customContainer) customContainer.style.display = "grid";
    maskCustomKey(); // initialize masked
  }
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

async function searchHotels() {
  clearSearchError();
  setSearchLoading(true);

  try {
    const checkin = document.getElementById("checkin").value;
    const checkout = document.getElementById("checkout").value;
    const currency = document.getElementById("currency").value || "INR";
    const correlationInput = document.getElementById("correlationId").value.trim();
    const correlationId = correlationInput || `ui-${Date.now().toString(36).toUpperCase()}`;
    const nationality = document.getElementById("nationality").value || "106";
    const timeoutMs = parseInt(document.getElementById("timeoutMs").value || "13000", 10);

    let hotelids = document.getElementById("hotelids").value.split(",");
    hotelids = hotelids.map((id) => parseInt(id.trim(), 10)).filter(Boolean);

    const rooms = readRoomsFromUi();
    const config = getConfigPayload();

    const body = {
      checkIn: checkin,
      checkOut: checkout,
      rooms,
      currency,
      correlationId,
      hids: hotelids,
      nationality,
      timeoutMs,
      env: config.env,
      apiKey: config.apiKey
    };

    const startTime = performance.now();
    
    const res = await fetch(`${API_BASE}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    const duration = Math.round(performance.now() - startTime);
    
    console.log('API_SEARCH_REQUEST', { duration, status: res.status, ok: data.ok });
    
    // Track response time
    journeyResponseTimes.search = duration;
    displayResponseTimes();

    if (!res.ok || data.ok === false) {
      const detail =
        data && typeof data === "object"
          ? `${data.status_code || res.status} ${data.reason || ""}`.trim()
          : `${res.status}`;
      showSearchError("Search failed. Check API response details.", detail, data);
      displayHotels(null);
      return;
    }

    // Set Timer UI
    const timerUI = document.getElementById("search-timer");
    if (timerUI) {
      timerUI.innerHTML = formatDuration(duration);
      timerUI.classList.remove("hidden");
    }

    displayHotels(data);
    globalSearchBody = body; // Cache for detail queries
    switchToResultsPage(body, duration, data);
  } catch (err) {
    showSearchError("Unexpected error while searching hotels.", err?.message);
    displayHotels(null);
  } finally {
    setSearchLoading(false);
  }
}

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

    // Now perform batch search with the loaded codes
    const checkin = document.getElementById("checkin").value;
    const checkout = document.getElementById("checkout").value;
    const currency = document.getElementById("currency").value || "INR";
    const correlationInput = document.getElementById("correlationId").value.trim();
    const correlationId = correlationInput || `ui-${Date.now().toString(36).toUpperCase()}`;
    const nationality = document.getElementById("nationality").value || "106";
    const timeoutMs = parseInt(document.getElementById("timeoutMs").value || "13000", 10);

    const rooms = readRoomsFromUi();
    const config = getConfigPayload();

    const body = {
      checkIn: checkin,
      checkOut: checkout,
      rooms,
      currency,
      correlationId,
      hotelCodes,
      location,
      nationality,
      timeoutMs,
      env: config.env,
      apiKey: config.apiKey
    };

    const startTime = performance.now();
    const res = await fetch(`${API_BASE}/batch-search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    const duration = Math.round(performance.now() - startTime);
    
    console.log('API_BATCH_SEARCH_REQUEST', { duration, status: res.status, ok: data.ok });
    
    // Track response time
    journeyResponseTimes.batchSearch.push(duration);
    displayResponseTimes();

    if (!res.ok || data.ok === false) {
      const detail =
        data && typeof data === "object"
          ? `${data.status_code || res.status} ${data.reason || ""}`.trim()
          : `${res.status}`;
      showSearchError(`Batch search for ${location} failed.`, detail, data);
      displayHotels(null);
      return;
    }

    // Set Timer UI
    const timerUI = document.getElementById("search-timer");
    if (timerUI) {
      timerUI.innerHTML = formatDuration(duration);
      timerUI.classList.remove("hidden");
    }

    displayHotels(data);
    globalSearchBody = body; // Cache for detail queries
    switchToResultsPage(body, duration, data);
  } catch (err) {
    showSearchError(`Unexpected error while searching ${location} hotels.`, err?.message);
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

  if (!data || !Array.isArray(data.hotels) || data.hotels.length === 0) {
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
  document.getElementById("results-count").textContent = `(${data.hotels.length} Total)`;

  // Reset Results filters
  document.getElementById("r-filter-name").value = "";
  document.getElementById("r-filter-meal").value = "";
  document.getElementById("r-filter-gst").value = "";
  document.getElementById("r-filter-refund").value = "";
  document.getElementById("r-filter-pan").value = "";
  document.getElementById("r-filter-price").value = "";

  results.classList.remove("empty");
  results.innerHTML = "";
  if (meta) meta.textContent = `${data.hotels.length} option(s) returned`;

  data.hotels.forEach((hotel, index) => {
    const option = hotel.options?.[0];
    if (!option) return;

    const card = document.createElement("div");
    card.className = "hotel-card fade-in";
    card.style.animationDelay = `${index * 0.05}s`;

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
        </div>
        
        <button class="btn-premium" onclick="fetchHotelDetails('${hotel.hotelId}', '${option.optionId}')">
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
  const passportFilter = document.getElementById("r-filter-passport").value;
  const priceSort = document.getElementById("r-filter-price").value;

  const resultsContainer = document.getElementById("results");
  let cards = Array.from(resultsContainer.querySelectorAll(".hotel-card"));
  let visibleCount = 0;

  // Filter cards
  cards = cards.filter(card => {
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
    if (passportFilter && ds.passport !== passportFilter) isMatch = false;

    if (isMatch) {
      card.style.display = "flex";
      card.classList.add("fade-in");
      visibleCount++;
    } else {
      card.style.display = "none";
      card.classList.remove("fade-in");
    }
    
    return isMatch;
  });

  // Sort by price if selected
  if (priceSort === "low_to_high") {
    cards.sort((a, b) => parseFloat(a.dataset.price) - parseFloat(b.dataset.price));
  } else if (priceSort === "high_to_low") {
    cards.sort((a, b) => parseFloat(b.dataset.price) - parseFloat(a.dataset.price));
  }

  // Re-append sorted cards
  cards.forEach(card => {
    resultsContainer.appendChild(card);
  });

  const countSpan = document.getElementById("results-count");
  if (countSpan) {
    const totalCards = resultsContainer.querySelectorAll(".hotel-card").length;
    countSpan.textContent = `(${visibleCount} Visible / ${totalCards} Total)`;
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
}

function switchToResultsPage(lastSearchBody, durationMs, data) {
  // SAVE STATE TO SESSIONSTORE FOR PAGE REFRESH
  const stateToSave = {
    page: 'results',
    searchBody: lastSearchBody,
    resultsData: data,
    duration: durationMs,
    timestamp: Date.now()
  };
  sessionStorage.setItem('tj_page_state', JSON.stringify(stateToSave));
  
  const searchPage = document.getElementById("search-page");
  const resultsPage = document.getElementById("results-page");
  const summary = document.getElementById("results-summary");
  const resultsTimer = document.getElementById("results-timer");

  if (searchPage) {
    searchPage.classList.remove("fade-in");
    searchPage.classList.add("hidden");
  }
  if (resultsPage) {
    resultsPage.classList.remove("hidden");
    resultsPage.classList.add("fade-in");
  }

  // Update URL
  if (window.location.pathname !== '/ui/results') {
    history.pushState({ view: 'results' }, '', '/ui/results');
  }

  if (resultsTimer && durationMs) {
    resultsTimer.innerHTML = formatDuration(durationMs);
    resultsTimer.classList.remove("hidden");
  }

  if (summary && lastSearchBody) {
    const searchedIds = lastSearchBody.hids?.length || lastSearchBody.hotelCodes?.length || 0;
    const returnedHotels = data?.hotels?.length || 0;
    const location = lastSearchBody.location || null;
    
    // Beautiful and modern results summary at the top
    const resultsSummaryHtml = `
      <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 50%, #c6f6d5 100%); border: 2px solid rgba(34, 197, 94, 0.3); border-radius: 16px; padding: 24px; margin-bottom: 24px; position: relative; overflow: hidden; box-shadow: 0 10px 30px rgba(16, 185, 129, 0.15);">
        <!-- Decorative background elements -->
        <div style="position: absolute; top: -40px; right: -40px; width: 120px; height: 120px; background: radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%); border-radius: 50%; pointer-events: none;"></div>
        <div style="position: absolute; bottom: -30px; left: -30px; width: 100px; height: 100px; background: radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%); border-radius: 50%; pointer-events: none;"></div>
        
        <div style="display: flex; align-items: flex-start; gap: 20px; position: relative; z-index: 1;">
          <!-- Icon Container -->
          <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 14px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.6rem; flex-shrink: 0; box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3); animation: pulse 2s ease-in-out infinite;">
            <i class="ph ph-check-circle"></i>
          </div>
          
          <!-- Content -->
          <div style="flex: 1;">
            <h3 style="margin: 0 0 12px 0; font-size: 1.4rem; font-weight: 800; color: #065f46; letter-spacing: -0.5px;">Search Results</h3>
            
            <!-- Stats Grid -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
              <!-- Stat 1: Hotel Codes Hit -->
              <div style="background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.8); border-radius: 12px; padding: 12px 14px; display: flex; align-items: center; gap: 10px; transition: all 0.3s ease;">
                <div style="width: 36px; height: 36px; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.9rem;">
                  <i class="ph ph-target"></i>
                </div>
                <div>
                  <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #92400e;">Hit</div>
                  <div style="font-size: 1.1rem; font-weight: 800; color: #059669;">${searchedIds}</div>
                </div>
              </div>
              
              <!-- Stat 2: Hotels Returned -->
              <div style="background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.8); border-radius: 12px; padding: 12px 14px; display: flex; align-items: center; gap: 10px; transition: all 0.3s ease;">
                <div style="width: 36px; height: 36px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.9rem;">
                  <i class="ph ph-buildings"></i>
                </div>
                <div>
                  <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #1e3a8a;">Response</div>
                  <div style="font-size: 1.1rem; font-weight: 800; color: #059669;">${returnedHotels}</div>
                </div>
              </div>
            </div>
            
            <!-- Description -->
            <div style="background: rgba(255, 255, 255, 0.5); border-left: 3px solid #10b981; border-radius: 8px; padding: 10px 12px; font-size: 0.9rem; color: #047857; line-height: 1.5;">
              <span style="font-weight: 600;">You hit</span> <strong style="color: #059669; font-size: 0.95rem;">${searchedIds} hotel code${searchedIds !== 1 ? 's' : ''}</strong> 
              <span style="font-weight: 600;">and in the response it is coming</span> 
              <strong style="color: #059669; font-size: 0.95rem;">${returnedHotels} hotel${returnedHotels !== 1 ? 's' : ''}</strong>
              ${location ? ` <span style="font-weight: 600;">in</span> <strong style="text-transform: capitalize; color: #059669;">${location}</strong>` : ''}
            </div>
          </div>
        </div>
      </div>
      
      <style>
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      </style>
    `;

    summary.innerHTML = resultsSummaryHtml;
    
    // Add search criteria below the "Matching Hotels" heading
    const searchCriteriaHtml = generateSearchCriteriaDisplay(lastSearchBody, location, false);
    
    // Insert search criteria after the panel-header
    const panelHeader = document.querySelector('.panel-header');
    if (panelHeader) {
      // Remove any existing search criteria
      const existingCriteria = document.getElementById('search-criteria-box');
      if (existingCriteria) {
        existingCriteria.remove();
      }
      
      // Create a wrapper div for search criteria
      const criteriaDiv = document.createElement('div');
      criteriaDiv.id = 'search-criteria-box';
      criteriaDiv.innerHTML = searchCriteriaHtml;
      
      // Insert after panel-header
      panelHeader.parentNode.insertBefore(criteriaDiv, panelHeader.nextSibling);
    }
  }
}

function backToSearch() {
  // Clear any existing search to guarantee fresh UI state
  sessionStorage.removeItem('tj_page_state');
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
  }

  // Update URL
  if (window.location.pathname !== '/ui/results') {
    history.pushState({ view: 'results' }, '', '/ui/results');
  }
}

async function fetchHotelDetails(hotelId, optionId) {
  
  if (!globalSearchBody) {
    return;
  }

  const searchPage = document.getElementById("search-page");
  const resultsPage = document.getElementById("results-page");
  const detailPage = document.getElementById("detail-page");
  const header = document.getElementById("hotel-detail-header");
  const resultsContainer = document.getElementById("detail-results");
  const timerUI = document.getElementById("detail-timer");
  const errorBox = document.getElementById("detail-error");

  // Reset View
  if (resultsPage) {
    resultsPage.classList.remove("fade-in");
    resultsPage.classList.add("hidden");
  }
  if (searchPage) {
    searchPage.classList.add("hidden");
  }
  if (detailPage) {
    detailPage.classList.remove("hidden");
    detailPage.classList.add("fade-in");
  }

  // Update URL
  if (window.location.pathname !== '/ui/detail') {
    history.pushState({ view: 'detail', hid: hotelId }, '', '/ui/detail');
  }

  header.innerHTML = `<h2 class="hotel-name">Loading Details...</h2>`;
  
  // Add search criteria display to detail page at the top
  let searchCriteriaHtml = '';
  if (globalSearchBody) {
    searchCriteriaHtml = generateSearchCriteriaDisplay(globalSearchBody, globalSearchBody.location, false);
  }
  
  resultsContainer.innerHTML = searchCriteriaHtml + `
    <div class="empty-state">
      <div class="loader" style="margin-bottom: 16px; border-color: var(--primary); border-top-color: transparent; width: 30px; height: 30px;"></div>
      <p>Fetching hotel details...</p>
    </div>
  `;
  timerUI.classList.add("hidden");
  errorBox.classList.add("hidden");

  try {
    const config = getConfigPayload();
    const dynamicBody = {
      ...globalSearchBody,
      hid: hotelId,
      optionId: optionId,
      env: config.env,
      apiKey: config.apiKey
    };
    delete dynamicBody.hids;

    const staticBody = {
      hid: hotelId,
      env: config.env,
      apiKey: config.apiKey
    };

    const startTime = performance.now();

    // Fetch static details first and show immediately
    const staticRes = await fetch(`${API_BASE}/static-detail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(staticBody)
    });

    const staticData = await staticRes.json();
    const staticDurationMs = Math.round(performance.now() - startTime);
    
    console.log('API_STATIC_DETAIL_REQUEST', { duration: staticDurationMs, status: staticRes.status, ok: staticData.ok });
    
    // Track response time
    journeyResponseTimes.staticDetail = staticDurationMs;
    displayResponseTimes();

    // Show static content immediately
    if (staticData && staticData.ok !== false) {
      renderStaticDetailsOnly(staticData, staticDurationMs);
    }

    // Then fetch dynamic details
    const dynamicRes = await fetch(`${API_BASE}/dynamic-detail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dynamicBody)
    });

    const dynamicData = await dynamicRes.json();
    const durationMs = Math.round(performance.now() - startTime);
    
    console.log('API_DYNAMIC_DETAIL_REQUEST', { duration: durationMs, status: dynamicRes.status, ok: dynamicData.ok });
    
    // Track response time
    journeyResponseTimes.dynamicDetail = durationMs;
    displayResponseTimes();

    if (!dynamicRes.ok || dynamicData.ok === false) {
      errorBox.classList.remove("hidden");
      errorBox.querySelector(".message").textContent = "Failed to load room options.";
      const rawHtml = JSON.stringify(dynamicData, null, 2);
      const pre = errorBox.querySelector(".raw-error");
      pre.textContent = rawHtml;
      pre.classList.remove("hidden");
      return;
    }

    timerUI.innerHTML = formatDuration(durationMs);
    timerUI.classList.remove("hidden");

    // Combine static and dynamic data
    const combinedData = {
      ...dynamicData,
      staticDetails: staticData
    };

    // Store detail data globally for review requests
    window.globalDetailData = combinedData;
    // Also store the hotelId that was used for the detail request
    window.globalDetailData.requestedHotelId = hotelId;

    // SAVE STATE TO SESSIONSTORE FOR PAGE REFRESH
    const stateToSave = {
      page: 'detail',
      searchBody: globalSearchBody,
      detailData: combinedData,
      requestedHotelId: hotelId,
      requestedOptionId: optionId,
      timestamp: Date.now()
    };
    sessionStorage.setItem('tj_page_state', JSON.stringify(stateToSave));

    renderHotelDetails(combinedData);
  } catch (err) {
    errorBox.classList.remove("hidden");
    errorBox.querySelector(".message").textContent = err.message;
  }
}

// Image Zoom Functions
function openImageZoom(imageUrl) {
  const modal = document.createElement("div");
  modal.id = "image-zoom-modal";
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: fadeIn 0.3s ease-out;
    backdrop-filter: blur(10px);
  `;
  
  modal.innerHTML = `
    <div style="position: relative; max-width: 95vw; max-height: 95vh; display: flex; align-items: center; justify-content: center;">
      <img src="${imageUrl}" alt="Hotel" style="max-width: 100%; max-height: 95vh; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.5); animation: zoomIn 0.4s ease-out;">
      
      <!-- Close Button -->
      <button onclick="closeImageZoom()" style="position: absolute; top: -50px; right: -50px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border: none; border-radius: 50%; width: 50px; height: 50px; cursor: pointer; font-size: 1.5rem; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 16px rgba(239, 68, 68, 0.4); transition: all 0.3s ease; z-index: 10001;" onmouseover="this.style.transform='scale(1.1) rotate(90deg)'; this.style.boxShadow='0 6px 24px rgba(239, 68, 68, 0.6)';" onmouseout="this.style.transform='scale(1) rotate(0deg)'; this.style.boxShadow='0 4px 16px rgba(239, 68, 68, 0.4)';">
        <i class="ph ph-x" style="font-weight: bold;"></i>
      </button>
      
      <!-- Image Info Badge -->
      <div style="position: absolute; bottom: -60px; left: 50%; transform: translateX(-50%); background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); padding: 12px 24px; border-radius: 12px; font-size: 0.9rem; color: #334155; font-weight: 600; box-shadow: 0 4px 16px rgba(0,0,0,0.2); display: flex; align-items: center; gap: 10px;">
        <i class="ph ph-info" style="color: var(--primary); font-size: 1.1rem;"></i>
        Click outside or press ESC to close
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Close on click outside
  modal.onclick = (e) => {
    if (e.target === modal) closeImageZoom();
  };
  
  // Close on ESC key
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      closeImageZoom();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
  
  // Prevent body scroll
  document.body.style.overflow = 'hidden';
}

function closeImageZoom() {
  const modal = document.getElementById("image-zoom-modal");
  if (modal) {
    modal.style.animation = "fadeOut 0.3s ease-out";
    setTimeout(() => {
      modal.remove();
      document.body.style.overflow = '';
    }, 300);
  }
}

function renderStaticDetailsOnly(staticData, durationMs) {
  const header = document.getElementById("hotel-detail-header");
  const resultsContainer = document.getElementById("detail-results");
  const timerUI = document.getElementById("detail-timer");

  // Handle different response structures
  let staticInfo = null;
  
  if (staticData.data && typeof staticData.data === 'object') {
    staticInfo = staticData.data;
  } else if (staticData.hotel && typeof staticData.hotel === 'object') {
    staticInfo = staticData.hotel;
  } else if (staticData.tjHotelId || staticData.name || staticData.amenities) {
    staticInfo = staticData;
  }

  if (!staticInfo) return;

  // Update header with static info
  const name = staticInfo.name || "Hotel";
  const city = staticInfo.locale?.address?.city || "";
  const region = staticInfo.locale?.address?.region || "";
  const country = staticInfo.locale?.address?.country || "";
  const fullAddress = staticInfo.locale?.address?.fulladdr || "";
  const starRating = staticInfo.star_rating || 0;
  const propertyType = staticInfo.property_type?.name || staticInfo.property_type || "";
  
  // Build address display
  let addressDisplay = '';
  if (fullAddress) {
    addressDisplay = fullAddress;
  } else if (city || region || country) {
    const parts = [city, region, country].filter(Boolean);
    addressDisplay = parts.join(', ');
  }
  
  header.innerHTML = `
    <div style="animation: slideDown 0.6s ease-out;">
      <h2 class="hotel-name" style="font-size: 2.2rem; margin: 0 0 12px 0; font-weight: 700; background: linear-gradient(135deg, var(--primary) 0%, rgba(139, 92, 246, 0.8) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
        ${name}
      </h2>
      
      <div style="display: flex; align-items: flex-start; gap: 16px; margin-bottom: 16px; flex-wrap: wrap;">
        ${starRating ? `
          <div style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: white; padding: 8px 16px; border-radius: 12px; font-size: 1rem; font-weight: 600; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);">
            <i class="ph-fill ph-star"></i> ${starRating} Star Hotel
          </div>
        ` : ''}
        ${propertyType ? `
          <div style="background: linear-gradient(135deg, var(--primary) 0%, rgba(139, 92, 246, 0.8) 100%); color: white; padding: 8px 16px; border-radius: 12px; font-size: 1rem; font-weight: 600; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
            <i class="ph ph-building"></i> ${propertyType}
          </div>
        ` : ''}
      </div>
      
      ${addressDisplay ? `
        <div style="display: flex; align-items: flex-start; gap: 10px; padding: 16px; background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%); border-radius: 12px; border: 1px solid rgba(59, 130, 246, 0.15); margin-bottom: 16px;">
          <i class="ph ph-map-pin" style="font-size: 1.5rem; color: var(--primary); margin-top: 2px; flex-shrink: 0;"></i>
          <div>
            <div style="font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Address</div>
            <p style="margin: 0; color: #334155; font-size: 1rem; line-height: 1.5; font-weight: 500;">${addressDisplay}</p>
          </div>
        </div>
      ` : ''}
    </div>
  `;

  // Clear and prepare container - but preserve search criteria if it exists
  const existingSearchCriteria = resultsContainer.querySelector('#search-criteria-box');
  const searchCriteriaHtml = existingSearchCriteria ? existingSearchCriteria.outerHTML : '';
  
  resultsContainer.innerHTML = searchCriteriaHtml;

  // Build static content HTML
  let staticHTML = "";

  // Hero Gallery with animations - First image large, others small
  if (staticInfo.images && Array.isArray(staticInfo.images) && staticInfo.images.length > 0) {
    const validImages = [];
    staticInfo.images.forEach((img) => {
      let imageUrl = '';
      if (typeof img === 'string') {
        imageUrl = img;
      } else if (img && typeof img === 'object') {
        if (img.links?.original?.href) {
          imageUrl = img.links.original.href;
        } else if (img.url) {
          imageUrl = img.url;
        } else if (img.imageUrl) {
          imageUrl = img.imageUrl;
        }
      }
      if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim().length > 0) {
        validImages.push(imageUrl);
      }
    });

    if (validImages.length > 0) {
      window.galleryImages = validImages;
      
      staticHTML += `
        <div style="margin-bottom: 28px; animation: fadeInUp 0.8s ease-out;">
          <h3 style="margin: 0 0 16px 0; font-size: 1.2rem; display: flex; align-items: center; gap: 10px; font-weight: 700; color: var(--text-main);">
            <i class="ph ph-images" style="font-size: 1.4rem; color: var(--primary);"></i> 
            Hotel Gallery 
            <span style="font-size: 0.9rem; font-weight: 500; color: var(--text-muted);">(${validImages.length} photo${validImages.length !== 1 ? 's' : ''})</span>
          </h3>
          
          <!-- Main Image with Click to Zoom -->
          <div style="margin-bottom: 16px; position: relative;">
            <div class="gallery-main" data-idx="0" style="width: 100%; height: 400px; border-radius: 16px; overflow: hidden; cursor: pointer; border: 3px solid transparent; transition: all 0.3s ease; box-shadow: 0 8px 24px rgba(0,0,0,0.15); position: relative;" onmouseover="this.style.borderColor='var(--primary)'; this.style.transform='scale(1.01)'; this.querySelector('.zoom-overlay').style.opacity='1';" onmouseout="this.style.borderColor='transparent'; this.style.transform='scale(1)'; this.querySelector('.zoom-overlay').style.opacity='0';">
              <img id="main-gallery-image" src="${validImages[0]}" alt="Hotel main image" style="width: 100%; height: 100%; object-fit: cover;">
              <div class="zoom-overlay" style="position: absolute; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s ease;">
                <div style="background: white; color: var(--text-main); padding: 12px 24px; border-radius: 12px; font-weight: 600; font-size: 1rem; display: flex; align-items: center; gap: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.2);">
                  <i class="ph ph-magnifying-glass-plus" style="font-size: 1.3rem;"></i>
                  Click to view full size
                </div>
              </div>
            </div>
          </div>
          
          <!-- Thumbnail Grid -->
          ${validImages.length > 1 ? `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 12px; max-height: 240px; overflow-y: auto; padding: 12px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; border: 2px solid rgba(59, 130, 246, 0.1);">
              ${validImages.map((img, idx) => `
                <div class="gallery-thumb" data-idx="${idx}" style="aspect-ratio: 1; border-radius: 10px; overflow: hidden; cursor: pointer; border: 3px solid ${idx === 0 ? 'var(--primary)' : 'transparent'}; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.12); position: relative;" onmouseover="this.style.borderColor='var(--primary)'; this.style.transform='scale(1.08)'; this.style.boxShadow='0 8px 20px rgba(59, 130, 246, 0.3)'; this.querySelector('.thumb-overlay').style.opacity='1';" onmouseout="this.style.borderColor='${idx === 0 ? 'var(--primary)' : 'transparent'}'; this.style.transform='scale(1)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.12)'; this.querySelector('.thumb-overlay').style.opacity='0';">
                  <img src="${img}" alt="Hotel image ${idx + 1}" style="width: 100%; height: 100%; object-fit: cover;">
                  <div class="thumb-overlay" style="position: absolute; inset: 0; background: rgba(59, 130, 246, 0.2); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s ease;">
                    <i class="ph ph-eye" style="color: white; font-size: 1.5rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));"></i>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }
  }

  // About Section - More compact
  if (staticInfo.name || staticInfo.property_type) {
    staticHTML += `
      <div style="margin-bottom: 20px; animation: fadeInUp 0.8s ease-out 0.1s both;">
        <div style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.06) 0%, rgba(139, 92, 246, 0.06) 100%); border-radius: 12px; padding: 16px; border: 1px solid rgba(59, 130, 246, 0.15);">
          <h3 style="margin: 0 0 8px 0; font-size: 1.1rem; display: flex; align-items: center; gap: 8px; font-weight: 600;">
            <i class="ph ph-info" style="font-size: 1.3rem; color: var(--primary);"></i> About
          </h3>
          <p style="margin: 0 0 8px 0; color: var(--text-muted); line-height: 1.5; font-size: 0.9rem;">
            ${staticInfo.name}
          </p>
          ${staticInfo.property_type ? `
            <span style="display: inline-flex; align-items: center; gap: 6px; background: var(--primary); color: white; padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; font-weight: 500;">
              <i class="ph ph-building" style="font-size: 1rem;"></i> ${staticInfo.property_type.name || staticInfo.property_type}
            </span>
          ` : ''}
        </div>
      </div>
    `;
  }

  // Amenities Section - Simple and modern
  if (staticInfo.amenities && typeof staticInfo.amenities === 'object') {
    const amenitiesArray = Object.values(staticInfo.amenities);
    if (amenitiesArray.length > 0) {
      const uniqueAmenities = {};
      amenitiesArray.forEach(amenity => {
        const amenityText = typeof amenity === 'string' ? amenity : (amenity.name || amenity.id);
        if (amenityText) uniqueAmenities[amenityText] = true;
      });
      
      const amenityList = Object.keys(uniqueAmenities);
      const showCount = 8;
      const hasMore = amenityList.length > showCount;
      
      staticHTML += `
        <div style="margin-bottom: 20px; animation: fadeInUp 0.8s ease-out 0.2s both;">
          <h3 style="margin: 0 0 10px 0; font-size: 1.1rem; display: flex; align-items: center; gap: 8px; font-weight: 600;">
            <i class="ph ph-sparkle" style="font-size: 1.3rem; color: var(--primary);"></i> Amenities
          </h3>
          <div id="amenities-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px;">
            ${amenityList.slice(0, showCount).map((amenity, idx) => `
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; color: #475569; padding: 8px 12px; border-radius: 8px; display: flex; align-items: center; gap: 6px; font-size: 0.8rem; font-weight: 500; transition: all 0.3s ease;" onmouseover="this.style.background='#f1f5f9'; this.style.borderColor='var(--primary)'; this.style.transform='translateY(-1px)';" onmouseout="this.style.background='#f8fafc'; this.style.borderColor='#e2e8f0'; this.style.transform='translateY(0)';">
                <i class="ph ph-check-circle" style="font-size: 1rem; color: #10b981;"></i>
                <span>${amenity}</span>
              </div>
            `).join('')}
          </div>
          ${hasMore ? `
            <div style="margin-top: 12px;">
              <button id="show-more-amenities" onclick="toggleAmenities()" style="background: white; border: 1px solid #e2e8f0; color: #475569; padding: 8px 16px; border-radius: 8px; font-size: 0.85rem; font-weight: 500; cursor: pointer; transition: all 0.3s ease;" onmouseover="this.style.background='#f8fafc'; this.style.borderColor='var(--primary)'; this.style.color='var(--primary)';" onmouseout="this.style.background='white'; this.style.borderColor='#e2e8f0'; this.style.color='#475569';">
                <i class="ph ph-plus"></i> Show ${amenityList.length - showCount} more amenities
              </button>
            </div>
            <div id="hidden-amenities" style="display: none; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; margin-top: 8px;">
              ${amenityList.slice(showCount).map((amenity, idx) => `
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; color: #475569; padding: 8px 12px; border-radius: 8px; display: flex; align-items: center; gap: 6px; font-size: 0.8rem; font-weight: 500; transition: all 0.3s ease;" onmouseover="this.style.background='#f1f5f9'; this.style.borderColor='var(--primary)'; this.style.transform='translateY(-1px)';" onmouseout="this.style.background='#f8fafc'; this.style.borderColor='#e2e8f0'; this.style.transform='translateY(0)';">
                  <i class="ph ph-check-circle" style="font-size: 1rem; color: #10b981;"></i>
                  <span>${amenity}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;
      
      // Store amenity data globally for the toggle function
      window.amenityData = { total: amenityList.length, showCount };
    }
  }

  // Contact Info Section - Simple and modern
  if (staticInfo.locale) {
    const addr = staticInfo.locale.address || {};
    staticHTML += `
      <div style="margin-bottom: 20px; animation: fadeInUp 0.8s ease-out 0.3s both;">
        <h3 style="margin: 0 0 10px 0; font-size: 1.1rem; display: flex; align-items: center; gap: 8px; font-weight: 600;">
          <i class="ph ph-map-pin" style="font-size: 1.3rem; color: var(--primary);"></i> Location
        </h3>
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
          ${addr.fulladdr ? `
            <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9;">
              <div style="font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Address</div>
              <p style="margin: 0; color: #334155; font-size: 0.9rem; line-height: 1.4;">${addr.fulladdr}</p>
            </div>
          ` : ''}
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px;">
            ${addr.city ? `
              <div style="padding: 8px; background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 8px;">
                <div style="font-size: 0.7rem; color: #64748b; font-weight: 600; text-transform: uppercase; margin-bottom: 2px;">City</div>
                <div style="font-size: 0.85rem; font-weight: 500; color: #334155;">${addr.city}</div>
              </div>
            ` : ''}
            ${addr.region ? `
              <div style="padding: 8px; background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 8px;">
                <div style="font-size: 0.7rem; color: #64748b; font-weight: 600; text-transform: uppercase; margin-bottom: 2px;">Region</div>
                <div style="font-size: 0.85rem; font-weight: 500; color: #334155;">${addr.region}</div>
              </div>
            ` : ''}
            ${staticInfo.locale.coordinates ? `
              <div style="padding: 8px; background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 8px;">
                <div style="font-size: 0.7rem; color: #64748b; font-weight: 600; text-transform: uppercase; margin-bottom: 2px;">Coordinates</div>
                <div style="font-size: 0.8rem; font-weight: 500; color: #334155;">${staticInfo.locale.coordinates.lat}, ${staticInfo.locale.coordinates.long}</div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  // Policies Section - Simple and modern
  if (staticInfo.policies?.checkInCheckOut) {
    const policy = staticInfo.policies.checkInCheckOut;
    staticHTML += `
      <div style="margin-bottom: 20px; animation: fadeInUp 0.8s ease-out 0.4s both;">
        <h3 style="margin: 0 0 10px 0; font-size: 1.1rem; display: flex; align-items: center; gap: 8px; font-weight: 600;">
          <i class="ph ph-clock" style="font-size: 1.3rem; color: var(--primary);"></i> Check-in & Check-out
        </h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px;">
          <!-- Check-in Card -->
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; transition: all 0.3s ease;" onmouseover="this.style.borderColor='#3b82f6'; this.style.boxShadow='0 4px 12px rgba(59, 130, 246, 0.1)';" onmouseout="this.style.borderColor='#e2e8f0'; this.style.boxShadow='none';">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
              <i class="ph ph-sign-in" style="font-size: 1rem; color: #3b82f6;"></i>
              <div style="font-size: 0.7rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Check-in</div>
            </div>
            <div style="font-size: 1.1rem; font-weight: 600; color: #334155; margin-bottom: 2px;">${policy.checkin_from || 'N/A'}</div>
            ${policy.checkin_till ? `<div style="font-size: 0.7rem; color: #64748b;">Until ${policy.checkin_till}</div>` : ''}
            ${policy.checkin_min_age ? `<div style="font-size: 0.65rem; color: #64748b; margin-top: 4px; padding-top: 4px; border-top: 1px solid #f1f5f9;">Min Age: ${policy.checkin_min_age} years</div>` : ''}
          </div>
          
          <!-- Check-out Card -->
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; transition: all 0.3s ease;" onmouseover="this.style.borderColor='#f59e0b'; this.style.boxShadow='0 4px 12px rgba(245, 158, 11, 0.1)';" onmouseout="this.style.borderColor='#e2e8f0'; this.style.boxShadow='none';">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
              <i class="ph ph-sign-out" style="font-size: 1rem; color: #f59e0b;"></i>
              <div style="font-size: 0.7rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Check-out</div>
            </div>
            <div style="font-size: 1.1rem; font-weight: 600; color: #334155; margin-bottom: 2px;">${policy.checkout_from || 'N/A'}</div>
            <div style="font-size: 0.7rem; color: #64748b;">Before this time</div>
          </div>
        </div>
      </div>
    `;
  }

  // Add gallery click handlers
  const staticDiv = document.createElement("div");
  staticDiv.innerHTML = staticHTML;
  resultsContainer.appendChild(staticDiv);

  // Add click handlers for main image and thumbnails
  const mainImage = staticDiv.querySelector('.gallery-main');
  if (mainImage) {
    mainImage.addEventListener('click', function() {
      const idx = parseInt(this.getAttribute('data-idx'), 10);
      if (window.galleryImages && window.galleryImages[idx]) {
        openImageZoom(window.galleryImages[idx]);
      }
    });
  }

  const thumbs = staticDiv.querySelectorAll('.gallery-thumb');
  thumbs.forEach(thumb => {
    thumb.addEventListener('click', function() {
      const idx = parseInt(this.getAttribute('data-idx'), 10);
      if (window.galleryImages && window.galleryImages[idx]) {
        // Update main image
        const mainImg = document.getElementById('main-gallery-image');
        if (mainImg) {
          mainImg.src = window.galleryImages[idx];
          // Update main image data-idx
          const mainContainer = mainImg.parentElement;
          if (mainContainer) {
            mainContainer.setAttribute('data-idx', idx);
          }
        }
        
        // Update thumbnail borders
        thumbs.forEach((t, i) => {
          t.style.borderColor = i === idx ? 'var(--primary)' : 'transparent';
        });
        
        // Open zoom
        openImageZoom(window.galleryImages[idx]);
      }
    });
  });

  // Add loading indicator for room details
  resultsContainer.innerHTML += `
    <div style="margin-top: 48px; margin-bottom: 32px; animation: fadeInUp 0.8s ease-out 0.6s both;">
      <div style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%); border-radius: 16px; padding: 32px; border: 2px dashed rgba(59, 130, 246, 0.3); text-align: center;">
        <div style="display: flex; justify-content: center; margin-bottom: 16px;">
          <div style="width: 50px; height: 50px; border: 4px solid rgba(59, 130, 246, 0.2); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite;"></div>
        </div>
        <h3 style="margin: 0 0 8px 0; font-size: 1.2rem; font-weight: 700; color: var(--text-main);">
          <i class="ph ph-bed" style="margin-right: 8px; color: var(--primary);"></i> Loading Room Options
        </h3>
        <p style="margin: 0; color: var(--text-muted); font-size: 1rem;">
          We're fetching the best room options for you. Please wait...
        </p>
        <div style="margin-top: 16px; display: flex; justify-content: center; gap: 6px;">
          <div style="width: 8px; height: 8px; background: var(--primary); border-radius: 50%; animation: pulse 1.5s ease-in-out infinite;"></div>
          <div style="width: 8px; height: 8px; background: var(--primary); border-radius: 50%; animation: pulse 1.5s ease-in-out infinite 0.3s;"></div>
          <div style="width: 8px; height: 8px; background: var(--primary); border-radius: 50%; animation: pulse 1.5s ease-in-out infinite 0.6s;"></div>
        </div>
      </div>
    </div>
  `;

  timerUI.innerHTML = formatDuration(durationMs);
  timerUI.classList.remove("hidden");
}

function renderHotelDetails(data) {
  const resultsContainer = document.getElementById("detail-results");

  // Extract hotel data
  let hotel;
  if (data.hotelId || data.hotelName || data.options) hotel = data;
  else if (data.hotel && !Array.isArray(data.hotel)) hotel = data.hotel;
  else if (data.hotel && Array.isArray(data.hotel)) hotel = data.hotel[0];
  else if (data.hotels && Array.isArray(data.hotels)) hotel = data.hotels[0];

  if (!hotel) {
    resultsContainer.innerHTML += `<div class="empty-state"><i class="ph ph-warning-circle"></i><p>No details found for this hotel.</p></div>`;
    return;
  }

  // Remove loading indicator
  const loadingDiv = resultsContainer.querySelector('[style*="dashed"]');
  if (loadingDiv) {
    loadingDiv.parentElement.remove();
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

  if (!hotel.options || hotel.options.length === 0) {
    document.getElementById("detail-room-count").textContent = "(0 Total)";
    resultsContainer.innerHTML += `<div class="empty-state"><i class="ph ph-bed"></i><p>No room options currently available.</p></div>`;
    return;
  }

  document.getElementById("detail-room-count").textContent = `(${hotel.options.length} Total)`;

  // Add room options section header with welcoming message and filters
  resultsContainer.innerHTML += `
    <div style="margin-top: 40px; margin-bottom: 28px; animation: fadeInUp 0.8s ease-out both;">
      <div style="display: flex; justify-content: space-between; width: 100%; align-items: center; margin-bottom: 20px; padding: 20px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 16px; border: 1px solid rgba(59, 130, 246, 0.2);">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem; box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3);">
            <i class="ph ph-check-circle"></i>
          </div>
          <div>
            <h3 style="margin: 0; font-size: 1.4rem; font-weight: 700; color: #1e293b;">Excellent! We Found ${hotel.options.length} Room Option${hotel.options.length !== 1 ? 's' : ''}</h3>
            <p style="margin: 4px 0 0 0; color: #64748b; font-size: 1rem; line-height: 1.5;">Book this hotel and enjoy your trip! All room types are available for your perfect stay.</p>
          </div>
        </div>
        <div style="text-align: center; padding: 0 20px;">
          <div style="background: linear-gradient(135deg, var(--primary) 0%, rgba(139, 92, 246, 0.8) 100%); color: white; padding: 12px 24px; border-radius: 12px; font-size: 0.9rem; font-weight: 600; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3); margin-bottom: 8px;">
            <i class="ph ph-heart" style="margin-right: 6px;"></i> Ready to Book?
          </div>
          <p style="margin: 0; font-size: 0.85rem; color: #64748b; font-weight: 500;">Please review and book your preferred room</p>
        </div>
      </div>
      
      <!-- Filter Section -->
      <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
          <i class="ph ph-funnel" style="font-size: 1.2rem; color: var(--primary);"></i>
          <h4 style="margin: 0; font-size: 1rem; font-weight: 600; color: var(--text-main);">Filter Room Options</h4>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
          <!-- Room Name Filter -->
          <div>
            <label style="display: block; font-size: 0.8rem; font-weight: 500; color: #64748b; margin-bottom: 4px;">Room Name / ID</label>
            <input type="text" id="filter-room-name" placeholder="Search rooms..." style="width: 100%; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.85rem; transition: all 0.3s ease;" onkeyup="applyRoomFilters()" onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='#e2e8f0'">
          </div>
          
          <!-- Meal Filter -->
          <div>
            <label style="display: block; font-size: 0.8rem; font-weight: 500; color: #64748b; margin-bottom: 4px;">Meal Plan</label>
            <select id="filter-meal" style="width: 100%; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.85rem; transition: all 0.3s ease;" onchange="applyRoomFilters()" onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='#e2e8f0'">
              <option value="">All Meal Plans</option>
              <option value="room only">Room Only</option>
              <option value="breakfast">Breakfast</option>
              <option value="half board">Half Board</option>
              <option value="full board">Full Board</option>
              <option value="all inclusive">All Inclusive</option>
            </select>
          </div>
          
          <!-- GST Filter -->
          <div>
            <label style="display: block; font-size: 0.8rem; font-weight: 500; color: #64748b; margin-bottom: 4px;">GST Type</label>
            <select id="filter-gst" style="width: 100%; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.85rem; transition: all 0.3s ease;" onchange="applyRoomFilters()" onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='#e2e8f0'">
              <option value="">All GST Types</option>
              <option value="igst">IGST</option>
              <option value="cgst">CGST</option>
              <option value="sgst">SGST</option>
              <option value="na">No GST</option>
            </select>
          </div>
          
          <!-- Refund Filter -->
          <div>
            <label style="display: block; font-size: 0.8rem; font-weight: 500; color: #64748b; margin-bottom: 4px;">Refundable</label>
            <select id="filter-refund" style="width: 100%; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.85rem; transition: all 0.3s ease;" onchange="applyRoomFilters()" onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='#e2e8f0'">
              <option value="">All Types</option>
              <option value="true">Refundable</option>
              <option value="false">Non-Refundable</option>
            </select>
          </div>
          
          <!-- PAN Filter -->
          <div>
            <label style="display: block; font-size: 0.8rem; font-weight: 500; color: #64748b; margin-bottom: 4px;">PAN Required</label>
            <select id="filter-pan" style="width: 100%; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.85rem; transition: all 0.3s ease;" onchange="applyRoomFilters()" onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='#e2e8f0'">
              <option value="">All</option>
              <option value="true">Required</option>
              <option value="false">Not Required</option>
            </select>
          </div>
          
          <!-- Passport Filter -->
          <div>
            <label style="display: block; font-size: 0.8rem; font-weight: 500; color: #64748b; margin-bottom: 4px;">Passport Required</label>
            <select id="filter-passport" style="width: 100%; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.85rem; transition: all 0.3s ease;" onchange="applyRoomFilters()" onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='#e2e8f0'">
              <option value="">All</option>
              <option value="true">Required</option>
              <option value="false">Not Required</option>
            </select>
          </div>
          
          <!-- Price Sort Filter -->
          <div>
            <label style="display: block; font-size: 0.8rem; font-weight: 500; color: #64748b; margin-bottom: 4px;">Sort by Price</label>
            <select id="filter-price" style="width: 100%; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.85rem; transition: all 0.3s ease;" onchange="applyRoomFilters()" onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='#e2e8f0'">
              <option value="">Default Order</option>
              <option value="low-high">Price: Low to High</option>
              <option value="high-low">Price: High to Low</option>
            </select>
          </div>
          
          <!-- Clear Filters Button -->
          <div style="display: flex; align-items: end;">
            <button onclick="clearRoomFilters()" style="width: 100%; padding: 8px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.85rem; font-weight: 500; color: #64748b; cursor: pointer; transition: all 0.3s ease;" onmouseover="this.style.background='#f1f5f9'; this.style.borderColor='var(--primary)'; this.style.color='var(--primary)'" onmouseout="this.style.background='#f8fafc'; this.style.borderColor='#e2e8f0'; this.style.color='#64748b'">
              <i class="ph ph-x"></i> Clear Filters
            </button>
          </div>
        </div>
      </div>
      
      <div style="height: 2px; background: linear-gradient(90deg, var(--primary) 0%, transparent 100%); border-radius: 1px;"></div>
    </div>
  `;

  // Reset filter inputs
  document.getElementById("filter-room-name").value = "";
  document.getElementById("filter-meal").value = "";
  document.getElementById("filter-gst").value = "";
  document.getElementById("filter-refund").value = "";
  document.getElementById("filter-pan").value = "";
  document.getElementById("filter-passport").value = "";
  document.getElementById("filter-price").value = "";

  // Render each option as a card
  hotel.options.forEach((option, idx) => {
    const card = document.createElement("div");
    card.className = "hotel-card detail-option-card fade-in";
    card.style.animation = `slideUp 0.5s ease-out ${0.5 + idx * 0.08}s both`;

    const roomNames = option.roomInfo?.map(r => `<i class="ph ph-bed"></i> ${r.name} ${r.id ? `<span class="hotel-id-badge" style="font-size:0.7rem; margin-left:6px; background:rgba(255,255,255,0.6);"><i class="ph ph-identification-badge"></i> ID: ${r.id}</span>` : ''}`).join("<br>") ?? '<i class="ph ph-bed"></i> Standard Room';
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
    if (isRefundable) {
      // Show green refundable box with table
      let freeTillDate = "Check-in";
      if (option.cancellation?.freeCancellationUntil) {
        freeTillDate = new Date(option.cancellation.freeCancellationUntil).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      } else if (option.cancellation?.penalties?.length > 0 && option.cancellation.penalties[0]?.from) {
        freeTillDate = new Date(option.cancellation.penalties[0].from).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      }
      
      penaltiesHtml = `
        <div style="margin-top: 12px; background: #dcfce7; border: 2px solid #bbf7d0; border-radius: 8px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); padding: 12px 14px; border-bottom: 2px solid #bbf7d0;">
            <div style="font-size: 0.8rem; font-weight: 700; color: #166534; display: flex; align-items: center; gap: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
              <i class="ph ph-check-circle"></i> Fully Refundable - Free Cancellation
            </div>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #d1fae5;">
                <th style="padding: 10px 12px; text-align: left; font-size: 0.75rem; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">Cancellation Status</th>
                <th style="padding: 10px 12px; text-align: left; font-size: 0.75rem; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">Free Till Date</th>
                <th style="padding: 10px 12px; text-align: left; font-size: 0.75rem; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">Penalty Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #bbf7d0;">
                <td style="padding: 10px 12px; font-size: 0.85rem; color: #166534; font-weight: 600;"><i class="ph ph-check-circle" style="color: #10b981; margin-right: 6px;"></i>Free Cancellation</td>
                <td style="padding: 10px 12px; font-size: 0.85rem; color: #166534;">${freeTillDate}</td>
                <td style="padding: 10px 12px; font-size: 0.85rem; font-weight: 700; color: #10b981;">Free</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    } else if (option.cancellation?.penalties?.length > 0) {
      // Show red non-refundable box with penalties table
      const penaltyRows = option.cancellation.penalties.map(p => {
        const fromDate = p.from ? new Date(p.from).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "";
        const toDate = p.to ? new Date(p.to).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "";
        return `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 12px; font-size: 0.8rem; color: #475569;">${fromDate || 'Now'}</td>
            <td style="padding: 8px 12px; font-size: 0.8rem; color: #475569;">${toDate || 'Check-in'}</td>
            <td style="padding: 8px 12px; font-size: 0.8rem; font-weight: 600; color: #dc2626;">${currency} ${p.amount.toFixed(2)}</td>
          </tr>
        `;
      }).join("");
      
      penaltiesHtml = `
        <div style="margin-top: 12px; background: #fef2f2; border: 2px solid #fecaca; border-radius: 8px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); padding: 12px 14px; border-bottom: 2px solid #fecaca;">
            <div style="font-size: 0.8rem; font-weight: 700; color: #991b1b; display: flex; align-items: center; gap: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
              <i class="ph ph-warning-circle"></i> Non-Refundable - Cancellation Penalties
            </div>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #fef2f2;">
                <th style="padding: 10px 12px; text-align: left; font-size: 0.75rem; font-weight: 700; color: #991b1b; text-transform: uppercase; letter-spacing: 0.5px;">From Date</th>
                <th style="padding: 10px 12px; text-align: left; font-size: 0.75rem; font-weight: 700; color: #991b1b; text-transform: uppercase; letter-spacing: 0.5px;">To Date</th>
                <th style="padding: 10px 12px; text-align: left; font-size: 0.75rem; font-weight: 700; color: #991b1b; text-transform: uppercase; letter-spacing: 0.5px;">Penalty Amount</th>
              </tr>
            </thead>
            <tbody>
              ${penaltyRows}
            </tbody>
          </table>
        </div>
      `;
    }

    card.dataset.roomName = roomNames.replace(/(<([^>]+)>)/gi, "").toLowerCase();
    card.dataset.optionId = option.optionId.toLowerCase();
    card.dataset.roomId = roomIdsString;
    card.dataset.meal = mealBasis.toLowerCase();
    card.dataset.gst = gstType.toLowerCase();
    card.dataset.refundable = isRefundable ? "true" : "false";
    card.dataset.pan = option.compliance?.panRequired ? "true" : "false";
    card.dataset.price = totalPrice;

    const refundPill = isRefundable
      ? `<span style="background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 500; display: inline-flex; align-items: center; gap: 4px;"><i class="ph ph-check-circle"></i> Refundable</span>`
      : `<span style="background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 500; display: inline-flex; align-items: center; gap: 4px;"><i class="ph ph-x-circle"></i> Non-Refundable</span>`;

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
        </div>

        <button class="btn-premium" onclick="reviewRoom('${option.optionId}', '${data.correlationId}', ${option.pricing?.totalPrice ?? 0})">
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

  let cards = Array.from(document.querySelectorAll(".detail-option-card"));
  let visibleCount = 0;

  // Filter cards
  cards = cards.filter(card => {
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
    
    return isMatch;
  });

  // Sort by price if selected
  if (priceSort === "low_to_high") {
    cards.sort((a, b) => parseFloat(a.dataset.price) - parseFloat(b.dataset.price));
  } else if (priceSort === "high_to_low") {
    cards.sort((a, b) => parseFloat(b.dataset.price) - parseFloat(a.dataset.price));
  }

  // Re-append sorted cards
  const resultsContainer = document.getElementById("detail-results");
  cards.forEach(card => {
    resultsContainer.appendChild(card);
  });

  const countSpan = document.getElementById("detail-room-count");
  if (countSpan) {
    const totalCards = document.querySelectorAll(".detail-option-card").length;
    countSpan.textContent = `(${visibleCount} Visible / ${totalCards} Total)`;
  }

  // Handle empty block
  let existingEmpty = document.getElementById("d-filter-empty");
  if (visibleCount === 0) {
    if (!existingEmpty) {
      const emptyState = document.createElement("div");
      emptyState.id = "d-filter-empty";
      emptyState.className = "empty-state";
      emptyState.style.width = "100%";
      emptyState.innerHTML = `<i class="ph ph-funnel-x" style="font-size:3rem; color: #cbd5e1; margin-bottom:12px;"></i><p>Sorry, no room options available for this filter constraint. Please try another combination.</p>`;
      resultsContainer.appendChild(emptyState);
    }
  } else if (existingEmpty) {
    existingEmpty.remove();
  }
}

async function reviewRoom(optionId, correlationId, searchDisplayPrice) {
  // Store the price shown in search results for comparison
  window._searchDisplayPrice = searchDisplayPrice ?? null;
  // Update URL
  if (window.location.pathname !== '/ui/review') {
    history.pushState({ view: 'review' }, '', '/ui/review');
  }

  try {
    const config = getConfigPayload();
    const currency = globalSearchBody?.currency || "INR";
    const body = { 
      optionId, 
      correlationId, 
      currency, 
      env: config.env, 
      apiKey: config.apiKey 
    };

    // Extract hotelId and reviewHash from global detail data
    if (window.globalDetailData) {
      const detailData = window.globalDetailData;
      
      // Try to get hotelId from various possible locations in the response
      const hotelId = detailData.hotelId || 
                     detailData.hotel?.hotelId || 
                     detailData.hotel?.id ||
                     detailData.hid ||
                     detailData.requestedHotelId ||
                     (detailData.hotels && detailData.hotels[0]?.hotelId);
      
      if (hotelId) {
        body.hotelId = hotelId;
      }

      // Try to get reviewHash from various possible locations in the response
      const reviewHash = detailData.reviewHash || 
                        detailData.hotel?.reviewHash ||
                        detailData.hash ||
                        detailData.review_hash;
      
      if (reviewHash) {
        body.reviewHash = reviewHash;
      }
    }

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
    
    console.log('API_REVIEW_REQUEST', { duration: responseMs, status: res.status, ok: data.ok });
    
    // Track response time
    journeyResponseTimes.review = responseMs;
    displayResponseTimes();
    
    if (!res.ok || data.ok === false) {
      renderReviewError(data.reason || "Review failed. Please check API configuration or response.", data);
      return;
    }

    renderReviewDetails(data, responseMs);
  } catch (err) {
    renderReviewError("Unexpected error while reviewing room.", err.message);
  }
}

function switchToReviewPage() {
  const detailPage = document.getElementById("detail-page");
  const reviewPage = document.getElementById("review-page");
  const reviewContent = document.getElementById("review-content");

  if (detailPage) {
    detailPage.classList.remove("fade-in");
    detailPage.classList.add("hidden");
  }
  if (reviewPage) {
    reviewPage.classList.remove("hidden");
    reviewPage.classList.add("fade-in");
  }

  if (reviewContent) {
    // Add search criteria display to review page
    let searchCriteriaHtml = '';
    if (globalSearchBody) {
      searchCriteriaHtml = generateSearchCriteriaDisplay(globalSearchBody, globalSearchBody.location, false);
    }
    
    reviewContent.innerHTML = searchCriteriaHtml + `
        <div class="empty-state">
          <div class="loader" style="margin-bottom: 16px; border-color: var(--primary); border-top-color: transparent; width: 30px; height: 30px;"></div>
          <p>Fetching review details and current pricing...</p>
        </div>
     `;
  }

  // Update URL
  if (window.location.pathname !== '/ui/review') {
    history.pushState({ view: 'review' }, '', '/ui/review');
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

  // Back to Detail URL
  if (window.location.pathname !== '/ui/detail') {
    history.pushState({ view: 'detail' }, '', '/ui/detail');
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
  if (!container) {
    return;
  }

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
  if (isRefundable) {
    // Show green refundable box with table
    let freeTillDate = "Check-in";
    if (option.cancellation?.freeCancellationUntil) {
      freeTillDate = new Date(option.cancellation.freeCancellationUntil).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } else if (option.cancellation?.penalties?.length > 0 && option.cancellation.penalties[0]?.from) {
      freeTillDate = new Date(option.cancellation.penalties[0].from).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    
    penaltiesHtml = `
      <div style="margin-top:16px; background:linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border:2px solid #bbf7d0; border-radius:12px; padding:16px; overflow:hidden;">
        <div style="font-size:0.9rem; font-weight:700; color:#166534; margin-bottom:12px; text-transform:uppercase; letter-spacing:0.5px; display:flex; align-items:center; gap:8px;">
          <i class="ph ph-check-circle"></i> Fully Refundable - Free Cancellation
        </div>
        <table style="width:100%; border-collapse:collapse;">
          <thead>
            <tr style="background:#d1fae5; border-bottom:2px solid #bbf7d0;">
              <th style="padding:10px 12px; text-align:left; font-size:0.75rem; font-weight:700; color:#166534; text-transform:uppercase; letter-spacing:0.5px;">Cancellation Status</th>
              <th style="padding:10px 12px; text-align:left; font-size:0.75rem; font-weight:700; color:#166534; text-transform:uppercase; letter-spacing:0.5px;">Free Till Date</th>
              <th style="padding:10px 12px; text-align:left; font-size:0.75rem; font-weight:700; color:#166534; text-transform:uppercase; letter-spacing:0.5px;">Penalty Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom:1px solid #bbf7d0;">
              <td style="padding:10px 12px; font-size:0.85rem; color:#166534; font-weight:600;"><i class="ph ph-check-circle" style="color:#10b981; margin-right:6px;"></i>Free Cancellation</td>
              <td style="padding:10px 12px; font-size:0.85rem; color:#166534;">${freeTillDate}</td>
              <td style="padding:10px 12px; font-size:0.85rem; font-weight:700; color:#10b981;">Free</td>
            </tr>
          </tbody>
        </table>
      </div>`;
  } else if (option.cancellation?.penalties?.length > 0) {
    // Show red non-refundable box with penalties table
    penaltiesHtml = `
      <div style="margin-top:16px; background:linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border:2px solid #fecaca; border-radius:12px; padding:16px; overflow:hidden;">
        <div style="font-size:0.9rem; font-weight:700; color:#991b1b; margin-bottom:12px; text-transform:uppercase; letter-spacing:0.5px; display:flex; align-items:center; gap:8px;">
          <i class="ph ph-warning-circle"></i> Non-Refundable - Cancellation Penalties
        </div>
        <table style="width:100%; border-collapse:collapse;">
          <thead>
            <tr style="background:#fef2f2; border-bottom:2px solid #fecaca;">
              <th style="padding:10px 12px; text-align:left; font-size:0.75rem; font-weight:700; color:#991b1b; text-transform:uppercase; letter-spacing:0.5px;">From Date</th>
              <th style="padding:10px 12px; text-align:left; font-size:0.75rem; font-weight:700; color:#991b1b; text-transform:uppercase; letter-spacing:0.5px;">To Date</th>
              <th style="padding:10px 12px; text-align:left; font-size:0.75rem; font-weight:700; color:#991b1b; text-transform:uppercase; letter-spacing:0.5px;">Penalty Amount</th>
            </tr>
          </thead>
          <tbody>
            ${option.cancellation.penalties.map(p => {
              const fromDate = p.from ? new Date(p.from).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Now';
              const toDate = p.to ? new Date(p.to).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Check-in';
              return `<tr style="border-bottom:1px solid #fecaca;">
                <td style="padding:10px 12px; font-size:0.85rem; color:#7f1d1d;">${fromDate}</td>
                <td style="padding:10px 12px; font-size:0.85rem; color:#7f1d1d;">${toDate}</td>
                <td style="padding:10px 12px; font-size:0.85rem; font-weight:700; color:#dc2626;">${currency} ${p.amount.toFixed(2)}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
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
    <!-- Search Criteria Display -->
    ${globalSearchBody ? generateSearchCriteriaDisplay(globalSearchBody, globalSearchBody.location, false) : ''}
    
    ${timingBadge}
    ${priceAlert}
    
    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 24px;">
      
      <!-- Left Column: Hotel & Room Info -->
      <div style="flex: 1; min-width: 300px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
           <div class="logo-circle" style="width: 48px; height: 48px; font-size: 1.2rem; background: var(--primary); color: white;"><i class="ph ph-buildings"></i></div>
           <div>
             <h3 style="margin: 0; font-size: 1.4rem; color: var(--text-main);">${hotelName || 'Selected Hotel'}</h3>
             <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px; display:flex; gap: 12px;">
               <span><i class="ph ph-hash"></i> Hotel ID: <strong>${hotelId || 'N/A'}</strong></span>
               <span><i class="ph ph-briefcase"></i> Booking ID: <strong style="color:var(--primary);">${bookingId || 'N/A'}</strong></span>
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
          
          <div style="display:flex; justify-content:space-between; align-items: center; margin-bottom: 24px;">
            <span style="font-size: 1.1rem; font-weight: 600; color: var(--text-dark);">Total Price</span>
            <span style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">${currency} ${totalPrice}</span>
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

  // SAVE STATE TO SESSIONSTORE FOR PAGE REFRESH
  const stateToSave = {
    page: 'review',
    searchBody: globalSearchBody,
    reviewData: data,
    responseMs: responseMs,
    requestedOptionId: option?.id,
    requestedCorrelationId: correlationId,
    timestamp: Date.now()
  };
  sessionStorage.setItem('tj_page_state', JSON.stringify(stateToSave));
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
      responseTimes: journeyResponseTimes,
    };

    if (bookingType === 'VOUCHER' && amount !== null) {
      body.amount = amount;
    }

    const t0 = performance.now();
    const res = await fetch(`${API_BASE}/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    const responseMs = Math.round(performance.now() - t0);
    
    console.log('API_BOOKING_REQUEST', { duration: responseMs, status: res.status, ok: data.ok });
    
    // Track response time
    journeyResponseTimes.book = responseMs;
    displayResponseTimes();
    
    if (!bookingEl) return;

    const typeLabel = bookingType === 'HOLD' ? 'Hold' : 'Voucher';
    if (!res.ok || data.ok === false) {
      bookingEl.innerHTML = `
        <div class="alert-box error fade-in">
          <i class="ph ph-warning-circle"></i>
          <span class="message">${typeLabel} booking failed: ${data.reason || data.message || "Check response"}</span>
        </div>
        <pre style="margin-top:12px; font-size:0.78rem; background:#fdf2f2; padding:10px; border-radius:8px; overflow-x:auto;">${JSON.stringify(data, null, 2)}</pre>`;
      return;
    }

    const successColor = bookingType === 'HOLD' ? '#4338ca' : '#16a34a';
    const successIcon = bookingType === 'HOLD' ? 'ph-clock-countdown' : 'ph-check-circle';
    const successTitle = bookingType === 'HOLD' ? 'Hold Placed Successfully!' : 'Congratulations! Booking Created Successfully';
    const successMsg = bookingType === 'HOLD' ? 'Your hold has been placed' : 'Your booking has been confirmed';
    
    bookingEl.innerHTML = `
      <div class="alert-box success fade-in" style="border-color:${successColor}; background:${successColor}11; flex-direction: column; align-items: flex-start; gap: 16px;">
        <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
          <i class="ph ${successIcon}" style="color:${successColor}; font-size: 1.4rem;"></i>
          <div>
            <div style="color:${successColor}; font-weight: 700; font-size: 1.1rem;">${successTitle}</div>
            <div style="color:${successColor}; font-size: 0.9rem; margin-top: 4px;">${successMsg}</div>
          </div>
        </div>
        
        <div style="width: 100%; background: rgba(255,255,255,0.5); border-radius: 12px; padding: 12px; margin-top: 8px;">
          <div style="font-size: 0.85rem; color: #666; margin-bottom: 8px;"><strong>Booking ID:</strong> ${data.bookingId || bookingId}</div>
          <div style="font-size: 0.85rem; color: #666;"><strong>Status:</strong> ${data.status || 'Confirmed'}</div>
        </div>
        
        <button onclick="viewBookingDetail('${data.bookingId || bookingId}')" style="width: 100%; padding: 12px 16px; background: linear-gradient(135deg, ${successColor} 0%, ${successColor}dd 100%); color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s ease; font-size: 0.95rem;">
          <i class="ph ph-arrow-right"></i> View Booking Details
        </button>
      </div>
      <pre style="margin-top:12px; font-size:0.78rem; background:#f8faff; padding:10px; border-radius:8px; overflow-x:auto;">${JSON.stringify(data, null, 2)}</pre>`;
  } catch (err) {
    if (!bookingEl) return;
    bookingEl.innerHTML = `
      <div class="alert-box error fade-in">
        <i class="ph ph-warning"></i>
        <span class="message">Unexpected error while creating booking.</span>
      </div>`;
  }
}

// Function to view booking details
async function viewBookingDetail(bookingId) {
  const config = getConfigPayload();
  const body = {
    bookingId,
    env: config.env,
    apiKey: config.apiKey
  };
  
  // Show loading state
  const bookingEl = document.getElementById("booking");
  if (bookingEl) {
    bookingEl.innerHTML = `
      <div class="empty-state fade-in">
        <div class="loader" style="margin-bottom:16px; border-color:var(--primary); border-top-color:transparent; width:30px; height:30px;"></div>
        <p>Fetching booking details...</p>
      </div>`;
  }
  
  try {
    const t0 = performance.now();
    const res = await fetch(`${API_BASE}/booking-detail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const responseMs = Math.round(performance.now() - t0);
    
    const data = await res.json();
    
    console.log('API_BOOKING_DETAIL_REQUEST', { duration: responseMs, status: res.status, ok: data.ok });
    
    // Track response time
    journeyResponseTimes.bookingDetail = responseMs;
    displayResponseTimes();
    
    if (!res.ok || data.ok === false) {
      if (bookingEl) {
        bookingEl.innerHTML = `
          <div class="alert-box error fade-in" style="flex-direction: column; align-items: flex-start;">
            <div style="display: flex; gap: 8px; align-items: center; font-weight: 600;">
              <i class="ph ph-warning-circle" style="font-size: 1.2rem;"></i> Failed to Load Booking Details
            </div>
            <div style="margin-top: 8px; font-size: 0.9rem;">${data.reason || data.message || 'Please try again'}</div>
          </div>`;
      }
      return;
    }
    
    // Navigate to booking detail page
    window.globalBookingDetail = data;
    renderBookingDetail(data);
    
  } catch (err) {
    if (bookingEl) {
      bookingEl.innerHTML = `
        <div class="alert-box error fade-in">
          <i class="ph ph-warning"></i>
          <span class="message">Error fetching booking details: ${err.message}</span>
        </div>`;
    }
  }
}

// Function to render booking detail page
function renderBookingDetail(data) {
  // Hide all pages
  document.getElementById("search-page")?.classList.add("hidden");
  document.getElementById("results-page")?.classList.add("hidden");
  document.getElementById("detail-page")?.classList.add("hidden");
  document.getElementById("review-page")?.classList.add("hidden");
  
  // Show booking detail page
  const bookingDetailPage = document.getElementById("booking-detail-page");
  if (bookingDetailPage) {
    bookingDetailPage.classList.remove("hidden");
    bookingDetailPage.classList.add("fade-in");
  }
  
  // Update URL
  if (window.location.pathname !== '/ui/booking-detail') {
    history.pushState({ view: 'booking-detail' }, '', '/ui/booking-detail');
  }
  
  const container = document.getElementById("booking-detail-content");
  if (!container) return;
  
  // Extract booking details
  const bookingId = data.bookingId || data.id || 'N/A';
  const hotelName = data.hotelName || data.hotel?.name || 'Hotel';
  const checkIn = data.checkIn || data.checkInDate || 'N/A';
  const checkOut = data.checkOut || data.checkOutDate || 'N/A';
  const totalPrice = data.totalPrice || data.amount || 0;
  const currency = data.currency || 'INR';
  const status = data.status || 'Confirmed';
  const confirmationNumber = data.confirmationNumber || data.bookingId || 'N/A';
  
  const bookingDetailsHtml = `
    <div style="display: flex; flex-direction: column; gap: 20px;">
      <!-- Success Banner -->
      <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border: 2px solid #10b981; border-radius: 16px; padding: 24px; display: flex; align-items: center; gap: 16px; box-shadow: 0 10px 30px rgba(16, 185, 129, 0.15);">
        <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 14px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.6rem; flex-shrink: 0;">
          <i class="ph ph-check-circle"></i>
        </div>
        <div>
          <div style="font-size: 1.3rem; font-weight: 800; color: #065f46;">Booking Confirmed!</div>
          <div style="font-size: 0.95rem; color: #047857; margin-top: 4px;">Your reservation has been successfully created</div>
        </div>
      </div>
      
      <!-- Booking Details Grid -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <!-- Booking ID -->
        <div style="background: rgba(99, 102, 241, 0.05); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 12px; padding: 16px;">
          <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #4338ca; margin-bottom: 8px;">Booking ID</div>
          <div style="font-size: 1.1rem; font-weight: 800; color: #1e1b4b; word-break: break-all;">${bookingId}</div>
        </div>
        
        <!-- Confirmation Number -->
        <div style="background: rgba(34, 197, 94, 0.05); border: 1px solid rgba(34, 197, 94, 0.2); border-radius: 12px; padding: 16px;">
          <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #059669; margin-bottom: 8px;">Confirmation #</div>
          <div style="font-size: 1.1rem; font-weight: 800; color: #065f46; word-break: break-all;">${confirmationNumber}</div>
        </div>
        
        <!-- Hotel Name -->
        <div style="background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 12px; padding: 16px;">
          <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #1e40af; margin-bottom: 8px;">Hotel</div>
          <div style="font-size: 1rem; font-weight: 700; color: #1e3a8a;">${hotelName}</div>
        </div>
        
        <!-- Status -->
        <div style="background: rgba(34, 197, 94, 0.05); border: 1px solid rgba(34, 197, 94, 0.2); border-radius: 12px; padding: 16px;">
          <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #059669; margin-bottom: 8px;">Status</div>
          <div style="font-size: 1rem; font-weight: 700; color: #065f46; display: flex; align-items: center; gap: 6px;">
            <i class="ph ph-check-circle" style="color: #10b981;"></i> ${status}
          </div>
        </div>
      </div>
      
      <!-- Dates and Price -->
      <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 12px; padding: 20px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;">
        <!-- Check-in -->
        <div>
          <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #1e40af; margin-bottom: 8px;">Check-in</div>
          <div style="font-size: 1rem; font-weight: 700; color: #1e3a8a;">${checkIn}</div>
        </div>
        
        <!-- Check-out -->
        <div>
          <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #1e40af; margin-bottom: 8px;">Check-out</div>
          <div style="font-size: 1rem; font-weight: 700; color: #1e3a8a;">${checkOut}</div>
        </div>
        
        <!-- Total Price -->
        <div>
          <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #1e40af; margin-bottom: 8px;">Total Price</div>
          <div style="font-size: 1.2rem; font-weight: 800; color: #059669;">${currency} ${totalPrice.toFixed(2)}</div>
        </div>
      </div>
      
      <!-- Full Response -->
      <div style="background: #f8faff; border: 1px solid #e0e7ff; border-radius: 12px; padding: 16px;">
        <div style="font-size: 0.85rem; font-weight: 700; color: #4338ca; margin-bottom: 12px;">Full Booking Response</div>
        <pre style="font-size: 0.75rem; color: #1e1b4b; overflow-x: auto; max-height: 300px; margin: 0;">${JSON.stringify(data, null, 2)}</pre>
      </div>
      
      <!-- Action Buttons -->
      <div style="display: flex; gap: 12px; margin-top: 12px;">
        <button onclick="backToSearch()" style="flex: 1; padding: 12px 16px; background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; border-radius: 10px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s ease;">
          <i class="ph ph-arrow-left"></i> Back to Search
        </button>
        <button onclick="window.print()" style="flex: 1; padding: 12px 16px; background: #3b82f6; color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s ease;">
          <i class="ph ph-printer"></i> Print Booking
        </button>
      </div>
    </div>
  `;
  
  container.innerHTML = bookingDetailsHtml;
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

    if (!res.ok || data.ok === false) {
      bookingEl.innerHTML = `
        <div class="alert-box error fade-in">
          <i class="ph ph-warning-circle"></i>
          <span class="message">Booking failed: ${data.reason || "Check response"}</span>
        </div>
        <pre style="margin-top:12px; font-size: 0.8rem; background: #fdf2f2; padding: 10px; border-radius: 8px; overflow-x: auto;">${JSON.stringify(data, null, 2)}</pre>
      `;
      return;
    }

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

  // Set default to exactly 6 months from today
  const today = new Date();

  const checkinDate = new Date(today);
  checkinDate.setMonth(checkinDate.getMonth() + 6);

  const checkoutDate = new Date(checkinDate);
  checkoutDate.setDate(checkoutDate.getDate() + 3); // Default 3 nights stay

  // Format as YYYY-MM-DD
  const formatIso = (date) => date.toISOString().split('T')[0];

  checkinInput.value = formatIso(checkinDate);
  checkoutInput.value = formatIso(checkoutDate);
}

window.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("rooms-container");
  if (container && container.children.length === 0) {
    addRoom();
  }
  initializeDates();
  loadConfigState();
});

// History API Handlers
window.addEventListener('popstate', (e) => {
  // Simple fallback for browser back/forward buttons: reload to restore clean state
  window.location.reload();
});

// Toggle amenities function
function toggleAmenities() {
  const hiddenDiv = document.getElementById('hidden-amenities');
  const button = document.getElementById('show-more-amenities');
  
  if (hiddenDiv.style.display === 'none') {
    hiddenDiv.style.display = 'grid';
    button.innerHTML = '<i class="ph ph-minus"></i> Show less amenities';
  } else {
    hiddenDiv.style.display = 'none';
    const data = window.amenityData;
    button.innerHTML = `<i class="ph ph-plus"></i> Show ${data.total - data.showCount} more amenities`;
  }
}

// Clear room filters function
function clearRoomFilters() {
  document.getElementById("filter-room-name").value = "";
  document.getElementById("filter-meal").value = "";
  document.getElementById("filter-gst").value = "";
  document.getElementById("filter-refund").value = "";
  document.getElementById("filter-pan").value = "";
  document.getElementById("filter-passport").value = "";
  document.getElementById("filter-price").value = "";
  applyRoomFilters();
}