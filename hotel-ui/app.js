const API_BASE = window.location.origin;
let globalSearchBody = null; // Store the last search used for dynamic-detail

// Clean text by replacing raw HTML entities with their proper characters
const cleanText = (str) => {
  if (!str) return "";
  return str
    .replace(/&ndash;?/gi, "–")
    .replace(/&rsquo;?/gi, "'")
    .replace(/&lsquo;?/gi, "'")
    .replace(/&rdquo;?/gi, '"')
    .replace(/&ldquo;?/gi, '"')
    .replace(/&amp;?/gi, "&")
    .replace(/&nbsp;?/gi, " ");
};

/**
 * Centrally manages active page visibility, ensuring only one page is active
 * and all others are fully hidden.
 * @param {string} activePageId - The ID of the page to activate
 */
function showActivePage(activePageId) {
  const pages = ["search-page", "results-page", "detail-page", "review-page", "booking-detail-page"];
  pages.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (id === activePageId) {
        el.classList.remove("hidden");
        el.classList.add("fade-in");
      } else {
        el.classList.remove("fade-in");
        el.classList.add("hidden");
      }
    }
  });
}

// Store last API transactions for Technical Details View
let lastApiTransactions = {
  search: { req: null, res: null, time: null, status: null, url: '/search' },
  detail: { req: null, res: null, time: null, status: null, url: '/dynamic-detail' },
  review: { req: null, res: null, time: null, status: null, url: '/review' },
  book: { req: null, res: null, time: null, status: null, url: '/book' },
  bookingDetail: { req: null, res: null, time: null, status: null, url: '/booking-detail' }
};

/**
 * Renders a Postman-like technical details section
 * @param {string} step - The step name (search, detail, review, etc)
 * @returns {string} HTML string
 */
function renderTechnicalDetails(step) {
  let btnText = "View Technical Response Details (Inspect API JSON)";
  if (step === 'search') {
    btnText = "View Technical Search Details (Inspect API JSON)";
  } else if (step === 'detail') {
    btnText = "View Technical Room Details (Inspect API JSON)";
  } else if (step === 'review') {
    btnText = "View Technical Review Details (Inspect API JSON)";
  } else if (step === 'book') {
    btnText = "View Technical Booking Details (Inspect API JSON)";
  } else if (step === 'bookingDetail') {
    btnText = "View Technical Saved Booking Details (Inspect API JSON)";
  }

  return `
    <div class="tech-details-container" style="margin-top: 32px; display: flex; justify-content: center; width: 100%; margin-bottom: 24px;">
      <button onclick="openSearchApiModal('${step}')" style="background: rgba(212, 175, 55, 0.06); border: 2px dashed rgba(212, 175, 55, 0.35); border-radius: 16px; padding: 20px 40px; color: #AA8222; font-size: 1.05rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 12px; transition: all 0.3s ease; box-shadow: 0 4px 20px rgba(212, 175, 55, 0.03); width: 100%; max-width: 600px; justify-content: center;" onmouseover="this.style.background='rgba(212, 175, 55, 0.12)'; this.style.borderColor='rgba(212, 175, 55, 0.7)'; this.style.transform='translateY(-2px)';" onmouseout="this.style.background='rgba(212, 175, 55, 0.06)'; this.style.borderColor='rgba(212, 175, 55, 0.35)'; this.style.transform='none';">
        <i class="ph-bold ph-brackets-curly" style="font-size: 1.4rem;"></i> ${btnText}
      </button>
    </div>
  `;
}

function switchMasterTechTab(el, paneId) {
  const container = el.closest('.tech-details-card');
  container.querySelectorAll('.tech-master-tab').forEach(t => {
    t.classList.remove('active');
    t.style.background = 'none';
    t.style.color = '#64748b';
    t.style.boxShadow = 'none';
    const icon = t.querySelector('i');
    if (icon) icon.style.color = '#64748b';
  });
  el.classList.add('active');
  el.style.background = '#ffffff';
  el.style.color = '#202843';
  el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.05)';
  const icon = el.querySelector('i');
  if (icon) icon.style.color = '#D4AF37';
  
  container.querySelectorAll('.tech-pane-content').forEach(p => p.style.display = 'none');
  document.getElementById(paneId).style.display = 'block';
}

function switchTechTab(el, contentId) {
  const container = el.closest('.tech-pane-content') || el.closest('.tech-details-card');
  container.querySelectorAll('.tech-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  
  container.querySelectorAll('.tech-tab-content').forEach(c => c.style.display = 'none');
  document.getElementById(contentId).style.display = 'block';
}

window.globalJsonStore = window.globalJsonStore || {};

function copyTechJson(id) {
  const activeContent = document.querySelector(`#${id}-req:not([style*="display: none"]), #${id}-res:not([style*="display: none"])`);
  const activeId = activeContent.id;
  const jsonText = window.globalJsonStore[activeId] || activeContent.querySelector('.tech-json').textContent;
  
  navigator.clipboard.writeText(jsonText).then(() => {
    const btn = activeContent.parentElement.querySelector('.copy-btn');
    const originalIcon = btn.innerHTML;
    btn.innerHTML = '<i class="ph ph-check" style="color: #10b981;"></i>';
    setTimeout(() => btn.innerHTML = originalIcon, 2000);
  });
}

function syntaxHighlightJson(json, storeId) {
  if (json === undefined || json === null) {
    return `<span class="tech-json-null">null</span>`;
  }
  let fullJsonStr = '';
  if (typeof json !== 'string') {
    fullJsonStr = JSON.stringify(json, null, 2);
    json = fullJsonStr;
  } else {
    fullJsonStr = json;
  }
  
  if (storeId) {
    window.globalJsonStore = window.globalJsonStore || {};
    window.globalJsonStore[storeId] = fullJsonStr;
  }
  
  const MAX_LEN = 8000;
  if (json.length > MAX_LEN) {
    const sizeKB = Math.round(json.length / 1024);
    json = json.substring(0, MAX_LEN) + `\n\n... [JSON response is extremely large (${sizeKB} KB). Output truncated to prevent browser freezing. Use "Copy JSON" to view the complete response] ...`;
  }

  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, function (match) {
    let cls = 'tech-json-number';
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        cls = 'tech-json-key';
      } else {
        cls = 'tech-json-string';
      }
    } else if (/true|false/.test(match)) {
      cls = 'tech-json-boolean';
    } else if (/null/.test(match)) {
      cls = 'tech-json-null';
    }
    return '<span class="' + cls + '">' + match + '</span>';
  });
}

// Helper to convert number to words
function priceInWords(num) {
  if (num === 0) return 'Zero';
  if (!num || isNaN(num)) return '';
  
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const inWords = (n) => {
    if ((n = n.toString()).length > 9) return 'overflow';
    let n_arr = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n_arr) return ''; 
    let str = '';
    str += (Number(n_arr[1]) != 0) ? (a[Number(n_arr[1])] || b[n_arr[1][0]] + ' ' + a[n_arr[1][1]]) + 'Crore ' : '';
    str += (Number(n_arr[2]) != 0) ? (a[Number(n_arr[2])] || b[n_arr[2][0]] + ' ' + a[n_arr[2][1]]) + 'Lakh ' : '';
    str += (Number(n_arr[3]) != 0) ? (a[Number(n_arr[3])] || b[n_arr[3][0]] + ' ' + a[n_arr[3][1]]) + 'Thousand ' : '';
    str += (Number(n_arr[4]) != 0) ? (a[Number(n_arr[4])] || b[n_arr[4][0]] + ' ' + a[n_arr[4][1]]) + 'Hundred ' : '';
    str += (Number(n_arr[5]) != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n_arr[5])] || b[n_arr[5][0]] + ' ' + a[n_arr[5][1]]) : '';
    return str.trim();
  };

  const amountArr = num.toString().split('.');
  const wholePart = amountArr[0];
  const decimalPart = amountArr[1];
  
  let result = inWords(wholePart);
  
  if (decimalPart && Number(decimalPart) > 0) {
    result += ' and ' + inWords(decimalPart.padEnd(2, '0').substr(0, 2)) + ' Paise';
  }
  
  return result;
}

// Hide header elements on login page only
document.addEventListener('DOMContentLoaded', function() {
  const loginPage = document.getElementById('login-page');
  const headerSecuritySection = document.getElementById('header-security-section');
  const envWarningBanner = document.getElementById('env-warning-banner');
  const envSafeBanner = document.getElementById('env-safe-banner');
  
  // Check if login page is NOT hidden (meaning we're on login page)
  if (loginPage && loginPage.classList.contains('hidden') === false) {
    // We are on login page - HIDE header elements
    if (headerSecuritySection) headerSecuritySection.style.display = 'none';
    if (envWarningBanner) envWarningBanner.style.display = 'none';
    if (envSafeBanner) envSafeBanner.style.display = 'none';
  }
  // On all other pages, elements remain visible (default display: flex)
});

// Track response times for the entire booking journey
let journeyResponseTimes = {
  search: null,
  batchSearch: [],
  staticDetail: null,
  dynamicDetail: null,
  review: null,
  book: null,
  bookingDetail: null,
  cancellation: null
};

// Function to display response times in UI
function displayResponseTimes() {
  console.log('displayResponseTimes: Called');
  
  let totalMs = 0;
  let hasAnyTime = false;
  let html = '';
  let calculationParts = [];
  
  // Custom Card Generator for Modern UI (Header Integration)
  const generateCard = (topText, bottomText, colorSrc) => {
    const color = colorSrc || '#3b82f6';
    const isTotal = topText.toLowerCase() === 'total';
    const bg = isTotal ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : 'rgba(255, 255, 255, 0.95)';
    const textColor = isTotal ? '#f8fafc' : color;
    const labelColor = isTotal ? '#94a3b8' : '#64748b';
    const border = isTotal ? '1px solid rgba(255,255,255,0.1)' : `1px solid ${color}40`;
    
    return `<div style="background: ${bg}; backdrop-filter: blur(8px); border: ${border}; border-radius: 8px; padding: 4px 10px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 12px rgba(0,0,0,0.05); gap: 10px;">
      <div style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; color: ${labelColor};">${topText}</div>
      <div style="font-size: 0.85rem; font-weight: 800; color: ${textColor}; letter-spacing: -0.01em; font-family: monospace;">${bottomText}</div>
    </div>`;
  };

  // Search time
  if (journeyResponseTimes.search) {
    hasAnyTime = true;
    totalMs += journeyResponseTimes.search;
    const s = (journeyResponseTimes.search / 1000).toFixed(2);
    calculationParts.push(`search ${s}s`);
    html += generateCard('Search', `${s}s`, '#3b82f6');
  }
  
  // Batch search times
  if (journeyResponseTimes.batchSearch && journeyResponseTimes.batchSearch.length > 0) {
    hasAnyTime = true;
    journeyResponseTimes.batchSearch.forEach((time, idx) => {
      totalMs += time;
      const s = (time / 1000).toFixed(2);
      calculationParts.push(`batch ${idx + 1} ${s}s`);
      html += generateCard(`Batch ${idx + 1}`, `${s}s`, '#8b5cf6');
    });
  }
  
  // Static detail time
  if (journeyResponseTimes.staticDetail) {
    hasAnyTime = true;
    totalMs += journeyResponseTimes.staticDetail;
    const s = (journeyResponseTimes.staticDetail / 1000).toFixed(2);
    calculationParts.push(`static ${s}s`);
    html += generateCard('Static API', `${s}s`, '#06b6d4');
  }
  
  // Dynamic detail time
  if (journeyResponseTimes.dynamicDetail) {
    hasAnyTime = true;
    totalMs += journeyResponseTimes.dynamicDetail;
    const s = (journeyResponseTimes.dynamicDetail / 1000).toFixed(2);
    calculationParts.push(`detail ${s}s`);
    html += generateCard('Detail API', `${s}s`, '#10b981');
  }
  
  // Review time
  if (journeyResponseTimes.review) {
    hasAnyTime = true;
    totalMs += journeyResponseTimes.review;
    const s = (journeyResponseTimes.review / 1000).toFixed(2);
    calculationParts.push(`review ${s}s`);
    html += generateCard('Review', `${s}s`, '#f59e0b');
  }
  
  // Book time
  if (journeyResponseTimes.book) {
    hasAnyTime = true;
    totalMs += journeyResponseTimes.book;
    const s = (journeyResponseTimes.book / 1000).toFixed(2);
    calculationParts.push(`book ${s}s`);
    html += generateCard('Book', `${s}s`, '#ef4444');
  }
  
  // Booking detail time
  if (journeyResponseTimes.bookingDetail) {
    hasAnyTime = true;
    totalMs += journeyResponseTimes.bookingDetail;
    const s = (journeyResponseTimes.bookingDetail / 1000).toFixed(2);
    calculationParts.push(`booking detail ${s}s`);
    html += generateCard('Booking Check', `${s}s`, '#ec4899');
  }
  
  // Cancellation time
  if (journeyResponseTimes.cancellation) {
    hasAnyTime = true;
    totalMs += journeyResponseTimes.cancellation;
    const s = (journeyResponseTimes.cancellation / 1000).toFixed(2);
    calculationParts.push(`cancellation ${s}s`);
    html += generateCard('Cancellation', `${s}s`, '#a855f7');
  }
  
  if (hasAnyTime) {
    const totalS = (totalMs / 1000).toFixed(2);
    html += generateCard('Total', `${totalS}s`, '#0f172a');
    
    const headerBoxes = document.getElementById('header-response-boxes');
    if (headerBoxes) {
      headerBoxes.innerHTML = html;
    }
    
    const section = document.getElementById('response-times-section');
    if (section) {
      section.style.cssText = 'display: block; visibility: visible; opacity: 1; margin-top: 16px; margin-bottom: 24px; overflow: visible;';
    }
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
let loginStage = 1; // 1: Credentials, 2: OTP

function handleLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  const otpInput = document.getElementById("login-otp");
  const otpGroup = document.getElementById("otp-group");
  const loginBtn = document.getElementById("login-submit-btn");
  const errorEl = document.getElementById("login-error");
  const errorText = document.getElementById("login-error-text");
  
  errorEl.classList.add("hidden");

  if (loginStage === 1) {
    // Stage 1: Validate Email and Password
    if (email === VALID_EMAIL && password === VALID_PASSWORD) {
      // Show OTP field
      otpGroup.classList.remove("hidden");
      loginBtn.innerHTML = '<i class="ph ph-shield-check"></i> Verify OTP';
      loginStage = 2;
      
      // Focus OTP field
      setTimeout(() => otpInput.focus(), 100);
    } else {
      errorEl.classList.remove("hidden");
      errorText.textContent = "Invalid email or password";
    }
  } else {
    // Stage 2: Validate Static OTP
    if (otpInput.value === "7890") {
      localStorage.setItem("tj_user_logged_in", "true");
      localStorage.setItem("tj_user_email", email);
      loginStage = 1; // Reset for next time
      checkLoginStatus();
    } else {
      errorEl.classList.remove("hidden");
      errorText.textContent = "Invalid OTP. Please try again.";
      otpInput.value = "";
      otpInput.focus();
    }
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
  const appHeader = document.querySelector(".app-header");
  const safeBanner = document.getElementById("env-safe-banner");
  const warningBanner = document.getElementById("env-warning-banner");
  
  if (!isLoggedIn) {
    document.body.classList.add("login-active");
    // Show login page and hide ALL other pages
    document.getElementById("login-page").classList.remove("hidden");
    document.querySelectorAll(".view-page").forEach(p => {
      if (p.id !== "login-page") p.classList.add("hidden");
    });
    if (logoutBtn) logoutBtn.style.display = "none";
    
    // Hide headers and banners on login page
    if (appHeader) appHeader.style.display = "none";
    if (safeBanner) safeBanner.style.display = "none";
    if (warningBanner) warningBanner.style.display = "none";
    
    // Also hide the background blurs to let the luxury login background shine
    document.querySelectorAll(".bg-blur").forEach(el => el.style.display = "none");
  } else {
    document.body.classList.remove("login-active");
    // Show search page
    document.getElementById("login-page").classList.add("hidden");
    showActivePage("search-page");
    if (logoutBtn) logoutBtn.style.display = "flex";
    
    // Show headers and banners when logged in
    if (appHeader) appHeader.style.display = "flex";
    if (safeBanner) safeBanner.style.display = ""; // Clear the "none" override
    if (warningBanner) warningBanner.style.display = ""; // Clear the "none" override
    
    // Banners are managed by the environment check logic
    document.querySelectorAll(".bg-blur").forEach(el => el.style.display = "block");
    
    // Re-trigger environment banners to show the correct one
    const currentEnv = localStorage.getItem("tj_env") || "https://tj-hotel-admin.tripjack.com/";
    updateEnvBanners(currentEnv);
  }
}

function logout() {
  localStorage.removeItem("tj_user_logged_in");
  localStorage.removeItem("tj_user_email");
  
  // Reset login stage for next time
  loginStage = 1;
  const otpGroup = document.getElementById("otp-group");
  const loginBtn = document.getElementById("login-submit-btn");
  if (otpGroup) otpGroup.classList.add("hidden");
  if (loginBtn) loginBtn.innerHTML = '<i class="ph ph-sign-in"></i> Sign In';
  
  checkLoginStatus();
}

window.addEventListener("DOMContentLoaded", () => {
  checkLoginStatus();
  initializeDates();
  loadRecentBookings();
  
  const currentPath = window.location.pathname;
  const urlParams = new URLSearchParams(window.location.search);
  const bookingIdParam = urlParams.get('id');

  if (currentPath === '/home/booking-detail' && bookingIdParam) {
    viewBookingDetail(bookingIdParam);
  } else if (currentPath === '/home/detail' || currentPath === '/home/review') {
    const savedState = sessionStorage.getItem('tj_page_state');
    
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        
        if (state.page === 'detail' && currentPath === '/home/detail') {
          globalSearchBody = state.searchBody;
          window.globalDetailData = state.detailData;
          
          showActivePage("detail-page");
          
          const hotelId = state.requestedHotelId;
          const optionId = state.requestedOptionId;
          if (hotelId && optionId) {
            fetchHotelDetails(hotelId, optionId);
          } else {
            // Also render static details if available in stored data
            if (state.detailData && state.detailData.staticDetails) {
              renderStaticDetailsOnly(state.detailData.staticDetails, 0);
            }
            renderHotelDetails(state.detailData);
          }
        } else if (state.page === 'review' && currentPath === '/home/review') {
          globalSearchBody = state.searchBody;
          window._lastReviewData = state.reviewData;
          if (state.detailData) {
            window.globalDetailData = state.detailData;
          }
          
          showActivePage("review-page");
          
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
      window.location.replace('/home/search');
    }
  } else if (currentPath === '/home/results') {
    const savedState = sessionStorage.getItem('tj_page_state');
    
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        if (state.page === 'results') {
          globalSearchBody = state.searchBody;
          if (state.searchBody) {
            triggerSearchWithBody(state.searchBody);
          } else {
            displayHotels(state.resultsData);
            switchToResultsPage(state.searchBody, state.duration || 0, state.resultsData);
          }
        }
      } catch (e) {
        // Silent fail
      }
    }
  } else {
    sessionStorage.removeItem('tj_page_state');
  }
});

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
  return `<i class="ph ph-timer"></i> ${minutes}m ${remainingSeconds}s`;
}

function formatTimingStatus(ms, thresholdMs) {
  const s = (ms / 1000).toFixed(2);
  const thresholdS = (thresholdMs / 1000).toFixed(0);
  const isExceeded = ms > thresholdMs;
  
  const icon = isExceeded ? 'ph-warning-circle' : 'ph-check-circle';
  const color = isExceeded ? '#ef4444' : '#22c55e';
  const bg = isExceeded ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)';
  const border = isExceeded ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)';
  const text = isExceeded ? `Timeout Exceeded (${s}s)` : `Within ${thresholdS}s Limit (${s}s)`;
  
  return `<span style="color: ${color}; display: inline-flex; align-items: center; gap: 12px; font-weight: 800; padding: 10px 24px; background: ${bg}; border-radius: 99px; border: 1px solid ${border}; font-size: 1rem; line-height: 1; vertical-align: middle; margin-left: 20px; box-shadow: 0 4px 12px ${border}; letter-spacing: 0.5px; transition: all 0.3s ease; white-space: nowrap;">
            <i class="ph-fill ${icon}" style="font-size: 1.3rem;"></i> ${text}
          </span>`;
}

let searchTimerInterval = null;
let searchSecondsElapsed = 0;

function setSearchLoading(isLoading) {
  const btn = document.getElementById("search-button");
  const label = document.getElementById("search-button-label");
  const spinner = document.getElementById("search-button-spinner");
  const icon = btn?.querySelector(".search-icon");
  const overlay = document.getElementById("search-loading-overlay");
  const overlayTimer = document.getElementById("overlay-search-timer");

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
    if (overlayTimer) overlayTimer.textContent = "0s elapsed";

    searchTimerInterval = setInterval(() => {
      searchSecondsElapsed++;
      label.innerHTML = `Searching... <span style="opacity:0.8; margin-left:6px;">${searchSecondsElapsed}s</span>`;
      if (overlayTimer) overlayTimer.textContent = `${searchSecondsElapsed}s elapsed`;
    }, 1000);

    spinner.classList.remove("hidden");
    if (icon) icon.classList.add("hidden");
    if (overlay) overlay.classList.remove("hidden");
  } else {
    label.textContent = "Search Hotels";
    spinner.classList.add("hidden");
    if (icon) icon.classList.remove("hidden");
    if (overlay) overlay.classList.add("hidden");
  }
}


function showSearchError(message, details, rawError) {
  const el = document.getElementById("search-error");
  const msgEl = el?.querySelector(".message");
  if (!el || !msgEl) return;

  el.classList.remove("hidden");
  
  // Make it display nicely with an API Inspector button for developer troubleshooting
  let html = `
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; width: 100%; flex-wrap: wrap;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <i class="ph ph-warning-circle" style="font-size: 1.2rem; flex-shrink: 0; color: #b91c1c;"></i>
        <span class="message-text" style="font-weight: 600; color: #b91c1c;">${message}${details ? ` (${details})` : ""}</span>
      </div>
      <button type="button" onclick="openSearchApiModal()" style="background: rgba(185, 28, 28, 0.1); border: 1px solid rgba(185, 28, 28, 0.3); color: #b91c1c; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s;" onmouseover="this.style.background='rgba(185, 28, 28, 0.2)'" onmouseout="this.style.background='rgba(185, 28, 28, 0.1)'">
        <i class="ph-bold ph-brackets-curly" style="font-weight: bold;"></i> Inspect Error Details
      </button>
    </div>
  `;
  
  msgEl.innerHTML = html;
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
      <div class="search-criteria-header" style="padding: 20px 24px; background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%); border-bottom: 1px solid rgba(59, 130, 246, 0.1);">
        <div class="criteria-header-flex" style="display: flex; align-items: center; gap: 12px;">
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
      <div class="search-criteria-grid" style="padding: 24px; display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px;">
        ${locationText ? `
          <div style="background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(59, 130, 246, 0.15); border-radius: 16px; padding: 18px; text-align: center; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); cursor: default; position: relative; overflow: hidden; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.02);" onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 10px 25px rgba(59, 130, 246, 0.08)'; this.style.borderColor='rgba(59, 130, 246, 0.35)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(59, 130, 246, 0.02)'; this.style.borderColor='rgba(59, 130, 246, 0.15)';">
            <div style="position: absolute; top: 0; right: 0; width: 60px; height: 60px; background: radial-gradient(circle, rgba(59, 130, 246, 0.06) 0%, transparent 70%); border-radius: 0 0 0 100%;"></div>
            <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
              <div style="width: 38px; height: 38px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(239, 68, 68, 0.2);">
                <i class="ph-fill ph-map-pin" style="color: white; font-size: 1.15rem;"></i>
              </div>
            </div>
            <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.8px; color: #94a3b8; font-weight: 700; margin-bottom: 6px;">Location</div>
            <div style="font-weight: 800; color: #1e293b; font-size: 1.05rem; letter-spacing: -0.2px;">${locationText}</div>
          </div>
        ` : ''}
        
        <div style="background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(59, 130, 246, 0.15); border-radius: 16px; padding: 18px; text-align: center; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); cursor: default; position: relative; overflow: hidden; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.02);" onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 10px 25px rgba(59, 130, 246, 0.08)'; this.style.borderColor='rgba(59, 130, 246, 0.35)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(59, 130, 246, 0.02)'; this.style.borderColor='rgba(59, 130, 246, 0.15)';">
          <div style="position: absolute; top: 0; right: 0; width: 60px; height: 60px; background: radial-gradient(circle, rgba(59, 130, 246, 0.06) 0%, transparent 70%); border-radius: 0 0 0 100%;"></div>
          <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
            <div style="width: 38px; height: 38px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(59, 130, 246, 0.25);">
              <i class="ph-fill ph-calendar" style="color: white; font-size: 1.15rem;"></i>
            </div>
          </div>
          <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.8px; color: #94a3b8; font-weight: 700; margin-bottom: 6px;">Dates</div>
          <div style="font-weight: 800; color: #1e293b; font-size: 0.95rem; letter-spacing: -0.2px;">${checkInFormatted} - ${checkOutFormatted}</div>
        </div>

        <div style="background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(59, 130, 246, 0.15); border-radius: 16px; padding: 18px; text-align: center; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); cursor: default; position: relative; overflow: hidden; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.02);" onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 10px 25px rgba(59, 130, 246, 0.08)'; this.style.borderColor='rgba(59, 130, 246, 0.35)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(59, 130, 246, 0.02)'; this.style.borderColor='rgba(59, 130, 246, 0.15)';">
          <div style="position: absolute; top: 0; right: 0; width: 60px; height: 60px; background: radial-gradient(circle, rgba(139, 92, 246, 0.06) 0%, transparent 70%); border-radius: 0 0 0 100%;"></div>
          <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
            <div style="width: 38px; height: 38px; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(139, 92, 246, 0.25);">
              <i class="ph-fill ph-moon" style="color: white; font-size: 1.15rem;"></i>
            </div>
          </div>
          <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.8px; color: #94a3b8; font-weight: 700; margin-bottom: 6px;">Nights</div>
          <div style="font-weight: 800; color: #1e293b; font-size: 1.15rem; letter-spacing: -0.2px;">${stayNights}</div>
        </div>

        <div style="background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(59, 130, 246, 0.15); border-radius: 16px; padding: 18px; text-align: center; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); cursor: default; position: relative; overflow: hidden; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.02);" onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 10px 25px rgba(59, 130, 246, 0.08)'; this.style.borderColor='rgba(59, 130, 246, 0.35)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(59, 130, 246, 0.02)'; this.style.borderColor='rgba(59, 130, 246, 0.15)';">
          <div style="position: absolute; top: 0; right: 0; width: 60px; height: 60px; background: radial-gradient(circle, rgba(16, 185, 129, 0.06) 0%, transparent 70%); border-radius: 0 0 0 100%;"></div>
          <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
            <div style="width: 38px; height: 38px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.25);">
              <i class="ph-fill ph-users" style="color: white; font-size: 1.15rem;"></i>
            </div>
          </div>
          <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.8px; color: #94a3b8; font-weight: 700; margin-bottom: 6px;">Guests</div>
          <div style="font-weight: 800; color: #1e293b; font-size: 0.95rem; letter-spacing: -0.2px;">${totalAdults}A${totalChildren > 0 ? `, ${totalChildren}C` : ''}</div>
          ${childAges.length > 0 ? `<div style="font-size: 0.7rem; color: #64748b; margin-top: 4px; font-weight: 600;">Ages: ${childAges.join(', ')}</div>` : ''}
        </div>

        <div style="background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(59, 130, 246, 0.15); border-radius: 16px; padding: 18px; text-align: center; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); cursor: default; position: relative; overflow: hidden; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.02);" onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 10px 25px rgba(59, 130, 246, 0.08)'; this.style.borderColor='rgba(59, 130, 246, 0.35)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(59, 130, 246, 0.02)'; this.style.borderColor='rgba(59, 130, 246, 0.15)';">
          <div style="position: absolute; top: 0; right: 0; width: 60px; height: 60px; background: radial-gradient(circle, rgba(245, 158, 11, 0.06) 0%, transparent 70%); border-radius: 0 0 0 100%;"></div>
          <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
            <div style="width: 38px; height: 38px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(245, 158, 11, 0.25);">
              <i class="ph-fill ph-door" style="color: white; font-size: 1.15rem;"></i>
            </div>
          </div>
          <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.8px; color: #94a3b8; font-weight: 700; margin-bottom: 6px;">Rooms</div>
          <div style="font-weight: 800; color: #1e293b; font-size: 1.15rem; letter-spacing: -0.2px;">${roomCount}</div>
        </div>

        <div style="background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(59, 130, 246, 0.15); border-radius: 16px; padding: 18px; text-align: center; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); cursor: default; position: relative; overflow: hidden; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.02);" onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 10px 25px rgba(59, 130, 246, 0.08)'; this.style.borderColor='rgba(59, 130, 246, 0.35)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(59, 130, 246, 0.02)'; this.style.borderColor='rgba(59, 130, 246, 0.15)';">
          <div style="position: absolute; top: 0; right: 0; width: 60px; height: 60px; background: radial-gradient(circle, rgba(6, 182, 212, 0.06) 0%, transparent 70%); border-radius: 0 0 0 100%;"></div>
          <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
            <div style="width: 38px; height: 38px; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(6, 182, 212, 0.25);">
              <i class="ph-fill ph-currency-circle-dollar" style="color: white; font-size: 1.15rem;"></i>
            </div>
          </div>
          <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.8px; color: #94a3b8; font-weight: 700; margin-bottom: 6px;">Currency</div>
          <div style="font-weight: 800; color: #1e293b; font-size: 1.05rem; letter-spacing: -0.2px;">${currency}</div>
        </div>
      </div>
    </div>
  `;
}

/* =========================================
   Configuration & Environment
   ========================================= */
const PREDEFINED_KEYS = [
  "751045f64b362c-7462-4f82-ad59-0a9c2b9b9fc9",
  "8112616278b36e4e-6996-4088-b66b-bf5d6787fe13",
  "81139487ef4307a2-1437-43e8-b481-88a25b62076b",
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

  const savedApikey = localStorage.getItem("tj_apikey") || "751045f64b362c-7462-4f82-ad59-0a9c2b9b9fc9";
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
  let env = localStorage.getItem("tj_env");
  if (!env) {
    const envEl = document.getElementById("config-env");
    env = envEl ? envEl.value : "";
  }

  let apiKey = localStorage.getItem("tj_apikey");
  if (!apiKey) {
    const selectEl = document.getElementById("config-apikey-select");
    const customEl = document.getElementById("config-apikey-custom");
    if (selectEl && selectEl.value && selectEl.value !== "custom") {
      apiKey = selectEl.value;
    } else if (customEl && customEl.value) {
      // Remove mask placeholders if any
      const val = customEl.value;
      if (!val.includes("***")) {
        apiKey = val;
      }
    }
  }

  return {
    env: env || "https://tj-hotel-admin.tripjack.com/",
    apiKey: apiKey || "751045f64b362c-7462-4f82-ad59-0a9c2b9b9fc9"
  };
}

let currentSearchAbortController = null;

function cancelSearchAction() {
  if (currentSearchAbortController) {
    currentSearchAbortController.abort();
    currentSearchAbortController = null;
  }
  setSearchLoading(false);
}

async function searchHotels() {
  clearSearchError();
  setSearchLoading(true);

  if (currentSearchAbortController) {
    currentSearchAbortController.abort();
  }
  currentSearchAbortController = new AbortController();
  const signal = currentSearchAbortController.signal;

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
    
    const t0 = performance.now();
    const res = await fetch(`${API_BASE}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: signal
    });
    const t1 = performance.now();
    const responseTime = Math.round(t1 - t0);

    const data = await res.json();
    
    // Store for Tech Details
    lastApiTransactions.search = {
      req: body,
      res: data,
      time: responseTime,
      status: res.status,
      url: '/search'
    };
    const duration = Math.round(performance.now() - startTime);
    
    // Timeout Status UI
    const threshold = timeoutMs || 13000;
    const timerUI = document.getElementById("search-timer");
    if (timerUI) {
      timerUI.innerHTML = formatTimingStatus(duration, threshold);
      timerUI.classList.remove("hidden");
    }

    console.log('API_SEARCH_REQUEST', { duration, status: res.status, ok: data.ok });
    
    // Clear and track response time
    journeyResponseTimes = { search: null, batchSearch: [], staticDetail: null, dynamicDetail: null, review: null, book: null, bookingDetail: null, cancellation: null };
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

    displayHotels(data);
    
    // Add Technical Details to Results
    const resultsContainer = document.getElementById("results");
    if (resultsContainer) resultsContainer.insertAdjacentHTML('beforeend', renderTechnicalDetails('search'));

    globalSearchBody = body;
    saveRecentSearch(body);
    switchToResultsPage(body, duration, data);
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('Search aborted by user');
      return;
    }
    showSearchError("Unexpected error while searching hotels.", err?.message);
    displayHotels(null);
  } finally {
    setSearchLoading(false);
    currentSearchAbortController = null;
  }
}

/**
 * Runs a hotel search programmatically using a specified search body,
 * hitting the backend API and displaying the latest results.
 * Used to automatically refresh search results on page reload.
 */
async function triggerSearchWithBody(body) {
  clearSearchError();
  setSearchLoading(true);

  if (currentSearchAbortController) {
    currentSearchAbortController.abort();
  }
  currentSearchAbortController = new AbortController();
  const signal = currentSearchAbortController.signal;

  try {
    const startTime = performance.now();
    const t0 = performance.now();
    const res = await fetch(`${API_BASE}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: signal
    });
    const t1 = performance.now();
    const responseTime = Math.round(t1 - t0);

    const data = await res.json();
    
    lastApiTransactions.search = {
      req: body,
      res: data,
      time: responseTime,
      status: res.status,
      url: '/search'
    };
    const duration = Math.round(performance.now() - startTime);
    
    const timeoutMs = body.timeoutMs || 13000;
    const timerUI = document.getElementById("search-timer");
    if (timerUI) {
      timerUI.innerHTML = formatTimingStatus(duration, timeoutMs);
      timerUI.classList.remove("hidden");
    }

    console.log('API_SEARCH_REQUEST_TRIGGERED', { duration, status: res.status, ok: data.ok });
    
    journeyResponseTimes = { search: null, batchSearch: [], staticDetail: null, dynamicDetail: null, review: null, book: null, bookingDetail: null, cancellation: null };
    journeyResponseTimes.search = duration;
    displayResponseTimes();

    if (!res.ok || data.ok === false) {
      const detail = data && typeof data === "object" ? `${data.status_code || res.status} ${data.reason || ""}`.trim() : `${res.status}`;
      showSearchError("Search failed. Check API response details.", detail, data);
      displayHotels(null);
      return;
    }

    displayHotels(data);
    
    const resultsContainer = document.getElementById("results");
    if (resultsContainer) resultsContainer.insertAdjacentHTML('beforeend', renderTechnicalDetails('search'));

    globalSearchBody = body;
    saveRecentSearch(body);
    switchToResultsPage(body, duration, data);
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('Programmatic search aborted');
      return;
    }
    showSearchError("Unexpected error while searching hotels.", err?.message);
    displayHotels(null);
  } finally {
    setSearchLoading(false);
    currentSearchAbortController = null;
  }
}

// Location-based Batch Search
async function searchLocationHotels(location) {
  clearSearchError();
  setSearchLoading(true);

  if (currentSearchAbortController) {
    currentSearchAbortController.abort();
  }
  currentSearchAbortController = new AbortController();
  const signal = currentSearchAbortController.signal;

  try {
    // First, load the hotel codes for the location
    const codesResponse = await fetch(`${API_BASE}/hotel-codes/${location}`, { signal: signal });
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
    const t0 = performance.now();
    const res = await fetch(`${API_BASE}/batch-search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: signal
    });
    const t1 = performance.now();
    const responseTime = Math.round(t1 - t0);

    const data = await res.json();
    
    // Store for Tech Details (Batch Search behaves like Search for history)
    lastApiTransactions.search = {
      req: body,
      res: data,
      time: responseTime,
      status: res.status,
      url: '/batch-search'
    };
    const duration = Math.round(performance.now() - startTime);
    
    // Timeout Status UI
    const threshold = timeoutMs || 13000;
    const timerUI = document.getElementById("search-timer");
    if (timerUI) {
      timerUI.innerHTML = formatTimingStatus(duration, threshold);
      timerUI.classList.remove("hidden");
    }

    console.log('API_BATCH_SEARCH_REQUEST', { duration, status: res.status, ok: data.ok });
    
    // Track response time by parsing batch_details
    journeyResponseTimes = { search: null, batchSearch: [], staticDetail: null, dynamicDetail: null, review: null, book: null, bookingDetail: null, cancellation: null };
    if (data.batch_details && data.batch_details.length > 0) {
      data.batch_details.forEach(b => {
        if (b.response_time_ms) {
          journeyResponseTimes.batchSearch.push(b.response_time_ms);
        }
      });
    }
    if (journeyResponseTimes.batchSearch.length === 0) {
      journeyResponseTimes.batchSearch.push(duration);
    }
    
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

    displayHotels(data);
    
    // Add Technical Details to Results
    const resultsContainer = document.getElementById("results");
    if (resultsContainer) resultsContainer.insertAdjacentHTML('beforeend', renderTechnicalDetails('search'));

    globalSearchBody = body;
    saveRecentSearch(body);
    switchToResultsPage(body, duration, data);
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log(`Location Search aborted by user for ${location}`);
      return;
    }
    showSearchError(`Unexpected error while searching ${location} hotels.`, err?.message);
    displayHotels(null);
  } finally {
    setSearchLoading(false);
    currentSearchAbortController = null;
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
      // Ensure we have exactly 'children' number of ages, default to 5 if missing
      const finalAges = [];
      for (let i = 0; i < children; i++) {
        finalAges.push(childAge[i] || 5);
      }
      room.childAge = finalAges;
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

  // Sort hotels by lowest to highest price by default
  if (Array.isArray(data.hotels)) {
    data.hotels.sort((a, b) => {
      const priceA = a.options?.[0]?.pricing?.totalPrice ?? 0;
      const priceB = b.options?.[0]?.pricing?.totalPrice ?? 0;
      return priceA - priceB;
    });
  }

  // Reset Results filters (Default to price low to high sorting)
  document.getElementById("r-filter-name").value = "";
  document.getElementById("r-filter-meal").value = "";
  document.getElementById("r-filter-gst").value = "";
  document.getElementById("r-filter-refund").value = "";
  document.getElementById("r-filter-pan").value = "";
  document.getElementById("r-filter-price").value = "low_to_high";

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
    card.dataset.passport = option.compliance?.passportRequired ? "true" : "false";
    card.dataset.price = totalPrice;

    const strikeThrough = option.pricing?.strikeThrough ? (option.pricing.strikeThrough).toFixed(2) : null;
    const gstClaimable = option.pricing?.gstClaimableAmount ? (option.pricing.gstClaimableAmount).toFixed(2) : null;

    let inclusionsHtml = "";
    if (option.inclusions && option.inclusions.length > 0) {
      const incList = option.inclusions.map(inc => `<li style="font-size:0.75rem; color:#64748b; margin-bottom:4px; line-height:1.4;">${cleanText(inc)}</li>`).join("");
      inclusionsHtml = `
        <details style="margin-top:10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; overflow:hidden; transition: all 0.3s ease;">
          <summary style="font-size:0.75rem; font-weight:600; color:#475569; padding:8px 12px; display:flex; align-items:center; justify-content:space-between; cursor:pointer; list-style:none; user-select:none;">
            <div style="display:flex; align-items:center; gap:6px;">
              <i class="ph ph-check-square-offset" style="color:var(--primary); font-size:0.95rem;"></i>
              <span>Inclusions & Policies</span>
            </div>
            <div style="font-size: 0.7rem; color: #475569; background: #e2e8f0; padding: 1px 6px; border-radius: 12px; font-weight: 700; display: flex; align-items: center; gap: 3px;">
              ${option.inclusions.length} <i class="ph ph-caret-down"></i>
            </div>
          </summary>
          <div style="padding: 10px 12px 12px 12px; border-top: 1px dashed #cbd5e1; background: white; max-height: 150px; overflow-y: auto;">
            <ul style="margin:0; padding-left:14px;">
              ${incList}
            </ul>
          </div>
        </details>
      `;
    }

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
        ${inclusionsHtml}
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
          ${gstClaimable ? `
          <div class="price-item">
            <span class="price-label">GST Claimable</span>
            <span class="price-value" style="color:var(--primary)">${currency} ${gstClaimable}</span>
          </div>
          ` : ''}
          <div class="price-item">
            <span class="price-label">Total</span>
            <div style="display:flex; flex-direction:column; align-items:flex-end;">
              ${strikeThrough ? `<span style="text-decoration:line-through; font-size:0.85rem; color:#94a3b8; margin-bottom:-4px;">${currency} ${strikeThrough}</span>` : ""}
              <span class="price-total">${currency} ${totalPrice}</span>
            </div>
          </div>
          <div style="font-size: 0.75rem; color: #64748b; font-weight: 500; text-align: right; margin-top: 4px; font-style: italic;">
            (${priceInWords(totalPrice)} Rupees Only)
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

  // Ensure Technical Details button is always kept at the very bottom of results list
  const techDetails = resultsContainer.querySelector(".tech-details-container");
  if (techDetails) {
    resultsContainer.appendChild(techDetails);
  }

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

  showActivePage("results-page");

  // Update URL
  if (window.location.pathname !== '/home/results') {
    history.pushState({ view: 'results' }, '', '/home/results');
  }

  if (resultsTimer && durationMs) {
    const timeoutInput = document.getElementById("timeoutMs");
    const threshold = timeoutInput ? parseInt(timeoutInput.value || "13000", 10) : 13000;
    resultsTimer.innerHTML = formatTimingStatus(durationMs, threshold);
    resultsTimer.classList.remove("hidden");
  }

  if (summary && lastSearchBody) {
    const searchedIds = lastSearchBody.hids?.length || lastSearchBody.hotelCodes?.length || 0;
    const returnedHotels = data?.hotels?.length || 0;
    const location = lastSearchBody.location || null;
    
    // Beautiful and modern results summary at the top
    const resultsSummaryHtml = `
      <div style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-bottom: 24px; position: relative; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
        <!-- Decorative background elements -->
        <div style="position: absolute; top: -40px; right: -40px; width: 120px; height: 120px; background: radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, transparent 70%); border-radius: 50%; pointer-events: none;"></div>
        <div style="position: absolute; bottom: -30px; left: -30px; width: 100px; height: 100px; background: radial-gradient(circle, rgba(16, 185, 129, 0.03) 0%, transparent 70%); border-radius: 50%; pointer-events: none;"></div>
        
        <div style="display: flex; align-items: flex-start; gap: 20px; position: relative; z-index: 1;">
          <!-- Icon Container -->
          <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 14px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.6rem; flex-shrink: 0; box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3); animation: pulse 2s ease-in-out infinite;">
            <i class="ph ph-check-circle"></i>
          </div>
          
          <!-- Content -->
          <div style="flex: 1;">
            <h3 style="margin: 0 0 12px 0; font-size: 1.4rem; font-weight: 800; color: #065f46; letter-spacing: -0.5px;">Search Results</h3>
            
            <!-- Stats Grid -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; margin-bottom: 12px;">
              <!-- Stat 1: Hotel Codes Hit -->
              <div style="background: rgba(255, 255, 255, 0.65); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.85); border-radius: 12px; padding: 12px 14px; display: flex; align-items: center; gap: 10px; transition: all 0.3s ease; flex: 1;">
                <div style="width: 36px; height: 36px; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.9rem; flex-shrink: 0;">
                  <i class="ph ph-target"></i>
                </div>
                <div>
                  <div style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #92400e;">Hit</div>
                  <div style="font-size: 1.1rem; font-weight: 800; color: #059669;">${searchedIds}</div>
                </div>
              </div>
                          <!-- Stat 2: Hotels Returned -->
              <div style="background: rgba(255, 255, 255, 0.65); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.85); border-radius: 12px; padding: 12px 14px; display: flex; align-items: center; gap: 10px; transition: all 0.3s ease; flex: 1;">
                <div style="width: 36px; height: 36px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.9rem; flex-shrink: 0;">
                  <i class="ph ph-buildings"></i>
                </div>
                <div>
                  <div style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #1e3a8a;">Response</div>
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
  window.location.href = '/home/search';
}

function backToResults() {
  const resultsPage = document.getElementById("results-page");
  const detailPage = document.getElementById("detail-page");

  showActivePage("results-page");

  // Update URL
  if (window.location.pathname !== '/home/results') {
    history.pushState({ view: 'results' }, '', '/home/results');
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
  showActivePage("detail-page");

  // Update URL
  if (window.location.pathname !== '/home/detail') {
    history.pushState({ view: 'detail', hid: hotelId }, '', '/home/detail');
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
    
    // Store for Tech Details (Static Detail API)
    lastApiTransactions.staticDetail = {
      req: staticBody,
      res: staticData,
      time: staticDurationMs,
      status: staticRes.status,
      url: '/static-detail'
    };
    
    console.log('API_STATIC_DETAIL_REQUEST', { duration: staticDurationMs, status: staticRes.status, ok: staticData.ok });
    
    // Track response time
    journeyResponseTimes.staticDetail = staticDurationMs;
    displayResponseTimes();

    // Show static content immediately
    if (staticData && staticData.ok !== false) {
      console.log('Rendering static details...');
      renderStaticDetailsOnly(staticData, staticDurationMs);
      console.log('Static details rendered, now fetching dynamic details...');
    }

    // Then fetch dynamic details
    console.log('About to fetch dynamic details with body:', dynamicBody);
    const t0 = performance.now();
    const dynamicRes = await fetch(`${API_BASE}/dynamic-detail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dynamicBody)
    });
    const t1 = performance.now();
    const responseTime = Math.round(t1 - t0);

    console.log('Dynamic detail response received:', dynamicRes.status);
    const dynamicData = await dynamicRes.json();
    
    // Create clean dynamic pricing request in exact downstream cURL format for display
    const cleanDynamicRequest = {
      correlationId: dynamicBody.correlationId || "ui-" + Math.random().toString(36).substring(2, 10).toUpperCase(),
      hid: hotelId,
      checkIn: dynamicBody.checkIn,
      checkOut: dynamicBody.checkOut,
      rooms: (dynamicBody.rooms || []).map(r => ({
        adults: parseInt(r.adults) || 1,
        children: parseInt(r.children) || 0,
        childAge: r.childAge || []
      })),
      currency: dynamicBody.currency || "INR",
      nationality: dynamicBody.nationality || "106",
      timeoutMs: dynamicBody.timeoutMs || 30000
    };

    // Store for Tech Details (Dynamic Pricing API)
    lastApiTransactions.detail = {
      req: cleanDynamicRequest,
      res: dynamicData,
      time: responseTime,
      status: dynamicRes.status,
      url: '/hms/v3/hotel/pricing'
    };
    console.log('Dynamic detail data parsed:', dynamicData);
    const durationMs = Math.round(performance.now() - startTime);
    
    // Timeout Status UI
    const timeoutInput = document.getElementById("timeoutMs");
    const threshold = timeoutInput ? parseInt(timeoutInput.value || "13000", 10) : 13000;
    if (timerUI) {
      timerUI.innerHTML = formatTimingStatus(durationMs, threshold);
      timerUI.classList.remove("hidden");
    }

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
    
    // Add Technical Details
    const detailResults = document.getElementById("detail-results");
    if (detailResults) detailResults.insertAdjacentHTML('beforeend', renderTechnicalDetails('detail'));
  } catch (err) {
    console.error('Error in fetchHotelDetails:', err);
    console.error('Error stack:', err.stack);
    errorBox.classList.remove("hidden");
    errorBox.querySelector(".message").textContent = err.message;
  }
}

/**
 * Fetches dynamic and static hotel details silently in the background
 * to obtain a fresh reviewHash if the previous one expired.
 */
async function fetchFreshDetailDataOnly(hotelId, optionId) {
  if (!globalSearchBody) return null;
  
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

    // Fetch static details first
    const staticRes = await fetch(`${API_BASE}/static-detail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(staticBody)
    });
    const staticData = await staticRes.json();

    // Fetch dynamic details
    const dynamicRes = await fetch(`${API_BASE}/dynamic-detail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dynamicBody)
    });
    const dynamicData = await dynamicRes.json();

    if (!dynamicRes.ok || dynamicData.ok === false) {
      return null;
    }

    const combinedData = {
      ...dynamicData,
      staticDetails: staticData,
      requestedHotelId: hotelId,
      requestedOptionId: optionId
    };

    return combinedData;
  } catch (err) {
    console.error("fetchFreshDetailDataOnly error:", err);
    return null;
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
      <img src="${imageUrl}" alt="Hotel" style="max-width: 100%; max-height: 95vh; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.5); animation: zoomIn 0.4s ease-out;" onerror="handleModalImageError(this)" onload="handleModalImageLoad(this)">
      
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

// Handle modal image errors
function handleModalImageError(img) {
  console.warn('Modal image failed to load:', img.src);
  
  const placeholder = document.createElement('div');
  placeholder.style.cssText = `
    width: 400px;
    height: 300px;
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #94a3b8;
    font-size: 1.1rem;
    font-weight: 500;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  `;
  
  placeholder.innerHTML = `
    <i class="ph ph-image-broken" style="font-size: 4rem; margin-bottom: 16px; opacity: 0.7;"></i>
    <span>Image could not be loaded</span>
    <span style="font-size: 0.9rem; opacity: 0.7; margin-top: 8px;">The image may be unavailable or corrupted</span>
  `;
  
  img.parentNode.replaceChild(placeholder, img);
}

function handleModalImageLoad(img) {
  // Image loaded successfully in modal
  console.log('Modal image loaded successfully:', img.src);
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

function updateMainImage(imageUrl, idx) {
  const mainImage = document.getElementById("main-gallery-image");
  const mainContainer = document.querySelector(".gallery-main");
  if (mainImage && mainContainer) {
    mainImage.src = imageUrl;
    mainContainer.setAttribute("data-idx", idx);
    
    // Update active thumb styling
    document.querySelectorAll(".gallery-thumb").forEach((thumb, i) => {
      if (i === parseInt(idx)) {
        thumb.style.borderColor = "var(--primary)";
        thumb.style.transform = "scale(1.05)";
      } else {
        thumb.style.borderColor = "transparent";
        thumb.style.transform = "scale(1)";
      }
    });
  }
}

function updateReviewMainImage(imageUrl, idx) {
  const mainImage = document.getElementById("review-gallery-image");
  const mainContainer = document.querySelector(".review-gallery-main");
  if (mainImage && mainContainer) {
    mainImage.src = imageUrl;
    mainContainer.setAttribute("data-idx", idx);
    
    // Update active thumb styling
    document.querySelectorAll(".review-gallery-thumb").forEach((thumb, i) => {
      if (i === parseInt(idx)) {
        thumb.style.borderColor = "var(--primary)";
        thumb.style.transform = "scale(1.05)";
      } else {
        thumb.style.borderColor = "transparent";
        thumb.style.transform = "scale(1)";
      }
    });
  }
}

// Image error handling functions
function handleImageError(img) {
  console.warn('Image failed to load:', img.src);
  
  // Try to find alternative image sources
  const container = img.closest('.gallery-main, .gallery-thumb');
  const idx = container ? parseInt(container.getAttribute('data-idx'), 10) : -1;
  
  // If we have gallery images, try the next available image
  if (window.galleryImages && idx >= 0 && window.galleryImages.length > 1) {
    const nextIdx = (idx + 1) % window.galleryImages.length;
    const nextImage = window.galleryImages[nextIdx];
    
    if (nextImage && nextImage !== img.src) {
      console.log(`Trying alternative image ${nextIdx}:`, nextImage);
      img.src = nextImage;
      return; // Give the alternative image a chance to load
    }
  }
  
  // Create a placeholder with hotel icon
  const placeholder = document.createElement('div');
  placeholder.style.cssText = `
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #64748b;
    font-size: 0.9rem;
    font-weight: 500;
    border: 2px dashed #cbd5e1;
  `;
  
  placeholder.innerHTML = `
    <i class="ph ph-image-broken" style="font-size: 3rem; margin-bottom: 8px; opacity: 0.6;"></i>
    <span>Image not available</span>
    <span style="font-size: 0.8rem; opacity: 0.7; margin-top: 4px;">Click disabled</span>
  `;
  
  // Replace the image with placeholder
  img.parentNode.replaceChild(placeholder, img);
  
  // Disable click functionality for broken images
  if (container) {
    container.style.cursor = 'default';
    container.onclick = null;
    container.removeEventListener('click', container._clickHandler);
    
    // Hide zoom overlay if it exists
    const overlay = container.querySelector('.zoom-overlay, .thumb-overlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
    
    // Add a visual indicator that this image is broken
    container.style.opacity = '0.6';
    container.style.filter = 'grayscale(100%)';
  }
}

function handleImageLoad(img) {
  // Image loaded successfully, ensure click functionality is enabled
  const container = img.closest('.gallery-main, .gallery-thumb');
  if (container) {
    container.style.cursor = 'pointer';
    container.style.opacity = '1';
    container.style.filter = 'none';
    
    // Ensure overlay is visible
    const overlay = container.querySelector('.zoom-overlay, .thumb-overlay');
    if (overlay) {
      overlay.style.display = 'flex';
    }
    
    // Remove loading indicator if it exists
    const loader = container.querySelector('.image-loader');
    if (loader) {
      loader.remove();
    }
  }
}

// Add loading indicator to images
function addImageLoader(container) {
  const loader = document.createElement('div');
  loader.className = 'image-loader';
  loader.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 40px;
    height: 40px;
    border: 3px solid rgba(59, 130, 246, 0.2);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    z-index: 10;
  `;
  
  container.style.position = 'relative';
  container.appendChild(loader);
}

function renderStaticDetailsOnly(staticData, durationMs) {
  console.log('renderStaticDetailsOnly called with:', { hasData: !!staticData, keys: staticData ? Object.keys(staticData) : [] });
  
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

  if (!staticInfo) {
    console.warn('renderStaticDetailsOnly: staticInfo is null, cannot render static details');
    return;
  }

  console.log('renderStaticDetailsOnly: staticInfo resolved', {
    name: staticInfo.name,
    hasImages: !!(staticInfo.images && staticInfo.images.length),
    imageCount: staticInfo.images?.length || 0,
    hasAmenities: !!staticInfo.amenities,
    hasDescriptions: !!staticInfo.descriptions,
    hasPolicies: !!staticInfo.policies,
    hasChain: !!staticInfo.chain,
    hasLocale: !!staticInfo.locale
  });

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
    <div class="detail-header-content" style="animation: slideDown 0.6s cubic-bezier(0.16, 1, 0.3, 1); display: flex; flex-direction: column; gap: 20px;">
      
      <!-- Top Title and Badges Row -->
      <div>
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px; flex-wrap: wrap;">
          ${starRating ? `
            <span style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: white; padding: 6px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.25); text-transform: uppercase; letter-spacing: 0.5px; transition: transform 0.2s ease;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
              <i class="ph-fill ph-star" style="font-size: 0.95rem;"></i> ${starRating} Star
            </span>
          ` : ''}
          ${propertyType ? `
            <span style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 6px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.25); text-transform: uppercase; letter-spacing: 0.5px; transition: transform 0.2s ease;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
              <i class="ph-fill ph-building" style="font-size: 0.95rem;"></i> ${propertyType}
            </span>
          ` : ''}
        </div>
        
        <h2 class="hotel-name-title" style="font-size: 2.6rem; margin: 0; font-weight: 800; line-height: 1.25; background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 60%, #8b5cf6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; letter-spacing: -0.5px; filter: drop-shadow(0 2px 8px rgba(0,0,0,0.02));">
          ${name}
        </h2>
      </div>
      
      <!-- Address Box (Luxury card design) -->
      ${addressDisplay ? `
        <div class="detail-address-box" style="display: flex; align-items: center; gap: 16px; padding: 18px 24px; background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(20px); border-radius: 16px; border: 1px solid rgba(59, 130, 246, 0.15); box-shadow: 0 10px 30px rgba(59, 130, 246, 0.04); transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);" onmouseover="this.style.transform='translateY(-2px)'; this.style.borderColor='rgba(59, 130, 246, 0.3)'; this.style.boxShadow='0 15px 35px rgba(59, 130, 246, 0.08)'" onmouseout="this.style.transform='none'; this.style.borderColor='rgba(59, 130, 246, 0.15)'; this.style.boxShadow='0 10px 30px rgba(59, 130, 246, 0.04)'">
          <div style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%); width: 46px; height: 46px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid rgba(59, 130, 246, 0.1); position: relative; overflow: hidden;">
            <div style="position: absolute; width: 100%; height: 100%; background: var(--primary); opacity: 0.05; animation: pulse 2s infinite;"></div>
            <i class="ph-bold ph-map-pin" style="font-size: 1.4rem; color: var(--primary); position: relative; z-index: 2;"></i>
          </div>
          <div style="flex-grow: 1;">
            <div style="font-size: 0.75rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px;">Property Location</div>
            <p style="margin: 0; color: #1e293b; font-size: 0.98rem; line-height: 1.5; font-weight: 600; letter-spacing: -0.1px;">${addressDisplay}</p>
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
  let validImages = []; // Declare outside to use later

  // Hero Gallery with animations - First image large, others small
  if (staticInfo.images && Array.isArray(staticInfo.images) && staticInfo.images.length > 0) {
    staticInfo.images.forEach((img) => {
      let imageUrl = '';
      if (typeof img === 'string') {
        imageUrl = img;
      } else if (img && typeof img === 'object') {
        // Handle all possible link key formats from the API
        if (img.links) {
          // Priority order: original > XXL > XL > Standard > Unknown > any first key
          const linkKeys = ['original', 'XXL', 'XL', 'Standard', 'Unknown'];
          for (const key of linkKeys) {
            if (img.links[key]?.href) {
              imageUrl = img.links[key].href;
              break;
            }
          }
          // Fallback: grab the first available link if none of the known keys matched
          if (!imageUrl) {
            const firstKey = Object.keys(img.links)[0];
            if (firstKey && img.links[firstKey]?.href) {
              imageUrl = img.links[firstKey].href;
            }
          }
        } else if (img.url) {
          imageUrl = img.url;
        } else if (img.imageUrl) {
          imageUrl = img.imageUrl;
        }
      }
      
      // More thorough URL validation
      if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim().length > 0) {
        const trimmedUrl = imageUrl.trim();
        // Check if it's a valid URL format
        if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://') || trimmedUrl.startsWith('//')) {
          // Avoid obviously broken URLs
          if (!trimmedUrl.includes('placeholder') && !trimmedUrl.includes('no-image') && !trimmedUrl.includes('404')) {
            validImages.push(trimmedUrl);
          }
        }
      }
    });

    if (validImages.length > 0) {
      window.galleryImages = validImages;
      
      staticHTML += `
        <div class="hotel-gallery-section" style="margin-bottom: 28px; animation: fadeInUp 0.8s ease-out;">
          <h3 style="margin: 0 0 16px 0; font-size: 1.2rem; display: flex; align-items: center; gap: 10px; font-weight: 700; color: var(--text-main);">
            <i class="ph ph-images" style="font-size: 1.4rem; color: var(--primary);"></i> 
            Hotel Gallery 
            <span style="font-size: 0.9rem; font-weight: 500; color: var(--text-muted);">(${validImages.length} photo${validImages.length !== 1 ? 's' : ''})</span>
          </h3>
          
          <!-- Main Image with Click to Zoom -->
          <div style="margin-bottom: 16px; position: relative;">
            <div class="gallery-main" data-idx="0" onclick="openImageZoom(document.getElementById('main-gallery-image').src)" style="width: 100%; height: 400px; border-radius: 16px; overflow: hidden; cursor: pointer; border: 3px solid transparent; transition: all 0.3s ease; box-shadow: 0 8px 24px rgba(0,0,0,0.15); position: relative;">
              <img id="main-gallery-image" src="${validImages[0]}" alt="Hotel main image" style="width: 100%; height: 100%; object-fit: cover;" onerror="handleImageError(this)" onload="handleImageLoad(this)">
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
            <div class="gallery-thumbs-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 12px; max-height: 240px; overflow-y: auto; padding: 12px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; border: 2px solid rgba(59, 130, 246, 0.1);">
              ${validImages.map((img, idx) => `
                <div class="gallery-thumb" data-idx="${idx}" onclick="updateMainImage(window.galleryImages[${idx}], ${idx})" style="aspect-ratio: 1; border-radius: 10px; overflow: hidden; cursor: pointer; border: 3px solid ${idx === 0 ? 'var(--primary)' : 'transparent'}; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.12); position: relative;">
                  <img src="${img}" alt="Hotel image ${idx + 1}" style="width: 100%; height: 100%; object-fit: cover;" onerror="handleImageError(this)" onload="handleImageLoad(this)">
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

  // Location Section - Luxury Card Redesign
  if (staticInfo.locale) {
    const addr = staticInfo.locale.address || {};
    staticHTML += `
      <div style="margin-bottom: 24px; animation: fadeInUp 0.8s ease-out 0.3s both;">
        <h3 style="margin: 0 0 14px 0; font-size: 1.25rem; display: flex; align-items: center; gap: 10px; font-weight: 700; color: #1e293b;">
          <i class="ph ph-map-pin" style="font-size: 1.45rem; color: var(--primary);"></i> Location Details
        </h3>
        <div style="background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(20px); border: 1px solid rgba(59, 130, 246, 0.15); border-radius: 16px; padding: 20px; box-shadow: 0 10px 30px rgba(59, 130, 246, 0.03);">
          ${addr.fulladdr ? `
            <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px dashed rgba(226, 232, 240, 0.8);">
              <div style="font-size: 0.75rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px;">Full Address</div>
              <p style="margin: 0; color: #334155; font-size: 0.95rem; line-height: 1.5; font-weight: 600;">${addr.fulladdr}</p>
            </div>
          ` : ''}
          <div class="location-details-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px;">
            ${addr.city ? `
              <div style="padding: 12px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid rgba(226, 232, 240, 0.8); border-radius: 12px; transition: all 0.3s ease;" onmouseover="this.style.borderColor='rgba(59, 130, 246, 0.3)'; this.style.transform='translateY(-1px)'" onmouseout="this.style.borderColor='rgba(226, 232, 240, 0.8)'; this.style.transform='none'">
                <div style="font-size: 0.7rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">City</div>
                <div style="font-size: 0.9rem; font-weight: 700; color: #1e293b;">${addr.city}</div>
              </div>
            ` : ''}
            ${addr.region ? `
              <div style="padding: 12px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid rgba(226, 232, 240, 0.8); border-radius: 12px; transition: all 0.3s ease;" onmouseover="this.style.borderColor='rgba(59, 130, 246, 0.3)'; this.style.transform='translateY(-1px)'" onmouseout="this.style.borderColor='rgba(226, 232, 240, 0.8)'; this.style.transform='none'">
                <div style="font-size: 0.7rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Region</div>
                <div style="font-size: 0.9rem; font-weight: 700; color: #1e293b;">${addr.region}</div>
              </div>
            ` : ''}
            ${staticInfo.locale.coordinates ? `
              <div style="padding: 12px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid rgba(226, 232, 240, 0.8); border-radius: 12px; transition: all 0.3s ease;" onmouseover="this.style.borderColor='rgba(59, 130, 246, 0.3)'; this.style.transform='translateY(-1px)'" onmouseout="this.style.borderColor='rgba(226, 232, 240, 0.8)'; this.style.transform='none'">
                <div style="font-size: 0.7rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Coordinates</div>
                <div style="font-size: 0.85rem; font-weight: 700; color: #1e293b; letter-spacing: -0.2px;">${staticInfo.locale.coordinates.lat}, ${staticInfo.locale.coordinates.long}</div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  // Policies Section - Check-in & Check-out Redesign
  if (staticInfo.policies?.checkInCheckOut) {
    const policy = staticInfo.policies.checkInCheckOut;
    staticHTML += `
      <div style="margin-bottom: 24px; animation: fadeInUp 0.8s ease-out 0.4s both;">
        <h3 style="margin: 0 0 14px 0; font-size: 1.25rem; display: flex; align-items: center; gap: 10px; font-weight: 700; color: #1e293b;">
          <i class="ph ph-clock" style="font-size: 1.45rem; color: var(--primary);"></i> Check-in & Check-out
        </h3>
        <div class="checkin-checkout-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px;">
          <!-- Check-in Card -->
          <div style="background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(20px); border: 1px solid rgba(59, 130, 246, 0.15); border-radius: 16px; padding: 18px; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 6px 20px rgba(59, 130, 246, 0.02);" onmouseover="this.style.borderColor='#3b82f6'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 12px 24px rgba(59, 130, 246, 0.08)';" onmouseout="this.style.borderColor='rgba(59, 130, 246, 0.15)'; this.style.transform='none'; this.style.boxShadow='0 6px 20px rgba(59, 130, 246, 0.02)';">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <div style="background: rgba(59, 130, 246, 0.1); width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                <i class="ph ph-sign-in" style="font-size: 1.1rem; color: #3b82f6;"></i>
              </div>
              <div style="font-size: 0.75rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Check-in</div>
            </div>
            <div style="font-size: 1.35rem; font-weight: 800; color: #1e293b; margin-bottom: 4px; letter-spacing: -0.3px;">${policy.checkin_from || 'N/A'}</div>
            ${policy.checkin_till ? `<div style="font-size: 0.8rem; color: #64748b; font-weight: 500;">Until ${policy.checkin_till}</div>` : ''}
            ${policy.checkin_min_age ? `<div style="font-size: 0.75rem; color: #64748b; margin-top: 8px; padding-top: 8px; border-top: 1px dashed rgba(226, 232, 240, 0.8); font-weight: 500;">Min Age Required: <span style="font-weight: 700; color: #1e293b;">${policy.checkin_min_age} yrs</span></div>` : ''}
          </div>
          
          <!-- Check-out Card -->
          <div style="background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(20px); border: 1px solid rgba(245, 158, 11, 0.15); border-radius: 16px; padding: 18px; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 6px 20px rgba(245, 158, 11, 0.02);" onmouseover="this.style.borderColor='#f59e0b'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 12px 24px rgba(245, 158, 11, 0.08)';" onmouseout="this.style.borderColor='rgba(245, 158, 11, 0.15)'; this.style.transform='none'; this.style.boxShadow='0 6px 20px rgba(245, 158, 11, 0.02)';">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <div style="background: rgba(245, 158, 11, 0.1); width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                <i class="ph ph-sign-out" style="font-size: 1.1rem; color: #f59e0b;"></i>
              </div>
              <div style="font-size: 0.75rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Check-out</div>
            </div>
            <div style="font-size: 1.35rem; font-weight: 800; color: #1e293b; margin-bottom: 4px; letter-spacing: -0.3px;">${policy.checkout_from || 'N/A'}</div>
            <div style="font-size: 0.8rem; color: #64748b; font-weight: 500;">Before this time</div>
          </div>
        </div>
      </div>
    `;
  }

  // Hotel Description Section
  if (staticInfo.descriptions) {
    const desc = staticInfo.descriptions;
    let descriptionContent = '';
    
    // Parse headline
    if (desc.headline && typeof desc.headline === 'string') {
      descriptionContent += `<div style="color: #334155; font-size: 0.95rem; line-height: 1.7; margin-bottom: 12px;">${desc.headline}</div>`;
    }
    
    // Parse default description (may be JSON string with sub-sections)
    if (desc.default) {
      let defaultDesc = desc.default;
      try {
        if (typeof defaultDesc === 'string' && defaultDesc.trim().startsWith('{')) {
          const parsed = JSON.parse(defaultDesc);
          const sectionIcons = {
            location: 'ph-map-pin', amenities: 'ph-sparkle', rooms: 'ph-bed',
            dining: 'ph-fork-knife', business_amenities: 'ph-briefcase',
            attractions: 'ph-binoculars', spoken_languages: 'ph-translate',
            onsite_payments: 'ph-credit-card', headline: 'ph-info'
          };
          Object.entries(parsed).forEach(([key, value]) => {
            if (value && key !== 'headline') {
              const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
              const icon = sectionIcons[key] || 'ph-dot-outline';
              descriptionContent += `
                <div style="margin-bottom: 12px; padding: 12px; background: #f8fafc; border-radius: 10px; border: 1px solid #f1f5f9;">
                  <div style="font-size: 0.8rem; font-weight: 600; color: var(--primary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                    <i class="ph ${icon}" style="font-size: 1rem;"></i> ${label}
                  </div>
                  <div style="color: #475569; font-size: 0.88rem; line-height: 1.6;">${value}</div>
                </div>
              `;
            }
          });
        } else if (typeof defaultDesc === 'string') {
          descriptionContent += `<div style="color: #475569; font-size: 0.9rem; line-height: 1.6;">${defaultDesc}</div>`;
        }
      } catch (e) {
        descriptionContent += `<div style="color: #475569; font-size: 0.9rem; line-height: 1.6;">${defaultDesc}</div>`;
      }
    }

    if (descriptionContent) {
      staticHTML += `
        <div style="margin-bottom: 24px; animation: fadeInUp 0.8s ease-out 0.15s both;">
          <h3 style="margin: 0 0 14px 0; font-size: 1.25rem; display: flex; align-items: center; gap: 10px; font-weight: 700; color: #1e293b;">
            <i class="ph ph-book-open-text" style="font-size: 1.45rem; color: var(--primary);"></i> Hotel Description
          </h3>
          <div style="background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(20px); border: 1px solid rgba(59, 130, 246, 0.15); border-radius: 16px; padding: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.02);">
            <div class="expandable-text" style="position: relative; max-height: 140px; overflow: hidden; transition: max-height 0.3s ease;">
              ${descriptionContent}
              <div class="expand-fade" style="position: absolute; bottom: 0; left: 0; right: 0; height: 60px; background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,1)); pointer-events: none;"></div>
            </div>
            <button onclick="toggleExpandText(this)" class="btn-ghost" style="margin-top: 12px; padding: 8px 16px; color: var(--primary); font-weight: 700; font-size: 0.88rem; border-radius: 8px; background: rgba(59, 130, 246, 0.05); display: inline-flex; align-items: center; gap: 6px; border: 1px solid rgba(59, 130, 246, 0.1); cursor: pointer; transition: all 0.3s ease;" onmouseover="this.style.background='rgba(59, 130, 246, 0.1)'; this.style.borderColor='rgba(59, 130, 246, 0.2)';" onmouseout="this.style.background='rgba(59, 130, 246, 0.05)'; this.style.borderColor='rgba(59, 130, 246, 0.1)';">Read More <i class="ph ph-caret-down"></i></button>
          </div>
        </div>
      `;
    }
  }

  // Chain Info Section
  if (staticInfo.chain && staticInfo.chain.name) {
    staticHTML += `
      <div style="margin-bottom: 24px; animation: fadeInUp 0.8s ease-out 0.25s both;">
        <div style="display: inline-flex; align-items: center; gap: 12px; background: linear-gradient(135deg, rgba(139, 92, 246, 0.06) 0%, rgba(59, 130, 246, 0.06) 100%); padding: 12px 20px; border-radius: 14px; border: 1px solid rgba(139, 92, 246, 0.15); box-shadow: 0 4px 15px rgba(139, 92, 246, 0.05); transition: transform 0.2s ease;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
          <div style="background: rgba(139, 92, 246, 0.1); width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
            <i class="ph ph-buildings" style="font-size: 1.25rem; color: #8b5cf6;"></i>
          </div>
          <div>
            <div style="font-size: 0.72rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 2px;">Hotel Chain</div>
            <div style="font-size: 1.05rem; font-weight: 700; color: #1e293b; letter-spacing: -0.2px;">${staticInfo.chain.name}</div>
          </div>
        </div>
      </div>
    `;
  }

  // Phone & Fax Section - Redesigned Dial Buttons
  if (staticInfo.locale?.phone?.length > 0 || staticInfo.locale?.fax?.length > 0) {
    let contactItems = '';
    if (staticInfo.locale.phone && staticInfo.locale.phone.length > 0) {
      staticInfo.locale.phone.forEach(p => {
        contactItems += `
          <div style="display: flex; align-items: center; gap: 8px; padding: 10px 16px; background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.15); border-radius: 12px; transition: all 0.3s ease; cursor: pointer;" onmouseover="this.style.transform='translateY(-1px)'; this.style.borderColor='rgba(16, 185, 129, 0.3)'; this.style.background='rgba(16, 185, 129, 0.08)';" onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='rgba(16, 185, 129, 0.15)'; this.style.background='rgba(16, 185, 129, 0.05)';">
            <i class="ph-fill ph-phone" style="font-size: 1.1rem; color: #10b981;"></i>
            <span style="font-size: 0.92rem; color: #115e59; font-weight: 700; letter-spacing: -0.1px;">${p}</span>
          </div>
        `;
      });
    }
    if (staticInfo.locale.fax && staticInfo.locale.fax.length > 0) {
      staticInfo.locale.fax.forEach(f => {
        contactItems += `
          <div style="display: flex; align-items: center; gap: 8px; padding: 10px 16px; background: rgba(99, 102, 241, 0.05); border: 1px solid rgba(99, 102, 241, 0.15); border-radius: 12px; transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-1px)'; this.style.borderColor='rgba(99, 102, 241, 0.3)'; this.style.background='rgba(99, 102, 241, 0.08)';" onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='rgba(99, 102, 241, 0.15)'; this.style.background='rgba(99, 102, 241, 0.05)';">
            <i class="ph-fill ph-printer" style="font-size: 1.1rem; color: #6366f1;"></i>
            <span style="font-size: 0.92rem; color: #3730a3; font-weight: 700; letter-spacing: -0.1px;">Fax: ${f}</span>
          </div>
        `;
      });
    }
    staticHTML += `
      <div style="margin-bottom: 24px; animation: fadeInUp 0.8s ease-out 0.35s both;">
        <h3 style="margin: 0 0 14px 0; font-size: 1.25rem; display: flex; align-items: center; gap: 10px; font-weight: 700; color: #1e293b;">
          <i class="ph ph-phone-call" style="font-size: 1.45rem; color: var(--primary);"></i> Property Contact
        </h3>
        <div style="display: flex; flex-wrap: wrap; gap: 12px;">
          ${contactItems}
        </div>
      </div>
    `;
  }

  // Policies Section - Special Instructions, Know Before You Go, Mandatory Fees Redesign
  if (staticInfo.policies) {
    const pol = staticInfo.policies;
    let policyHTML = '';

    // Helper to parse JSON-encoded policy strings
    const parsePolicyText = (raw) => {
      if (!raw) return '';
      try {
        if (typeof raw === 'string' && raw.trim().startsWith('{')) {
          const parsed = JSON.parse(raw);
          return Object.entries(parsed).map(([key, value]) => {
            if (!value) return '';
            const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            return `<div style="margin-bottom: 10px;"><strong style="color: #1e293b; font-size: 0.88rem; font-weight: 700;">${label}:</strong> <span style="color: #475569; font-size: 0.88rem; line-height: 1.55; font-weight: 500;">${value}</span></div>`;
          }).join('');
        }
        return `<div style="color: #475569; font-size: 0.88rem; line-height: 1.55; font-weight: 500;">${raw}</div>`;
      } catch (e) {
        return `<div style="color: #475569; font-size: 0.88rem; line-height: 1.55; font-weight: 500;">${raw}</div>`;
      }
    };

    const wrapExpandable = (content) => {
      return `
        <div class="expandable-text" style="position: relative; max-height: 110px; overflow: hidden; transition: max-height 0.3s ease;">
          ${content}
          <div class="expand-fade" style="position: absolute; bottom: 0; left: 0; right: 0; height: 50px; background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,1)); pointer-events: none;"></div>
        </div>
        <button onclick="toggleExpandText(this)" class="btn-ghost" style="margin-top: 10px; padding: 6px 12px; color: var(--primary); font-weight: 700; font-size: 0.82rem; border-radius: 6px; background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.1); cursor: pointer; transition: all 0.3s ease;" onmouseover="this.style.background='rgba(59, 130, 246, 0.1)'" onmouseout="this.style.background='rgba(59, 130, 246, 0.05)'">Read More <i class="ph ph-caret-down"></i></button>
      `;
    };

    if (pol.special_instructions) {
      policyHTML += `
        <div style="margin-bottom: 16px; padding: 18px; background: linear-gradient(135deg, rgba(251, 191, 36, 0.03) 0%, rgba(245, 158, 11, 0.03) 100%); border-radius: 16px; border: 1px solid rgba(251, 191, 36, 0.12); border-left: 5px solid #f59e0b; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.02);">
          <div style="font-size: 0.85rem; font-weight: 700; color: #d97706; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
            <i class="ph-bold ph-warning-circle" style="font-size: 1.15rem;"></i> Special Instructions
          </div>
          ${wrapExpandable(parsePolicyText(pol.special_instructions))}
        </div>
      `;
    }

    if (pol.know_before_you_go) {
      policyHTML += `
        <div style="margin-bottom: 16px; padding: 18px; background: linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(99, 102, 241, 0.03) 100%); border-radius: 16px; border: 1px solid rgba(59, 130, 246, 0.12); border-left: 5px solid #3b82f6; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.02);">
          <div style="font-size: 0.85rem; font-weight: 700; color: #1d4ed8; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
            <i class="ph-bold ph-lightbulb" style="font-size: 1.15rem;"></i> Know Before You Go
          </div>
          ${wrapExpandable(parsePolicyText(pol.know_before_you_go))}
        </div>
      `;
    }

    if (pol.mandatory_fees) {
      policyHTML += `
        <div style="margin-bottom: 16px; padding: 18px; background: linear-gradient(135deg, rgba(239, 68, 68, 0.03) 0%, rgba(220, 38, 38, 0.03) 100%); border-radius: 16px; border: 1px solid rgba(239, 68, 68, 0.12); border-left: 5px solid #ef4444; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.02);">
          <div style="font-size: 0.85rem; font-weight: 700; color: #b91c1c; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
            <i class="ph-bold ph-currency-circle-dollar" style="font-size: 1.15rem;"></i> Mandatory Fees
          </div>
          ${wrapExpandable(parsePolicyText(pol.mandatory_fees))}
        </div>
      `;
    }

    if (policyHTML) {
      staticHTML += `
        <div style="margin-bottom: 24px; animation: fadeInUp 0.8s ease-out 0.45s both;">
          <h3 style="margin: 0 0 14px 0; font-size: 1.25rem; display: flex; align-items: center; gap: 10px; font-weight: 700; color: #1e293b;">
            <i class="ph ph-scroll" style="font-size: 1.45rem; color: var(--primary);"></i> Hotel Policies
          </h3>
          ${policyHTML}
        </div>
      `;
    }
  }

  // Add the static content to the page
  const staticDiv = document.createElement("div");
  staticDiv.id = "static-detail-content";
  staticDiv.innerHTML = staticHTML;
  resultsContainer.appendChild(staticDiv);

  // Global toggle Expand function (defined once)
  if (typeof window.toggleExpandText === 'undefined') {
    window.toggleExpandText = function(btn) {
      const container = btn.previousElementSibling;
      const fade = container.querySelector('.expand-fade');
      
      // Determine if it is currently expanded by checking max-height
      if (container.style.maxHeight === '120px' || container.style.maxHeight === '100px') {
        // Expand: limit to 400px and make it scrollable to prevent browser GPU freezing on massive text
        container.dataset.originalMaxHeight = container.style.maxHeight; // Store original
        container.style.maxHeight = '400px';
        container.style.overflowY = 'auto';
        if (fade) fade.style.display = 'none';
        btn.innerHTML = 'Read Less <i class="ph ph-caret-up"></i>';
      } else {
        // Collapse
        container.style.maxHeight = container.dataset.originalMaxHeight || '100px';
        container.style.overflowY = 'hidden';
        if (fade) fade.style.display = 'block';
        btn.innerHTML = 'Read More <i class="ph ph-caret-down"></i>';
      }
    };
  }

  // Store gallery images globally for the zoom functionality
  if (validImages && validImages.length > 0) {
    window.galleryImages = validImages;
    console.log('Gallery images set:', window.galleryImages);
    
    // Add debugging for click events
    setTimeout(() => {
      const mainGallery = document.querySelector('.gallery-main');
      const thumbGalleries = document.querySelectorAll('.gallery-thumb');
      
      console.log('Main gallery element:', mainGallery);
      console.log('Thumb gallery elements:', thumbGalleries.length);
      
      if (mainGallery) {
        console.log('Main gallery data-idx:', mainGallery.getAttribute('data-idx'));
      }
      
      thumbGalleries.forEach((thumb, idx) => {
        console.log(`Thumb ${idx} data-idx:`, thumb.getAttribute('data-idx'));
      });
    }, 100);
  }

  // Add loading indicator for room details (use appendChild to preserve gallery event handlers)
  const loadingIndicator = document.createElement('div');
  loadingIndicator.id = 'dynamic-loading-indicator';
  loadingIndicator.style.cssText = 'margin-top: 48px; margin-bottom: 32px; animation: fadeInUp 0.8s ease-out 0.6s both;';
  loadingIndicator.innerHTML = `
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
  `;
  resultsContainer.appendChild(loadingIndicator);

  if (timerUI && durationMs) {
    const timeoutInput = document.getElementById("timeoutMs");
    const threshold = timeoutInput ? parseInt(timeoutInput.value || "13000", 10) : 13000;
    timerUI.innerHTML = formatTimingStatus(durationMs, threshold);
    timerUI.classList.remove("hidden");
  }
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
    resultsContainer.innerHTML = `<div class="empty-state"><i class="ph ph-warning-circle"></i><p>No details found for this hotel.</p></div>`;
    return;
  }

  // Extract static detail content if it exists to preserve it
  const existingStaticContent = resultsContainer.querySelector('#static-detail-content');
  const staticContentHtml = existingStaticContent ? existingStaticContent.outerHTML : '';

  // Clear container completely and add search criteria display and static content
  let searchCriteriaHtml = "";
  if (globalSearchBody) {
    searchCriteriaHtml = generateSearchCriteriaDisplay(globalSearchBody, globalSearchBody.location, false);
  }
  resultsContainer.innerHTML = searchCriteriaHtml + staticContentHtml;

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
    resultsContainer.insertAdjacentHTML('beforeend', `<div class="empty-state"><i class="ph ph-bed"></i><p>No room options currently available.</p></div>`);
    return;
  }

  document.getElementById("detail-room-count").textContent = `(${hotel.options.length} Total)`;
  // Add room options section header with welcoming message and filters (use appendChild to preserve gallery)
  const roomOptionsHeader = document.createElement('div');
  roomOptionsHeader.style.cssText = 'margin-top: 40px; margin-bottom: 28px; animation: fadeInUp 0.8s ease-out both;';
  roomOptionsHeader.innerHTML = `
      <div class="excellent-rooms-banner" style="display: flex; justify-content: space-between; width: 100%; align-items: center; margin-bottom: 20px; padding: 20px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 16px; border: 1px solid rgba(59, 130, 246, 0.2);">
        <div class="banner-left" style="display: flex; align-items: center; gap: 16px;">
          <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem; box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3);">
            <i class="ph ph-check-circle"></i>
          </div>
          <div>
            <h3 style="margin: 0; font-size: 1.4rem; font-weight: 700; color: #1e293b;">Excellent! We Found ${hotel.options.length} Room Option${hotel.options.length !== 1 ? 's' : ''}</h3>
            <p style="margin: 4px 0 0 0; color: #64748b; font-size: 1rem; line-height: 1.5;">Book this hotel and enjoy your trip! All room types are available for your perfect stay.</p>
          </div>
        </div>
        <div class="banner-right" style="text-align: center; padding: 0 20px;">
          <div style="background: linear-gradient(135deg, var(--primary) 0%, rgba(139, 92, 246, 0.8) 100%); color: white; padding: 12px 24px; border-radius: 12px; font-size: 0.9rem; font-weight: 600; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3); margin-bottom: 8px;">
            <i class="ph ph-heart" style="margin-right: 6px;"></i> Ready to Book?
          </div>
          <p style="margin: 0; font-size: 0.85rem; color: #64748b; font-weight: 500;">Please review and book your preferred room</p>
        </div>
      </div>
      
      <!-- Filter Section -->
      <div class="room-filters-section" style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
          <i class="ph ph-funnel" style="font-size: 1.2rem; color: var(--primary);"></i>
          <h4 style="margin: 0; font-size: 1rem; font-weight: 600; color: var(--text-main);">Filter Room Options</h4>
        </div>
        
        <div class="filters-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
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
              <option value="passthrough">Passthrough</option>
              <option value="margin">Margin</option>
            </select>
          </div>
          
          <!-- Refundable Filter -->
          <div>
            <label style="display: block; font-size: 0.8rem; font-weight: 500; color: #64748b; margin-bottom: 4px;">Refundable</label>
            <select id="filter-refund" style="width: 100%; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.85rem; transition: all 0.3s ease;" onchange="applyRoomFilters()" onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='#e2e8f0'">
              <option value="">All</option>
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
              <option value="low_to_high">Price: Low to High</option>
              <option value="high_to_low">Price: High to Low</option>
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
  `;
  resultsContainer.appendChild(roomOptionsHeader);

  // Reset filter inputs
  document.getElementById("filter-room-name").value = "";
  document.getElementById("filter-meal").value = "";
  document.getElementById("filter-gst").value = "";
  document.getElementById("filter-refund").value = "";
  document.getElementById("filter-pan").value = "";
  document.getElementById("filter-passport").value = "";
  document.getElementById("filter-price").value = "low_to_high";

  // Sort room options by lowest price by default
  if (Array.isArray(hotel.options)) {
    hotel.options.sort((a, b) => {
      const priceA = a.pricing?.totalPrice ?? 0;
      const priceB = b.pricing?.totalPrice ?? 0;
      return priceA - priceB;
    });
  }

  // Render each option as a card
  hotel.options.forEach((option, idx) => {
    const card = document.createElement("div");
    card.className = "hotel-card detail-option-card fade-in";
    card.style.animation = `slideUp 0.5s ease-out ${0.5 + idx * 0.08}s both`;

    const roomNames = option.roomInfo?.map(r => `<i class="ph ph-bed"></i> ${r.name} ${r.id ? `<span class="hotel-id-badge" style="font-size:0.7rem; margin-left:6px; background:#f1f5f9; border:1px solid #e2e8f0; color:#475569; padding:2px 6px; border-radius:4px; display:inline-flex; align-items:center; gap:4px;"><i class="ph ph-identification-badge"></i> ID: ${r.id}</span>` : ''}`).join("<br>") ?? '<i class="ph ph-bed"></i> Standard Room';
    const roomIdsString = option.roomInfo?.map(r => r.id).join(" ").toLowerCase() || "";

    const currency = option.pricing?.currency ?? "INR";
    const basePrice = (option.pricing?.basePrice ?? 0).toFixed(2);
    const taxes = (option.pricing?.taxes ?? 0).toFixed(2);
    const discount = (option.pricing?.discount ?? 0).toFixed(2);
    const mf = (option.pricing?.mf ?? 0).toFixed(2);
    const mft = (option.pricing?.mft ?? 0).toFixed(2);
    const totalPrice = (option.pricing?.totalPrice ?? 0).toFixed(2);
    const gstClaimable = option.pricing?.gstClaimableAmount ? option.pricing.gstClaimableAmount.toFixed(2) : "0.00";
    const strikeThrough = option.pricing?.strikeThrough ? option.pricing.strikeThrough.toFixed(2) : null;

    const mealBasis = option.mealBasis || "Room Only";
    const isRefundable = option.cancellation?.isRefundable;

    const rawOptionType = option.optionType || "UNKNOWN";
    const optionTypeData = OPTION_TYPES[rawOptionType] || { name: rawOptionType, desc: "" };
    const optionTypeTitle = optionTypeData.desc ? `title="${optionTypeData.desc}"` : "";

    const gstType = option.compliance?.gstType || "NA";
    const panRequired = option.compliance?.panRequired ? "Yes" : "No";
    const passRequired = option.compliance?.passportRequired ? "Yes" : "No";

    // Lookup static room data
    const staticData = lastApiTransactions.staticDetail?.res || {};
    const staticRooms = staticData.rooms || {};
    
    let roomImagesHtml = "";
    let roomAmenitiesHtml = "";
    let bedConfigHtml = "";
    
    if (option.roomInfo && option.roomInfo.length > 0) {
      option.roomInfo.forEach(r => {
        let matchingStaticRoom = null;
        for (const key in staticRooms) {
          if (staticRooms[key].id == r.id) {
            matchingStaticRoom = staticRooms[key];
            break;
          }
        }
        
        if (matchingStaticRoom) {
          // Images
          if (matchingStaticRoom.images && matchingStaticRoom.images.length > 0 && !roomImagesHtml) {
            const imgSrc = matchingStaticRoom.images[0].links?.Standard?.href || matchingStaticRoom.images[0].links?.original?.href || matchingStaticRoom.images[0].links?.XXL?.href || matchingStaticRoom.images[0].links?.XL?.href;
            if (imgSrc) {
              roomImagesHtml = `
                <div style="width: 120px; height: 120px; flex-shrink: 0; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; margin-right: 16px;">
                  <img src="${imgSrc}" alt="${matchingStaticRoom.name || 'Room Image'}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.parentElement.style.display='none'">
                </div>
              `;
            }
          }
          
          // Amenities
          if (matchingStaticRoom.amenities && !roomAmenitiesHtml) {
            const amenitiesArr = Object.values(matchingStaticRoom.amenities).slice(0, 4); // Take first 4
            if (amenitiesArr.length > 0) {
              const amList = amenitiesArr.map(a => `<span style="font-size: 0.75rem; color: #475569; background: #f1f5f9; border: 1px solid #e2e8f0; padding: 2px 8px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;"><i class="ph ph-check" style="color: #10b981;"></i> ${a.name}</span>`).join("");
              roomAmenitiesHtml = `<div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px;">${amList}</div>`;
            }
          }
          
          // Bed Config
          if (matchingStaticRoom.bed_config?.configuration && !bedConfigHtml) {
             const configs = Object.values(matchingStaticRoom.bed_config.configuration);
             const beds = configs.map(c => `${c.quantity > 0 ? c.quantity : 1} ${c.type || 'Bed'}`).join(" & ");
             if (beds) {
               bedConfigHtml = `<div style="font-size: 0.82rem; color: #64748b; margin-top: 8px; display: flex; align-items: center; gap: 6px;"><i class="ph ph-bed"></i> <strong>Beds:</strong> ${beds}</div>`;
             }
          }
        }
      });
    }

    const commercialType = option.commercial?.type || "Net";
    const commission = option.commercial?.commission ? option.commercial.commission.toFixed(2) : "0.00";

    let inclusionsHtml = "";
    if (option.inclusions && option.inclusions.length > 0) {
      const incList = option.inclusions.map(i => `<li style="font-size:0.83rem; color:#475569; margin-bottom:6px; line-height:1.4;">${cleanText(i)}</li>`).join("");
      inclusionsHtml = `
        <details style="margin-top:12px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden; transition: all 0.3s ease;">
          <summary style="font-size:0.85rem; font-weight:600; color:#0f172a; padding:10px 14px; display:flex; align-items:center; justify-content:space-between; cursor:pointer; list-style:none; user-select:none;">
            <div style="display:flex; align-items:center; gap:8px;">
              <i class="ph ph-check-square-offset" style="color:var(--primary); font-size:1.05rem;"></i>
              <span>Inclusions & Special Requests</span>
            </div>
            <div style="font-size: 0.72rem; color: #475569; background: #e2e8f0; padding: 2px 8px; border-radius: 20px; font-weight: 700; display: flex; align-items: center; gap: 4px;">
              ${option.inclusions.length} Item(s) <i class="ph ph-caret-down"></i>
            </div>
          </summary>
          <div style="padding: 12px 14px 14px 14px; border-top: 1px dashed #cbd5e1; background: white; max-height: 200px; overflow-y: auto;">
            <ul style="margin:0; padding-left:18px;">
              ${incList}
            </ul>
          </div>
        </details>
      `;
    }

    let penaltiesHtml = "";
    if (isRefundable) {
      // Show green refundable box with table
      let freeTillDate = "Check-in";
      if (option.cancellation?.freeCancellationUntil) {
        freeTillDate = new Date(option.cancellation.freeCancellationUntil).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      } else if (option.cancellation?.penalties?.length > 0 && option.cancellation.penalties[0]?.from) {
        freeTillDate = new Date(option.cancellation.penalties[0].from).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      }
      
      let rowsHtml = "";
      if (option.cancellation?.penalties?.length > 0) {
        rowsHtml = option.cancellation.penalties.map(p => {
          const fromDate = p.from ? new Date(p.from).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Now";
          const toDate = p.to ? new Date(p.to).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Check-in";
          const amtText = p.amount === 0 ? '<span style="color:#10b981;">Free</span>' : `${currency} ${p.amount.toFixed(2)}`;
          const amountColor = p.amount === 0 ? '#10b981' : '#dc2626';
          return `
            <tr style="border-bottom: 1px solid rgba(16, 185, 129, 0.15); transition: background 0.2s;" onmouseover="this.style.background='rgba(16, 185, 129, 0.05)'" onmouseout="this.style.background='transparent'">
              <td style="padding: 10px 12px; font-size: 0.85rem; color: #065f46; font-weight: 500;">${fromDate}</td>
              <td style="padding: 10px 12px; font-size: 0.85rem; color: #065f46; font-weight: 500;">${toDate}</td>
              <td style="padding: 10px 12px; font-size: 0.85rem; font-weight: 700; color: ${amountColor};">${amtText}</td>
            </tr>
          `;
        }).join("");
      } else {
        rowsHtml = `
          <tr style="border-bottom: 1px solid rgba(16, 185, 129, 0.15);">
            <td style="padding: 10px 12px; font-size: 0.85rem; color: #065f46; font-weight: 600;"><i class="ph ph-shield-check" style="color: #10b981; margin-right: 6px;"></i>Free Cancellation</td>
            <td style="padding: 10px 12px; font-size: 0.85rem; color: #065f46; font-weight: 500;">${freeTillDate}</td>
            <td style="padding: 10px 12px; font-size: 0.85rem; font-weight: 700; color: #10b981;">Free</td>
          </tr>
        `;
      }

      penaltiesHtml = `
        <div style="margin-top: 12px; background: rgba(16, 185, 129, 0.06); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(16, 185, 129, 0.05);">
          <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.05) 100%); padding: 12px 14px; border-bottom: 1px solid rgba(16, 185, 129, 0.15);">
            <div style="font-size: 0.85rem; font-weight: 700; color: #059669; display: flex; align-items: center; gap: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
              <i class="ph ph-shield-check" style="font-size: 1.1rem;"></i> Fully Refundable - Cancellation Policy
            </div>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr>
                <th style="padding: 10px 12px; text-align: left; font-size: 0.75rem; font-weight: 600; color: #059669; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(16, 185, 129, 0.15);">From Date</th>
                <th style="padding: 10px 12px; text-align: left; font-size: 0.75rem; font-weight: 600; color: #059669; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(16, 185, 129, 0.15);">To Date</th>
                <th style="padding: 10px 12px; text-align: left; font-size: 0.75rem; font-weight: 600; color: #059669; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(16, 185, 129, 0.15);">Penalty Amount</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
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
      ? `<span style="background: #dcfce7; color: #166534; border: 1px solid #dcfce7; padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 500; display: inline-flex; align-items: center; gap: 4px;"><i class="ph ph-check-circle"></i> Refundable</span>`
      : `<span style="background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 500; display: inline-flex; align-items: center; gap: 4px;"><i class="ph ph-x-circle"></i> Non-Refundable</span>`;

    const dsRoomLeft = option.roomLeft !== undefined
      ? `<div style="margin-top: 16px; margin-bottom: 4px; font-size: 0.9rem; color: #b45309; display: flex; align-items: center; gap: 6px;"><i class="ph ph-fire"></i> <strong>Only ${option.roomLeft} room(s) left on our site</strong></div>`
      : '';
    const dsDeadline = option.deadlineDateTime
      ? `<div style="margin-bottom: 8px; font-size: 0.9rem; color: #475569; display: flex; align-items: center; gap: 6px;"><i class="ph ph-clock"></i> <strong>Cancellation Deadline: ${new Date(option.deadlineDateTime).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong></div>`
      : '';

    const nationalityHtml = data.nationality ? `<span class="data-pill pill-neutral"><i class="ph ph-globe"></i> Nat: ${data.nationality}</span>` : "";

    card.innerHTML = `
      <div class="room-details-section">
        <div style="display: flex; align-items: flex-start;">
          ${roomImagesHtml}
          <div style="flex-grow: 1;">
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <div class="room-title" style="font-size: 1.15rem; font-weight: 700; color: var(--text-dark); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin: 0; flex-direction: row;">
                ${roomNames}
              </div>
              <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                <span class="hotel-id-badge" style="font-size: 0.72rem; background: #f8fafc; border: 1px solid #e2e8f0; color: #64748b; padding: 2px 8px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px; font-weight: 600;"><i class="ph ph-hash"></i> Option ID: ${option.optionId}</span>
              </div>
            </div>
            ${bedConfigHtml}
            ${roomAmenitiesHtml}
          </div>
        </div>
        <div class="hotel-tags" style="margin-top: 16px;">
          <span class="data-pill pill-warning" ${optionTypeTitle}><i class="ph ph-tag"></i> ${optionTypeData.name}</span>
          <span class="data-pill pill-primary"><i class="ph ph-fork-knife"></i> ${mealBasis}</span>
          ${refundPill}
          <span class="data-pill pill-neutral"><i class="ph ph-coins"></i> ${currency}</span>
          ${nationalityHtml}
          <span class="data-pill ${gstType === 'PASSTHROUGH' ? 'pill-success' : 'pill-neutral'}">
            <i class="ph ph-receipt"></i> GST: ${gstType}
          </span>
          <span class="data-pill ${option.compliance?.panRequired ? 'pill-danger' : 'pill-success'}">
            <i class="ph ph-identification-card"></i> PAN: ${panRequired}
          </span>
          <span class="data-pill ${option.compliance?.passportRequired ? 'pill-danger' : 'pill-success'}">
            <i class="ph ph-passport"></i> Pass: ${passRequired}
          </span>
          <span class="data-pill pill-purple">
            <i class="ph ph-briefcase"></i> ${commercialType}: ${currency} ${commission}
          </span>
        </div>
        ${dsRoomLeft}
        ${dsDeadline}
        ${inclusionsHtml}
        ${penaltiesHtml}
      </div>

      <div class="hotel-price-row" style="flex-direction: column; align-items: stretch; border-top: none; padding-top: 0;">
        <!-- Breakdown Row -->
        <div class="price-breakdown" style="padding-top: 16px; border-top: 1px dashed #cbd5e1; margin-bottom: 12px;">
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
            <span class="price-label">GST Claimable</span>
            <span class="price-value" style="color:var(--primary)">${currency} ${gstClaimable}</span>
          </div>
        </div>

        <!-- Total Row -->
        <div style="border-top: 1px dashed #cbd5e1; padding-top: 16px; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; align-items: baseline; gap: 16px;">
              <span style="font-size: 1.1rem; font-weight: 800; color: #1e293b; letter-spacing: 0.05em;">TOTAL</span>
              <div style="display: flex; align-items: center; gap: 8px;">
                ${strikeThrough ? `<span style="text-decoration:line-through; font-size:1rem; color:#94a3b8;">${currency} ${strikeThrough}</span>` : ""}
                <span class="price-total" style="font-size: 2rem; font-weight: 900; color: var(--primary); letter-spacing: -1px;">${currency} ${totalPrice}</span>
              </div>
            </div>
            <div style="font-size: 0.85rem; color: #64748b; font-weight: 600; font-style: italic;">
              (${priceInWords(totalPrice)} Rupees Only)
            </div>
          </div>

          <button class="btn-premium" onclick="reviewRoom('${option.optionId}', '${data.correlationId}', ${option.pricing?.totalPrice ?? 0})" style="margin: 0; min-width: 180px;">
            <i class="ph ph-lock-key"></i> Review & Lock
          </button>
        </div>
      </div>
    `;

    resultsContainer.appendChild(card);
  });
}

function applyRoomFilters() {
  const nameEl = document.getElementById("filter-room-name");
  if (!nameEl) return; // Filters removed from UI

  const searchTerm = nameEl.value.toLowerCase();
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

  // Ensure Technical Details button is always kept at the very bottom of detail room list
  const techDetails = resultsContainer.querySelector(".tech-details-container");
  if (techDetails) {
    resultsContainer.appendChild(techDetails);
  }

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
  if (window.location.pathname !== '/home/review') {
    history.pushState({ view: 'review' }, '', '/home/review');
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

    // Extract hotelId and reviewHash from global detail data or sessionStorage
    let hotelId = "";
    let reviewHash = "";

    if (window.globalDetailData) {
      const detailData = window.globalDetailData;
      hotelId = detailData.hotelId || 
                detailData.hotel?.hotelId || 
                detailData.hotel?.id ||
                detailData.hid ||
                detailData.requestedHotelId ||
                (detailData.hotels && detailData.hotels[0]?.hotelId) || "";
      
      reviewHash = detailData.reviewHash || 
                   detailData.hotel?.reviewHash ||
                   detailData.hash ||
                   detailData.review_hash || "";
    }

    // Try loading from saved sessionState if they're empty
    const savedStateStr = sessionStorage.getItem('tj_page_state');
    if (savedStateStr) {
      try {
        const savedState = JSON.parse(savedStateStr);
        if (!hotelId) hotelId = savedState.requestedHotelId || "";
        if (!reviewHash) reviewHash = savedState.requestedReviewHash || "";
      } catch (e) {}
    }

    if (hotelId) {
      body.hotelId = hotelId;
    }
    if (reviewHash) {
      body.reviewHash = reviewHash;
    }

    // Immediately save initial page state with request info so refresh is safe
    const tempState = {
      page: 'review',
      searchBody: globalSearchBody,
      detailData: window.globalDetailData || null,
      requestedOptionId: optionId,
      requestedCorrelationId: correlationId,
      requestedHotelId: hotelId,
      requestedReviewHash: reviewHash,
      timestamp: Date.now()
    };
    sessionStorage.setItem('tj_page_state', JSON.stringify(tempState));

    // Switch UI to review page with loading state
    switchToReviewPage();

    const t0_review = performance.now();
    const res = await fetch(`${API_BASE}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const t1_review = performance.now();
    const responseMs = Math.round(t1_review - t0_review);

    const data = await res.json();
    
    // Store for Tech Details
    lastApiTransactions.review = {
      req: body,
      res: data,
      time: responseMs,
      status: res.status,
      url: '/review'
    };
    
    console.log('API_REVIEW_REQUEST', { duration: responseMs, status: res.status, ok: data.ok });
    
    // Track response time
    journeyResponseTimes.review = responseMs;
    displayResponseTimes();
    
    if (!res.ok || data.ok === false) {
      // Check if it's an expired hash error (errCode 7104 or contains refresh hotel details)
      const isExpiredHash = data.errors?.some(e => e.errCode === "7104" || (e.message && e.message.toLowerCase().includes("refresh hotel details")) || (e.details && e.details.toLowerCase().includes("refresh hotel details")));
      
      if (isExpiredHash && window._autoRetryReviewCount !== true) {
        window._autoRetryReviewCount = true; // Prevent infinite loop
        console.log("Review hash expired. Automatically refreshing hotel details to get a new hash and retrying review...");
        
        if (hotelId && optionId) {
          try {
            // Call fetchFreshDetailDataOnly programmatically to get fresh details
            const freshDetails = await fetchFreshDetailDataOnly(hotelId, optionId);
            if (freshDetails) {
              window.globalDetailData = freshDetails;
              // Reset auto-retry guard
              window._autoRetryReviewCount = false; 
              // Retry reviewRoom with the fresh reviewHash!
              await reviewRoom(optionId, correlationId, searchDisplayPrice);
              return;
            }
          } catch (retryErr) {
            console.error("Auto-retry failed:", retryErr);
          }
        }
      }
      
      renderReviewError(data.reason || "Review failed. Please check API configuration or response.", data);
      return;
    }

    renderReviewDetails(data, responseMs);
    
    // Add Technical Details
    const reviewContent = document.getElementById("review-content");
    if (reviewContent) reviewContent.insertAdjacentHTML('beforeend', renderTechnicalDetails('review'));
  } catch (err) {
    renderReviewError("Unexpected error while reviewing room.", err.message);
  }
}

function switchToReviewPage() {
  const detailPage = document.getElementById("detail-page");
  const reviewPage = document.getElementById("review-page");
  const reviewContent = document.getElementById("review-content");

  showActivePage("review-page");

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
  if (window.location.pathname !== '/home/review') {
    history.pushState({ view: 'review' }, '', '/home/review');
  }
}

function backToDetailFromReview() {
  const reviewPage = document.getElementById("review-page");
  const detailPage = document.getElementById("detail-page");

  showActivePage("detail-page");

  // Restore and save detail state
  const savedState = sessionStorage.getItem('tj_page_state');
  if (savedState) {
    try {
      const state = JSON.parse(savedState);
      state.page = 'detail';
      if (state.detailData) {
        window.globalDetailData = state.detailData;
        if (state.detailData.staticDetails) {
          renderStaticDetailsOnly(state.detailData.staticDetails, 0);
        }
        renderHotelDetails(state.detailData);
      }
      sessionStorage.setItem('tj_page_state', JSON.stringify(state));
    } catch (e) {
      console.error("Error restoring detail page state:", e);
    }
  }

  // Back to Detail URL
  if (window.location.pathname !== '/home/detail') {
    history.pushState({ view: 'detail' }, '', '/home/detail');
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

  // Lookup static room data for image
  const staticData = lastApiTransactions.staticDetail?.res || {};
  const staticRooms = staticData.rooms || {};
  let roomImagesHtml = "";
  
  if (option.roomInfo && option.roomInfo.length > 0) {
    option.roomInfo.forEach(r => {
      let matchingStaticRoom = null;
      for (const key in staticRooms) {
        if (staticRooms[key].id == r.id) {
          matchingStaticRoom = staticRooms[key];
          break;
        }
      }
      
      if (matchingStaticRoom) {
        if (matchingStaticRoom.images && matchingStaticRoom.images.length > 0 && !roomImagesHtml) {
          const imgSrc = matchingStaticRoom.images[0].links?.Standard?.href || matchingStaticRoom.images[0].links?.original?.href || matchingStaticRoom.images[0].links?.XXL?.href || matchingStaticRoom.images[0].links?.XL?.href;
          if (imgSrc) {
            roomImagesHtml = `
              <div style="width: 100px; height: 100px; flex-shrink: 0; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; margin-right: 16px;">
                <img src="${imgSrc}" alt="${matchingStaticRoom.name || 'Room Image'}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.parentElement.style.display='none'">
              </div>
            `;
          }
        }
      }
    });
  }

  const currency = option.pricing?.currency ?? "INR";
  const totalPrice = (option.pricing?.totalPrice ?? 0).toFixed(2);
  const basePrice = (option.pricing?.basePrice ?? 0).toFixed(2);
  const taxes = (option.pricing?.taxes ?? 0).toFixed(2);
  const discount = (option.pricing?.discount ?? 0).toFixed(2);
  const mf = (option.pricing?.mf ?? 0).toFixed(2);
  const mft = (option.pricing?.mft ?? 0).toFixed(2);
  const isRefundable = option.cancellation?.isRefundable;
  const onholdAllowed = data.onholdAllowed;
  const gstClaimable = option.pricing?.gstClaimableAmount ? option.pricing.gstClaimableAmount.toFixed(2) : "0.00";
  const strikeThrough = option.pricing?.strikeThrough ? option.pricing.strikeThrough.toFixed(2) : null;
  const gstType = option.compliance?.gstType || "NA";
  const prefilledGstNumber = option.compliance?.gstInfo?.gstNumber || option.gstInfo?.gstNumber || data.gstInfo?.gstNumber || "";
  const prefilledGstName = option.compliance?.gstInfo?.registeredName || option.gstInfo?.registeredName || data.gstInfo?.registeredName || "";

  const priceChangedBadge = data.priceChanged
    ? `<span class="data-pill pill-warning" style="font-size:0.8rem;"><i class="ph ph-warning"></i> Price Changed</span>`
    : `<span class="data-pill pill-success" style="font-size:0.8rem;"><i class="ph ph-check-circle"></i> Price Confirmed</span>`;

  const onholdBadge = onholdAllowed
    ? `<span class="data-pill pill-success" style="font-size:0.8rem;"><i class="ph ph-clock"></i> Hold Allowed</span>`
    : `<span class="data-pill pill-danger" style="font-size:0.8rem;"><i class="ph ph-x-circle"></i> Hold Not Allowed</span>`;

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

  const panReqHtml = `<span class="data-pill ${option.compliance?.panRequired ? 'pill-danger' : 'pill-success'}"><i class="ph ph-identification-card"></i> PAN: ${option.compliance?.panRequired ? 'Yes' : 'No'}</span>`;
  const passReqHtml = `<span class="data-pill ${option.compliance?.passportRequired ? 'pill-danger' : 'pill-success'}"><i class="ph ph-passport"></i> Pass: ${option.compliance?.passportRequired ? 'Yes' : 'No'}</span>`;
  const gstPill = `<span class="data-pill ${gstType === 'PASSTHROUGH' ? 'pill-success' : 'pill-neutral'}"><i class="ph ph-receipt"></i> GST: ${gstType}</span>`;

  let penaltiesHtml = "";
  if (isRefundable) {
    // Show green refundable box with table
    let freeTillDate = "Check-in";
    if (option.cancellation?.freeCancellationUntil) {
      freeTillDate = new Date(option.cancellation.freeCancellationUntil).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } else if (option.cancellation?.penalties?.length > 0 && option.cancellation.penalties[0]?.from) {
      freeTillDate = new Date(option.cancellation.penalties[0].from).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    
    let rowsHtml = "";
    if (option.cancellation?.penalties?.length > 0) {
      rowsHtml = option.cancellation.penalties.map(p => {
        const fromDate = p.from ? new Date(p.from).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Now";
        const toDate = p.to ? new Date(p.to).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Check-in";
        const amtText = p.amount === 0 ? '<span style="color:#10b981;">Free</span>' : `${currency} ${p.amount.toFixed(2)}`;
        const amountColor = p.amount === 0 ? '#10b981' : '#dc2626';
        return `
          <tr style="border-bottom: 2px solid #dcfce7;">
            <td style="padding: 10px 12px; font-size: 0.85rem; color: #166534;">${fromDate}</td>
            <td style="padding: 10px 12px; font-size: 0.85rem; color: #166534;">${toDate}</td>
            <td style="padding: 10px 12px; font-size: 0.85rem; font-weight: 700; color: ${amountColor};">${amtText}</td>
          </tr>
        `;
      }).join("");
    } else {
      rowsHtml = `
        <tr style="border-bottom: 1px solid #dcfce7;">
          <td style="padding: 10px 12px; font-size: 0.85rem; color: #166534; font-weight: 600;"><i class="ph ph-check-circle" style="color: #10b981; margin-right: 6px;"></i>Free Cancellation</td>
          <td style="padding: 10px 12px; font-size: 0.85rem; color: #166534;">${freeTillDate}</td>
          <td style="padding: 10px 12px; font-size: 0.85rem; font-weight: 700; color: #10b981;">Free</td>
        </tr>
      `;
    }

    penaltiesHtml = `
      <div style="margin-top:16px; background:linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border:2px solid #dcfce7; border-radius:12px; padding:16px; overflow:hidden;">
        <div style="font-size:0.9rem; font-weight:700; color:#166534; margin-bottom:12px; text-transform:uppercase; letter-spacing:0.5px; display:flex; align-items:center; gap:8px;">
          <i class="ph ph-check-circle"></i> Fully Refundable - Cancellation Penalties
        </div>
        <table style="width:100%; border-collapse:collapse;">
          <thead>
            <tr style="background:#f0fdf4; border-bottom:2px solid #dcfce7;">
              <th style="padding:10px 12px; text-align:left; font-size:0.75rem; font-weight:700; color:#166534; text-transform:uppercase; letter-spacing:0.5px;">From Date</th>
              <th style="padding:10px 12px; text-align:left; font-size:0.75rem; font-weight:700; color:#166534; text-transform:uppercase; letter-spacing:0.5px;">To Date</th>
              <th style="padding:10px 12px; text-align:left; font-size:0.75rem; font-weight:700; color:#166534; text-transform:uppercase; letter-spacing:0.5px;">Penalty Amount</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>`;
  } else if (option.cancellation?.penalties?.length > 0) {
    // Show red non-refundable box with penalties table
    penaltiesHtml = `
      <div style="margin-top: 16px; background: rgba(239, 68, 68, 0.04); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(239, 68, 68, 0.05);">
        <div style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%); padding: 12px 14px; border-bottom: 1px solid rgba(239, 68, 68, 0.1);">
          <div style="font-size: 0.85rem; font-weight: 700; color: #dc2626; display: flex; align-items: center; gap: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
            <i class="ph ph-shield-warning" style="font-size: 1.1rem;"></i> Non-Refundable - Cancellation Policy
          </div>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="padding: 10px 12px; text-align: left; font-size: 0.75rem; font-weight: 600; color: #dc2626; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(239, 68, 68, 0.15);">From Date</th>
              <th style="padding: 10px 12px; text-align: left; font-size: 0.75rem; font-weight: 600; color: #dc2626; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(239, 68, 68, 0.15);">To Date</th>
              <th style="padding: 10px 12px; text-align: left; font-size: 0.75rem; font-weight: 600; color: #dc2626; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(239, 68, 68, 0.15);">Penalty Amount</th>
            </tr>
          </thead>
          <tbody>
            ${option.cancellation.penalties.map(p => {
              const fromDate = p.from ? new Date(p.from).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Now';
              const toDate = p.to ? new Date(p.to).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Check-in';
              return `<tr style="border-bottom: 1px solid rgba(239, 68, 68, 0.15); transition: background 0.2s;" onmouseover="this.style.background='rgba(239, 68, 68, 0.05)'" onmouseout="this.style.background='transparent'">
                <td style="padding: 10px 12px; font-size: 0.85rem; color: #991b1b; font-weight: 500;">${fromDate}</td>
                <td style="padding: 10px 12px; font-size: 0.85rem; color: #991b1b; font-weight: 500;">${toDate}</td>
                <td style="padding: 10px 12px; font-size: 0.85rem; font-weight: 700; color: #dc2626;">${currency} ${p.amount.toFixed(2)}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;
  }

  // Room Left & Deadline Info
  const roomLeftHtml = option.roomLeft !== undefined
    ? `<div style="margin-top: 12px; font-size: 0.9rem; color: #b45309; display: flex; align-items: center; gap: 6px;">
         <i class="ph ph-fire"></i> <strong>Only ${option.roomLeft} room(s) left on our site</strong>
       </div>`
    : '';

  const deadlineHtml = option.deadlineDateTime
    ? `<div style="margin-top: 8px; font-size: 0.9rem; color: #475569; display: flex; align-items: center; gap: 6px;">
         <i class="ph ph-clock"></i> <strong>Cancellation Deadline: ${new Date(option.deadlineDateTime).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
       </div>`
    : '';
    
  const combinedRoomDeadlineHtml = roomLeftHtml + deadlineHtml;

  // Commercial / Commission Info
  const commissionAmt = option.commercial?.commission ? option.commercial.commission.toFixed(2) : "0.00";
  const commercialHtml = `
    <div style="margin-top: 16px; font-size: 0.85rem; color: var(--text-muted); display: flex; flex-direction: column; gap: 4px;">
       <div style="display: flex; align-items: center; gap: 6px;"><i class="ph ph-receipt"></i> <strong>Commercial:</strong> ${option.commercial?.type || "Net"}</div>
       <div style="display: flex; align-items: center; gap: 6px;"><i class="ph ph-percent"></i> <strong>Commission:</strong> ${currency} ${commissionAmt}</div>
    </div>
  `;

  // Delivery Defaults
  const defaultPhone = "1234567890";
  const defaultEmail = "v3testingtj@gmail.com";

  // Inclusions pills
  let inclusionsHtml = '';
  if (option.inclusions && option.inclusions.length > 0) {
    const incList = option.inclusions.map(function(inc) {
      return '<li style="font-size:0.83rem; color:#475569; margin-bottom:6px; line-height:1.4;">' + cleanText(inc) + '</li>';
    }).join('');
    
    inclusionsHtml = `
      <details style="margin-top:16px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden; transition: all 0.3s ease;">
        <summary style="font-size:0.85rem; font-weight:600; color:#0f172a; padding:10px 14px; display:flex; align-items:center; justify-content:space-between; cursor:pointer; list-style:none; user-select:none;">
          <div style="display:flex; align-items:center; gap:8px;">
            <i class="ph ph-list-checks" style="color:var(--primary); font-size:1.05rem;"></i>
            <span>Package Inclusions & Requests</span>
          </div>
          <div style="font-size: 0.72rem; color: #475569; background: #e2e8f0; padding: 2px 8px; border-radius: 20px; font-weight: 700; display: flex; align-items: center; gap: 4px;">
            ${option.inclusions.length} Item(s) <i class="ph ph-caret-down"></i>
          </div>
        </summary>
        <div style="padding: 12px 14px 14px 14px; border-top: 1px dashed #cbd5e1; background: white; max-height: 200px; overflow-y: auto;">
          <ul style="margin:0; padding-left:18px;">
            ${incList}
          </ul>
        </div>
      </details>
    `;
  }

  // Booking Notes
  let bookingNotesHtml = '';
  if (option.bookingNotes) {
    const cleanedNotes = cleanText(option.bookingNotes);
    bookingNotesHtml = `
      <details style="margin-top:16px; background:#fffbeb; border:1px solid #fde68a; border-radius:10px; overflow:hidden; transition: all 0.3s ease;">
        <summary style="font-size:0.8rem; font-weight:700; color:#92400e; padding:12px 14px; display:flex; align-items:center; justify-content:space-between; cursor:pointer; list-style:none; user-select:none;">
          <div style="display:flex; align-items:center; gap:8px;">
            <i class="ph ph-note" style="font-size:1.05rem;"></i>
            <span>IMPORTANT BOOKING NOTES</span>
          </div>
          <div style="font-size: 0.72rem; color: #92400e; background: rgba(253, 230, 138, 0.6); padding: 2px 8px; border-radius: 20px; font-weight: 700; display: flex; align-items: center; gap: 4px;">
            View Notes <i class="ph ph-caret-down"></i>
          </div>
        </summary>
        <div style="padding: 12px 14px 14px 14px; border-top: 1px dashed #fde68a; background: #fffdf5; max-height: 200px; overflow-y: auto; font-size:0.85rem; color:#92400e; line-height:1.6; white-space:pre-line;">
          ${cleanedNotes}
        </div>
      </details>
    `;
  }

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

  let galleryHtml = "";
  if (window.galleryImages && window.galleryImages.length > 0) {
    const validImages = window.galleryImages;
    galleryHtml = `
      <div class="hotel-gallery-section" style="margin-top: 16px; margin-bottom: 16px; animation: fadeInUp 0.8s ease-out;">
        <!-- Main Image with Click to Zoom -->
        <div style="margin-bottom: 10px; position: relative;">
          <div class="review-gallery-main" data-idx="0" onclick="openImageZoom(document.getElementById('review-gallery-image').src)" style="width: 100%; height: 280px; border-radius: 12px; overflow: hidden; cursor: pointer; border: 2px solid rgba(255,255,255,0.1); transition: all 0.3s ease; box-shadow: 0 4px 14px rgba(0,0,0,0.1); position: relative;">
            <img id="review-gallery-image" src="${validImages[0]}" alt="Hotel main image" style="width: 100%; height: 100%; object-fit: cover;" onerror="handleImageError(this)" onload="handleImageLoad(this)">
            <div class="zoom-overlay" style="position: absolute; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s ease;">
              <div style="background: white; color: var(--text-main); padding: 6px 12px; border-radius: 8px; font-weight: 600; font-size: 0.8rem; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                <i class="ph ph-magnifying-glass-plus" style="font-size: 1rem;"></i>
                Click to zoom
              </div>
            </div>
          </div>
        </div>
        
        <!-- Thumbnail Grid -->
        ${validImages.length > 1 ? `
          <div class="gallery-thumbs-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(70px, 1fr)); gap: 8px; max-height: 90px; overflow-y: auto; padding: 6px; background: rgba(0,0,0,0.02); border-radius: 10px; border: 1px solid rgba(0,0,0,0.05);">
            ${validImages.map((img, idx) => `
              <div class="review-gallery-thumb" data-idx="${idx}" onclick="updateReviewMainImage(window.galleryImages[${idx}], ${idx})" style="aspect-ratio: 1; border-radius: 8px; overflow: hidden; cursor: pointer; border: 2.5px solid ${idx === 0 ? 'var(--primary)' : 'transparent'}; transition: all 0.2s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.06); position: relative;">
                <img src="${img}" alt="Hotel image ${idx + 1}" style="width: 100%; height: 100%; object-fit: cover;" onerror="handleImageError(this)" onload="handleImageLoad(this)">
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  container.innerHTML = `
    <!-- Search Criteria Display -->
    ${globalSearchBody ? generateSearchCriteriaDisplay(globalSearchBody, globalSearchBody.location, false) : ''}
    
    ${timingBadge}
    ${priceAlert}
    
    <div class="review-layout" style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 24px;">
      
      <!-- Left Column: Hotel & Room Info -->
      <div class="review-left" style="flex: 1; min-width: 300px;">
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

        ${galleryHtml}

        ${stayDetailsHtml}

        <div style="background: rgba(248, 250, 252, 0.8); border: 1px solid #e2e8f0; border-radius: var(--radius-md); padding: 16px; margin-top: 20px;">
           <h4 style="margin-top: 0; margin-bottom: 12px; font-size: 1.1rem; color: var(--text-dark); display:flex; align-items:center; justify-content:space-between;">
             <span><i class="ph ph-bed"></i> Room Selection</span>
             <span class="hotel-id-badge" style="font-size: 0.75rem;"><i class="ph ph-hash"></i> Opt: ${option.optionId}</span>
           </h4>
           <div style="display: flex; align-items: flex-start;">
             ${roomImagesHtml}
             <div style="flex-grow: 1;">
               <div style="font-weight: 500; color: var(--text-main); line-height: 1.6;">${roomNames}</div>
               
               ${combinedRoomDeadlineHtml}

               <div class="hotel-tags" style="margin-top: 16px;">
                 ${refundPill}
                 <span class="data-pill pill-primary"><i class="ph ph-fork-knife"></i> ${option.mealBasis || 'Room Only'}</span>
                 ${gstPill}
                 ${panReqHtml}
                 ${passReqHtml}
               </div>

               ${optionTypeHtml}
               
               ${inclusionsHtml}
               ${bookingNotesHtml}
               ${commercialHtml}
             </div>
           </div>
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
            <div class="delivery-phone-row" style="display:flex; gap:10px;">
              <div style="flex:0 0 82px;">
                <label style="display:block; font-size:0.75rem; font-weight:600; color:#6b7280; margin-bottom:5px; text-transform:uppercase; letter-spacing:0.5px;">Code</label>
                <input id="delivery-code" type="text" value="+91" style="width:100%; padding:10px 10px; border:1.5px solid #e5e7eb; border-radius:10px; font-size:0.9rem; background:#f9fafb; transition:border-color 0.2s;" onfocus="this.style.borderColor='#4f46e5';this.style.background='white'" onblur="this.style.borderColor='#e5e7eb';this.style.background='#f9fafb'" />
              </div>
              <div style="flex:1;">
                <label style="display:block; font-size:0.75rem; font-weight:600; color:#6b7280; margin-bottom:5px; text-transform:uppercase; letter-spacing:0.5px;">Mobile Number</label>
                <input id="delivery-phone" type="tel" value="${defaultPhone}" style="width:100%; padding:10px 14px; border:1.5px solid #e5e7eb; border-radius:10px; font-size:0.9rem; background:#f9fafb; transition:border-color 0.2s;" onfocus="this.style.borderColor='#4f46e5';this.style.background='white'" onblur="this.style.borderColor='#e5e7eb';this.style.background='#f9fafb'" />
              </div>
            </div>
            <div>
              <label style="display:block; font-size:0.75rem; font-weight:600; color:#6b7280; margin-bottom:5px; text-transform:uppercase; letter-spacing:0.5px;">Email Address</label>
              <input id="delivery-email" type="email" value="${defaultEmail}" style="width:100%; padding:10px 14px; border:1.5px solid #e5e7eb; border-radius:10px; font-size:0.9rem; background:#f9fafb; transition:border-color 0.2s;" onfocus="this.style.borderColor='#059669';this.style.background='white'" onblur="this.style.borderColor='#e5e7eb';this.style.background='#f9fafb'" />
            </div>
          </div>
        </div>

        <!-- GST Info Form — Premium & Optional -->
        <div style="margin-top:16px; border-radius:16px; overflow:hidden; box-shadow:0 2px 16px rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.2);">
          <div style="background:linear-gradient(135deg,#f59e0b,#d97706); padding:16px 20px; display:flex; align-items:center; gap:10px;">
            <i class="ph ph-receipt" style="font-size:1.3rem; color:white;"></i>
            <div>
              <div style="font-weight:700; color:white; font-size:1rem;">GST Details (Optional)</div>
              <div style="font-size:0.75rem; color:rgba(255,255,255,0.7); margin-top:2px;">Claim GST credit on this booking.</div>
            </div>
          </div>
          <div style="padding:18px; background:white; display:flex; flex-direction:column; gap:14px;">
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <div style="flex:1; min-width:140px;">
                <label style="display:block; font-size:0.75rem; font-weight:600; color:#6b7280; margin-bottom:5px; text-transform:uppercase; letter-spacing:0.5px;">GST Number</label>
                <input id="booking-gst-number" type="text" placeholder="e.g. 29ABBCR4749R3ZF" value="${prefilledGstNumber}" style="width:100%; padding:10px 14px; border:1.5px solid #e5e7eb; border-radius:10px; font-size:0.9rem; background:#f9fafb; transition:border-color 0.2s;" onfocus="this.style.borderColor='#f59e0b';this.style.background='white'" onblur="this.style.borderColor='#e5e7eb';this.style.background='#f9fafb'" />
              </div>
              <div style="flex:1; min-width:200px;">
                <label style="display:block; font-size:0.75rem; font-weight:600; color:#6b7280; margin-bottom:5px; text-transform:uppercase; letter-spacing:0.5px;">Registered Company Name</label>
                <input id="booking-gst-name" type="text" placeholder="e.g. TRIPJACK" value="${prefilledGstName}" style="width:100%; padding:10px 14px; border:1.5px solid #e5e7eb; border-radius:10px; font-size:0.9rem; background:#f9fafb; transition:border-color 0.2s;" onfocus="this.style.borderColor='#f59e0b';this.style.background='white'" onblur="this.style.borderColor='#e5e7eb';this.style.background='#f9fafb'" />
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Right Column: Price & Action -->
      <div class="review-right" style="flex: 0 0 320px; background: white; border: 1px solid #e2e8f0; border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); overflow: hidden;">
        <div style="background: var(--bg-secondary); border-bottom: 1px solid #e2e8f0; padding: 16px 20px;">
           <h4 style="margin: 0; display:flex; flex-direction: column; align-items: flex-start; gap: 8px; font-size: 1rem; color: var(--text-main);">
             Price Summary
             <div style="display:flex; gap:6px; align-items:center; flex-wrap: wrap;">
               <span class="data-pill pill-neutral" style="font-size: 0.75rem;"><i class="ph ph-coins"></i> ${currency}</span>
               ${onholdBadge}
               ${priceChangedBadge}
             </div>
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
          <div style="display:flex; justify-content:space-between; margin-bottom: 10px; color: var(--text-muted); font-size:0.9rem;">
            <span>GST Claimable</span>
            <span style="font-weight: 500; color: var(--primary);">${currency} ${gstClaimable}</span>
          </div>
          
          <hr style="border: none; border-top: 1px dashed #cbd5e1; margin: 16px 0;" />
          
          <div class="summary-row total" style="display:flex; justify-content:space-between; align-items:flex-start; padding:15px; background:rgba(59,130,246,0.05); border-radius:8px;">
            <span style="font-weight:800; font-size:1.1rem; color:#1e293b;">Grand Total</span>
            <div style="text-align: right;">
              <span style="font-weight:900; font-size:1.3rem; color:var(--primary);">${currency} ${totalPrice}</span>
              <div style="font-size: 0.8rem; color: #64748b; font-weight: 600; margin-top: 4px; font-style: italic;">
                (${priceInWords(totalPrice)} Rupees Only)
              </div>
            </div>
          </div>

          <!-- Two booking action buttons -->
          <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:8px;">
            <button class="btn-primary btn-large" style="width:100%;display:flex;justify-content:center;align-items:center;gap:8px;" onclick="submitBooking('VOUCHER','${bookingId}','${correlationId}',${option.pricing?.totalPrice ?? 0})">
              <i class="ph ph-credit-card"></i> Voucher Booking
            </button>
            <button class="btn-secondary btn-large" 
                    style="width:100%;display:flex;justify-content:center;align-items:center;gap:8px;background:${onholdAllowed ? 'rgba(99,102,241,0.08)' : '#f1f5f9'};border:1px solid ${onholdAllowed ? 'rgba(99,102,241,0.3)' : '#e2e8f0'};color:${onholdAllowed ? '#4338ca' : '#94a3b8'}; cursor:${onholdAllowed ? 'pointer' : 'not-allowed'};" 
                    onclick="${onholdAllowed ? `submitBooking('HOLD','${bookingId}','${correlationId}',null)` : 'void(0)'}"
                    ${onholdAllowed ? '' : 'disabled'}>
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

  // Retrieve saved review hash to preserve it on final render save
  let savedReviewHash = "";
  const savedStateStr = sessionStorage.getItem('tj_page_state');
  if (savedStateStr) {
    try {
      const savedState = JSON.parse(savedStateStr);
      savedReviewHash = savedState.requestedReviewHash || "";
    } catch (e) {}
  }

  // SAVE STATE TO SESSIONSTORE FOR PAGE REFRESH
  const stateToSave = {
    page: 'review',
    searchBody: globalSearchBody,
    detailData: window.globalDetailData || null,
    reviewData: data,
    responseMs: responseMs,
    requestedOptionId: option?.optionId || option?.id || "",
    requestedCorrelationId: correlationId,
    requestedHotelId: hotelId || window.globalDetailData?.hotelId || "",
    requestedReviewHash: savedReviewHash || window.globalDetailData?.reviewHash || "",
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

  const indianNames = ["Aryan", "Rahul", "Priya", "Sneha", "Amit", "Pooja", "Vikram", "Anjali"];
  const foreignNames = ["John", "Alice", "Michael", "Emma", "David", "Sophia", "Robert", "Olivia"];
  const lastNames = ["Sharma", "Smith", "Gupta", "Johnson", "Verma", "Brown", "Singh", "Williams"];

  const getName = (idx, type) => {
    const list = type === 'first' ? (Math.random() > 0.5 ? indianNames : foreignNames) : lastNames;
    return list[Math.floor(Math.random() * list.length)];
  };

  const inputStyle = "width:100%; padding:9px 12px; border:1.5px solid #e5e7eb; border-radius:10px; font-size:0.87rem; background:#f9fafb; outline:none; transition:border-color 0.2s, box-shadow 0.2s;";
  const titleStyle = "width:100%; padding:9px 8px; border:1.5px solid #e5e7eb; border-radius:10px; font-size:0.87rem; background:#f9fafb; outline:none; cursor:pointer;";
  const labelStyle = "display:block; font-size:0.7rem; font-weight:700; text-transform:uppercase; letter-spacing:0.6px; color:#9ca3af; margin-bottom:4px;";

  const renderTitleSelect = (id) => `
    <div><label style="${labelStyle}">Title</label>
      <select id="${id}" style="${titleStyle}">
        <option>Mr</option><option>Ms</option><option>Mrs</option>
      </select></div>`;

  const renderChildTitleSelect = (id) => `
    <div><label style="${labelStyle}">Title</label>
      <select id="${id}" style="${titleStyle}">
        <option>Master</option><option>Miss</option>
      </select></div>`;

  const renderInput = (id, placeholder, label, val = "") =>
    `<div><label style="${labelStyle}">${label}</label><input id="${id}" type="text" placeholder="${placeholder}" value="${val}" style="${inputStyle}" /></div>`;

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
          <div class="traveller-name-grid" style="display:grid; grid-template-columns:100px 1fr 1fr; gap:10px;">
            ${renderTitleSelect(`t-title-${tNum}`)}
            ${renderInput(`t-fn-${tNum}`, 'First Name', 'First Name *', getName(tNum, 'first'))}
            ${renderInput(`t-ln-${tNum}`, 'Last Name', 'Last Name *', getName(tNum, 'last'))}
          </div>
          <div class="traveller-docs-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
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
          <div class="traveller-name-grid" style="display:grid; grid-template-columns:100px 1fr 1fr; gap:10px;">
            ${renderChildTitleSelect(`t-title-${tNum}`)}
            ${renderInput(`t-fn-${tNum}`, 'First Name', 'First Name *', getName(tNum, 'first'))}
            ${renderInput(`t-ln-${tNum}`, 'Last Name', 'Last Name *', getName(tNum, 'last'))}
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
    let title = document.getElementById(`t-title-${tNum}`)?.value || "Mr";
    const fn = (document.getElementById(`t-fn-${tNum}`)?.value || "").trim();
    const ln = (document.getElementById(`t-ln-${tNum}`)?.value || "").trim();
    const pan = (document.getElementById(`t-pan-${tNum}`)?.value || "").trim();
    const passport = (document.getElementById(`t-pass-${tNum}`)?.value || "").trim();

    // Enforce child title must be Master or Miss (Tripjack API requirement)
    if (paxType === 'CHILD') {
      if (title !== 'Master' && title !== 'Miss') {
        title = 'Master'; // Default to Master for children
      }
    }

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

  // ── Collect & Validate GST info ─────────────────────────────────────────
  const gstNumber = (document.getElementById("booking-gst-number")?.value || "").trim();
  const gstName = (document.getElementById("booking-gst-name")?.value || "").trim();

  if ((gstNumber && !gstName) || (!gstNumber && gstName)) {
    if (bookingEl) {
      bookingEl.classList.remove("empty");
      bookingEl.innerHTML = `<div class="alert-box error fade-in"><i class="ph ph-warning"></i> <span>If claiming GST, please enter both GST Number and Registered Company Name.</span></div>`;
      bookingEl.scrollIntoView({ behavior: "smooth", block: "center" });
      
      if (!gstNumber) {
        const gstNumInput = document.getElementById("booking-gst-number");
        if (gstNumInput) gstNumInput.style.borderColor = "#ef4444";
      }
      if (!gstName) {
        const gstNameInput = document.getElementById("booking-gst-name");
        if (gstNameInput) gstNameInput.style.borderColor = "#ef4444";
      }
    }
    return;
  }

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

    if (gstNumber && gstName) {
      body.gstInfo = {
        gstNumber: gstNumber,
        registeredName: gstName
      };
    }

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
    
    // Store for Tech Details (Form Booking API)
    lastApiTransactions.book = {
      req: body,
      res: data,
      time: responseMs,
      status: res.status,
      url: '/book'
    };
    
    console.log('API_BOOKING_REQUEST', { duration: responseMs, status: res.status, ok: data.ok });
    
    // Track response time
    journeyResponseTimes.book = responseMs;
    displayResponseTimes();
    
    if (!bookingEl) return;

    const isSuccess = (data.bookingId || data.order?.bookingId) && 
                      (res.ok || data.status?.httpStatus === 200 || data.ok === true);

    const typeLabel = bookingType === 'HOLD' ? 'Hold' : 'Voucher';
    if (!isSuccess) {
      bookingEl.innerHTML = `
        <div class="alert-box error fade-in" style="background: #fff1f2; border: 1px solid #fda4af; border-radius: 16px; padding: 20px; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <div style="width: 40px; height: 40px; background: #fee2e2; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <i class="ph ph-warning-circle" style="color: #e11d48; font-size: 1.5rem;"></i>
            </div>
            <div>
              <div style="color: #9f1239; font-weight: 700; font-size: 1rem;">Booking Attempt Failed</div>
              <div style="color: #e11d48; font-size: 0.85rem; font-weight: 500;">${typeLabel} booking failed</div>
            </div>
          </div>
          <div style="background: white; border-radius: 10px; padding: 12px; color: #be123c; font-size: 0.9rem; line-height: 1.5; border-left: 4px solid #e11d48;">
            ${data.reason || data.message || "An error occurred with the upstream provider. Please check your credentials or traveller data."}
          </div>
        </div>
        ${renderTechnicalDetails('book')}`;
      return;
    }

    const successColor = bookingType === 'HOLD' ? '#4338ca' : '#16a34a';
    const successIcon = bookingType === 'HOLD' ? 'ph-clock-countdown' : 'ph-check-circle';
    const successTitle = bookingType === 'HOLD' ? 'Hold Placed Successfully!' : 'Congratulations! Booking Created Successfully';
    const successMsg = bookingType === 'HOLD' ? 'Your hold has been placed' : 'Your booking has been confirmed';
    
    // Parse status securely to avoid [object Object]
    const statusText = typeof data.status === 'object' 
      ? (data.status.success ? 'Confirmed' : 'Failed') 
      : (data.status || 'Confirmed');

    bookingEl.innerHTML = `
      <div class="booking-success-card fade-in" style="background: white; border: 1.5px solid ${successColor}33; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); margin-bottom: 16px;">
        <div style="background: linear-gradient(135deg, ${successColor} 0%, ${successColor}dd 100%); padding: 24px; text-align: center; color: white;">
          <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
            <i class="ph ${successIcon}" style="font-size: 2rem;"></i>
          </div>
          <h4 style="margin: 0; font-size: 1.3rem; font-weight: 700;">${successTitle}</h4>
          <p style="margin: 8px 0 0; opacity: 0.9; font-size: 0.95rem;">${successMsg}</p>
        </div>
        
        <div style="padding: 24px;">
          <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">
              <span style="color: #64748b; font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">Booking ID</span>
              <span style="color: #1e293b; font-weight: 700;">${data.bookingId || bookingId}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b; font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">Status</span>
              <span class="data-pill pill-success" style="background: ${successColor}15; color: ${successColor}; border: none;">${statusText}</span>
            </div>
          </div>
          
          <button onclick="viewBookingDetail('${data.bookingId || bookingId}')" 
                  class="btn-premium"
                  style="width: 100%; padding: 14px; background: ${successColor}; color: white; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: all 0.3s ease; font-size: 1rem; box-shadow: 0 4px 12px ${successColor}44;">
            <i class="ph ph-receipt"></i> View Details & Receipt
          </button>
        </div>
      </div>
      ${renderTechnicalDetails('book')}`;
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
  
  // Show loading state - if we have the booking element (Review Page) use it,
  // otherwise use the global booking detail content container
  const bookingEl = document.getElementById("booking");
  const detailContainer = document.getElementById("booking-detail-content");
  
  if (bookingEl) {
    bookingEl.innerHTML = `
      <div class="empty-state fade-in">
        <div class="loader" style="margin-bottom:16px; border-color:var(--primary); border-top-color:transparent; width:30px; height:30px;"></div>
        <p>Fetching booking details...</p>
      </div>`;
  } else if (detailContainer) {
    // We are on another page, switch to booking detail page immediately and show loader
    document.querySelectorAll(".view-page").forEach(p => p.classList.add("hidden"));
    document.getElementById("booking-detail-page")?.classList.remove("hidden");
    detailContainer.innerHTML = `
      <div class="empty-state fade-in">
        <div class="loader" style="margin-bottom:16px; border-color:var(--primary); border-top-color:transparent; width:30px; height:30px;"></div>
        <p>Retrieving your reservation details...</p>
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
    
    // Store for Tech Details
    lastApiTransactions.bookingDetail = {
      req: body,
      res: data,
      time: responseMs,
      status: res.status,
      url: '/booking-detail'
    };
    
    console.log('API_BOOKING_DETAIL_REQUEST', { duration: responseMs, status: res.status, ok: data.ok });
    
    // Track response time
    journeyResponseTimes.bookingDetail = responseMs;
    displayResponseTimes();
    
    console.log('DEBUG_BOOKING_DETAIL_RESPONSE', data);
    
    const isSuccess = res.ok && (data.bookingId || data.order?.bookingId || data.status?.success === true || data.order);
    
    if (!isSuccess) {
      console.error('Booking detail fetch failed or returned invalid data', { ok: res.ok, data });
      const errorMsg = data.reason || data.message || 'The booking ID might be invalid or from a different environment.';
      
      if (bookingEl) {
        bookingEl.innerHTML = `
          <div class="alert-box error fade-in" style="flex-direction: column; align-items: flex-start; margin-bottom: 16px;">
            <div style="display: flex; gap: 8px; align-items: center; font-weight: 600;">
              <i class="ph ph-warning-circle" style="font-size: 1.2rem;"></i> Failed to Load Booking Details
            </div>
            <div style="margin-top: 8px; font-size: 0.9rem;">${errorMsg}</div>
          </div>
          ${renderTechnicalDetails('bookingDetail')}`;
      } else if (detailContainer) {
        detailContainer.innerHTML = `
          <div class="alert-box error fade-in" style="margin: 20px; padding: 24px; border-radius: 16px; margin-bottom: 16px;">
            <div style="display: flex; gap: 12px; align-items: center; font-weight: 700; font-size: 1.1rem; color: #991b1b; margin-bottom: 12px;">
              <i class="ph ph-warning-circle" style="font-size: 1.5rem;"></i> Error Retrieving Booking
            </div>
            <p style="color: #b91c1c; margin-bottom: 20px;">${errorMsg}</p>
            <button onclick="window.location.reload()" class="btn-primary" style="padding: 10px 20px; border-radius: 8px; font-weight: 600; border: none; cursor: pointer;">
              <i class="ph ph-arrows-clockwise"></i> Try Again
            </button>
          </div>
          ${renderTechnicalDetails('bookingDetail')}`;
      }
      return;
    }
    
    // Navigate to booking detail page
    window.globalBookingDetail = data;
    renderBookingDetail(data);
    
  } catch (err) {
    console.error("ERROR IN viewBookingDetail:", err);
    if (bookingEl) {
      bookingEl.innerHTML = `
        <div class="alert-box error fade-in">
          <i class="ph ph-warning"></i>
          <span class="message">Error fetching booking details: ${err.message}</span>
        </div>`;
    } else if (detailContainer) {
      detailContainer.innerHTML = `
        <div class="alert-box error fade-in" style="margin: 20px; padding: 24px; border-radius: 16px;">
          <i class="ph ph-warning"></i>
          <span class="message">Error rendering booking details: ${err.message}</span>
        </div>`;
    }
  }
}

// Function to handle booking cancellation
async function cancelBookingRequest(bookingId) {
  if (!confirm(`Are you sure you want to cancel booking ${bookingId}?`)) return;
  
  const config = getConfigPayload();
  const body = {
    bookingId,
    env: config.env,
    apiKey: config.apiKey,
    remarks: "Cancelled from Portal"
  };
  
  // Show loading overlay
  const container = document.getElementById("booking-detail-content");
  const originalHtml = container.innerHTML;
  
  container.innerHTML = `
    <div class="empty-state fade-in" style="padding: 100px 0;">
      <div class="loader" style="margin-bottom:16px; border-color:var(--danger); border-top-color:transparent; width:40px; height:40px;"></div>
      <h2 style="color: var(--danger);">Processing Cancellation...</h2>
      <p>Sending request to Tripjack server. Please wait.</p>
    </div>
    ${originalHtml}
  `;
  
  try {
    const t0 = performance.now();
    const res = await fetch(`${API_BASE}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const responseMs = Math.round(performance.now() - t0);
    
    const data = await res.json();
    
    console.log('API_CANCELLATION_REQUEST', { duration: responseMs, status: res.status, ok: data.ok });
    
    // Track response time
    journeyResponseTimes.cancellation = responseMs;
    displayResponseTimes();
    
    if (res.ok && (data.status?.success === true || data.ok)) {
      // Show success alert temporarily
      container.innerHTML = `
        <div class="alert-box success fade-in" style="margin: 20px; padding: 24px; border-radius: 16px; animation: slideDown 0.5s ease-out;">
          <div style="display: flex; gap: 12px; align-items: center; font-weight: 700; font-size: 1.2rem;">
            <i class="ph ph-check-circle" style="font-size: 1.8rem;"></i> Cancellation Successful
          </div>
          <p style="margin-top: 8px;">Your booking has been cancelled. Refreshing details...</p>
        </div>
        ${originalHtml}
      `;
      
      // Automatic Refresh after 2 seconds
      setTimeout(() => {
        viewBookingDetail(bookingId);
      }, 2000);
      
    } else {
      // Show error
      alert(`Cancellation failed: ${data.reason || data.message || 'Please contact support.'}`);
      container.innerHTML = originalHtml;
    }
  } catch (err) {
    alert("An error occurred during cancellation.");
    container.innerHTML = originalHtml;
  }
}

async function confirmBookingRequest(bookingId, amount) {
  if (!confirm(`Are you sure you want to confirm booking ${bookingId} for the amount of ${amount}?`)) return;
  
  const config = getConfigPayload();
  const body = {
    bookingId,
    amount,
    env: config.env,
    apiKey: config.apiKey
  };
  
  // Show loading overlay
  const container = document.getElementById("booking-detail-content");
  const originalHtml = container.innerHTML;
  
  container.innerHTML = `
    <div class="empty-state fade-in" style="padding: 100px 0;">
      <div class="loader" style="margin-bottom:16px; border-color:var(--primary); border-top-color:transparent; width:40px; height:40px;"></div>
      <h2 style="color: var(--primary);">Processing Confirmation...</h2>
      <p>Sending request to Tripjack server. Please wait.</p>
    </div>
    ${originalHtml}
  `;
  
  try {
    const t0 = performance.now();
    const res = await fetch(`${API_BASE}/confirm-book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const responseMs = Math.round(performance.now() - t0);
    
    const data = await res.json();
    
    console.log('API_CONFIRM_REQUEST', { duration: responseMs, status: res.status, ok: data.ok || res.ok });
    
    if (res.ok && (data.status?.success === true || data.ok || data.bookingId)) {
      // Show success alert temporarily
      container.innerHTML = `
        <div class="alert-box success fade-in" style="margin: 20px; padding: 24px; border-radius: 16px; animation: slideDown 0.5s ease-out;">
          <div style="display: flex; gap: 12px; align-items: center; font-weight: 700; font-size: 1.2rem;">
            <i class="ph ph-check-circle" style="font-size: 1.8rem;"></i> Confirmation Successful
          </div>
          <p style="margin-top: 8px;">Your booking has been confirmed. Refreshing details...</p>
        </div>
        ${originalHtml}
      `;
      
      // Automatic Refresh after 2 seconds
      setTimeout(() => {
        viewBookingDetail(bookingId);
      }, 2000);
      
    } else {
      // Show error
      alert(`Confirmation failed: ${data.reason || data.message || data.error || 'Please check API configuration.'}`);
      container.innerHTML = originalHtml;
    }
  } catch (err) {
    alert("An error occurred during confirmation.");
    container.innerHTML = originalHtml;
  }
}

// Function to render booking detail page
function renderBookingDetail(data) {
  showActivePage("booking-detail-page");
  
  // Extract booking details with safety defaults for the Order/ItemInfos structure
  const order = data.order || {};
  const bookingId = order.bookingId || data.bookingId || data.id || 'N/A';

  // Update URL
  const targetUrl = `/home/booking-detail?id=${bookingId}`;
  if (window.location.pathname + window.location.search !== targetUrl) {
    history.pushState({ view: 'booking-detail', bookingId: bookingId }, '', targetUrl);
  }
  
  const container = document.getElementById("booking-detail-content");
  if (!container) return;
  
  const hotelInfo = data.itemInfos?.HOTEL?.hInfo || {};
  const firstOp = hotelInfo.ops?.[0] || {};
  const firstRoom = firstOp.ris?.[0] || {};
  const hotelName = hotelInfo.name || data.hotelName || data.hotel?.name || 'Hotel Name';
  
  // Try to find dates in various places
  const checkIn = globalSearchBody?.checkIn || firstRoom.checkIn || data.checkIn || 'N/A';
  const checkOut = globalSearchBody?.checkOut || firstRoom.checkOut || data.checkOut || 'N/A';
  
  // Handle price safely
  const baseAmount = parseFloat(order.amount || data.totalPrice || data.amount || 0);
  const markupAmount = parseFloat(order.markup || data.markup || 0);
  const totalPrice = baseAmount + markupAmount;
  const currency = data.currency || order.currency || 'INR';
  const status = order.status || data.status?.httpStatus || data.status || 'Confirmed';
  const confirmationNumber = order.bookingId || bookingId;
  const mealBasis = firstRoom.mb || 'N/A';
  const roomName = firstRoom.rc || 'N/A';

  // Address components
  const adr = hotelInfo.ad || {};
  const fullAddress = [adr.adr, adr.adr2, adr.ctn, adr.sn, adr.cn].filter(Boolean).join(', ');
  
  // Travellers list
  const travellers = firstRoom.ti || [];
  const travellersHtml = travellers.map(t => `
    <div style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.9rem;">
      <i class="ph ph-user-circle" style="color: var(--primary);"></i>
      <span style="font-weight: 600;">${t.ti} ${t.fN} ${t.lN}</span>
      <span style="font-size: 0.75rem; color: #94a3b8; margin-left: auto;">${t.pt}</span>
    </div>
  `).join('');

  // Cancellation Penalties
  const penalties = firstOp.cnp?.pd || [];
  const penaltiesHtml = penalties.map(p => {
    const amt = p.am === 0 ? '<span style="color:#10b981;">Free</span>' : `${currency} ${p.am.toFixed(2)}`;
    return `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 8px 0; font-size: 0.85rem; color: #64748b;">${new Date(p.fdt).toLocaleDateString()}</td>
        <td style="padding: 8px 0; font-size: 0.85rem; color: #64748b;">${new Date(p.tdt).toLocaleDateString()}</td>
        <td style="padding: 8px 0; font-size: 0.85rem; font-weight: 700; text-align: right;">${amt}</td>
      </tr>
    `;
  }).join('');

  // Inclusions / Benefits
  const benefits = firstRoom.rexb?.BENEFIT?.[0]?.values || [];
  const benefitsHtml = benefits.map(b => `<span style="background:#f1f5f9; color:#475569; padding:4px 10px; border-radius:6px; font-size:0.75rem;">${b}</span>`).join('');

  // Instructions / Policies parsed nicely
  const instructions = hotelInfo.inst || [];
  const instructionsHtml = instructions.map(ins => {
    let msg = ins.msg;
    try { 
      const parsed = JSON.parse(ins.msg);
      msg = Object.entries(parsed).map(([key, value]) => `
        <div style="margin-top: 8px; padding-left: 12px; border-left: 2px solid #cbd5e1;">
          <strong style="color: #475569; font-size: 0.85rem; text-transform: capitalize;">${key.replace(/_/g, ' ')}:</strong>
          <div style="font-size: 0.85rem; color: #64748b; line-height: 1.5; margin-top: 4px;">${value}</div>
        </div>
      `).join('');
    } catch(e) {}
    return `<div style="margin-bottom: 20px;">
      <div style="font-size:0.75rem; font-weight:700; color:var(--primary); text-transform:uppercase; margin-bottom:6px; letter-spacing:0.5px;">${ins.type.replace(/_/g, ' ')}</div>
      <div style="display: flex; flex-direction: column; gap: 8px;">${msg}</div>
    </div>`;
  }).join('');

  // Contact Info
  const delivery = order.deliveryInfo || {};
  const deliveryEmail = (delivery.emails && delivery.emails[0]) || 'N/A';
  const deliveryPhone = ((delivery.code && delivery.code[0]) || '') + ' ' + ((delivery.contacts && delivery.contacts[0]) || 'N/A');

  // Booking Time
  const createdOnStr = order.createdOn 
    ? new Date(order.createdOn).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : 'N/A';

  // Refundable Badge
  const isRefundable = firstOp.irf || firstRoom.irf || false;
  const refundBadge = isRefundable 
    ? `<span style="background: #d1fae5; color: #065f46; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; margin-left: auto; display: inline-flex; align-items: center; gap: 4px;"><i class="ph ph-check"></i> Refundable</span>`
    : `<span style="background: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; margin-left: auto; display: inline-flex; align-items: center; gap: 4px;"><i class="ph ph-lock"></i> Non-Refundable</span>`;

  // Star Rating
  const starsCount = hotelInfo.rt || 0;
  const starsHtml = starsCount > 0 
    ? `<div style="display: flex; gap: 2px; margin-top: 4px; color: #fbbf24;">` + 
      `<i class="ph-fill ph-star" style="font-size: 0.95rem;"></i>`.repeat(starsCount) + 
      `</div>` 
    : '';

  const bookingDetailsHtml = `
    <div style="display: flex; flex-direction: column; gap: 20px;">
      <!-- Actions Bar -->
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <button type="button" class="btn-ghost" onclick="backToSearch()">
          <i class="ph ph-arrow-left"></i> Back to Search
        </button>
        <div style="display: flex; gap: 12px;">
          ${(status === 'ON_HOLD' || status === 'HOLD') ? `
            <button onclick="confirmBookingRequest('${bookingId}', ${totalPrice})" class="btn-primary" style="padding: 10px 20px; border-radius: 8px; font-weight: 600; display: flex; align-items: center; gap: 8px; background: #16a34a; border-color: #16a34a;">
              <i class="ph ph-check-circle"></i> Confirm Booking
            </button>
          ` : ''}
          ${(status !== 'CANCELLED' && status !== 'CANCEL_DONE') ? `
            <button onclick="cancelBookingRequest('${bookingId}')" class="btn-danger" style="padding: 10px 20px; border-radius: 8px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
              <i class="ph ph-x-circle"></i> Cancel Booking
            </button>
          ` : ''}
          <button onclick="window.print()" class="btn-secondary" style="padding: 10px 20px; border-radius: 8px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
            <i class="ph ph-printer"></i> Print Receipt
          </button>
        </div>
      </div>

      <!-- Status Banner -->
      <div style="background: ${status === 'CANCELLED' || status === 'CANCEL_DONE' ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' : 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'}; border: 2px solid ${status === 'CANCELLED' || status === 'CANCEL_DONE' ? '#ef4444' : '#10b981'}; border-radius: 16px; padding: 24px; display: flex; align-items: center; gap: 16px; box-shadow: 0 10px 30px rgba(16, 185, 129, 0.15);">
        <div style="width: 56px; height: 56px; background: linear-gradient(135deg, ${status === 'CANCELLED' || status === 'CANCEL_DONE' ? '#ef4444' : '#10b981'} 0%, ${status === 'CANCELLED' || status === 'CANCEL_DONE' ? '#dc2626' : '#059669'} 100%); border-radius: 14px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.6rem; flex-shrink: 0;">
          <i class="ph ${status === 'CANCELLED' || status === 'CANCEL_DONE' ? 'ph-x-circle' : 'ph-check-circle'}"></i>
        </div>
        <div>
          <div style="font-size: 1.3rem; font-weight: 800; color: ${status === 'CANCELLED' || status === 'CANCEL_DONE' ? '#991b1b' : '#065f46'};">
            ${status === 'CANCELLED' || status === 'CANCEL_DONE' ? 'Booking Cancelled' : (status === 'ON_HOLD' ? 'Placed on Hold' : 'Confirmed')}!
          </div>
          <div style="font-size: 0.95rem; color: ${status === 'CANCELLED' || status === 'CANCEL_DONE' ? '#b91c1c' : '#047857'}; margin-top: 4px;">
            ${status === 'CANCELLED' || status === 'CANCEL_DONE' ? 'This reservation has been successfully cancelled.' : (status === 'ON_HOLD' ? 'Your hold has been successfully placed' : 'Your reservation has been successfully created')}
          </div>
        </div>
      </div>
      
      <div class="booking-detail-grid" style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px;">
        
        <!-- Left Column: Hotel & Travellers -->
        <div style="display: flex; flex-direction: column; gap: 20px;">
          
          <!-- Hotel Section -->
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
              <div style="width: 44px; height: 44px; background: #eff6ff; color: #3b82f6; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0;">
                <i class="ph ph-buildings"></i>
              </div>
              <div>
                <h3 style="margin: 0; font-size: 1.2rem; color: #1e293b; display: flex; align-items: center; gap: 8px;">
                  ${hotelName}
                </h3>
                <div style="font-size: 0.85rem; color: #64748b; margin-top: 2px;">${fullAddress}</div>
                ${starsHtml}
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: #f8fafc; border-radius: 12px; padding: 16px;">
              <div>
                <div style="font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Check-in</div>
                <div style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-top: 4px;">${checkIn}</div>
                <div style="font-size: 0.75rem; color: #64748b; margin-top: 2px;">After ${hotelInfo.checkInTime?.beginTime || '14:00'} ${hotelInfo.checkInTime?.minAge ? `(Min Age: ${hotelInfo.checkInTime.minAge})` : ''}</div>
              </div>
              <div>
                <div style="font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Check-out</div>
                <div style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-top: 4px;">${checkOut}</div>
                <div style="font-size: 0.75rem; color: #64748b; margin-top: 2px;">Before ${hotelInfo.checkOutTime?.beginTime || '12:00'}</div>
              </div>
            </div>
          </div>

          <!-- Room & Travellers -->
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px;">
            <h4 style="margin: 0 0 16px; font-size: 1rem; color: #1e293b; display: flex; align-items: center; gap: 8px;">
              <i class="ph ph-bed"></i> Room & Traveller Details
            </h4>
            <div style="background: #fdf2f8; border: 1px solid #fbcfe8; border-radius: 12px; padding: 16px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-weight: 700; color: #9d174d; font-size: 0.95rem;">${roomName}</div>
                <div style="font-size: 0.8rem; color: #be185d; margin-top: 4px; font-weight: 600;">Plan: ${mealBasis}</div>
              </div>
              ${refundBadge}
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${travellersHtml}
            </div>
          </div>

          <!-- Contact & Delivery Details -->
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px;">
            <h4 style="margin: 0 0 16px; font-size: 1rem; color: #1e293b; display: flex; align-items: center; gap: 8px;">
              <i class="ph ph-envelope-simple"></i> Contact & Delivery Info
            </h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div style="background: #f8fafc; border-radius: 10px; padding: 12px; display: flex; align-items: center; gap: 10px;">
                <div style="width: 32px; height: 32px; background: #e0f2fe; color: #0284c7; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0;">
                  <i class="ph ph-envelope"></i>
                </div>
                <div>
                  <div style="font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Email</div>
                  <div style="font-size: 0.85rem; font-weight: 600; color: #334155; margin-top: 2px;">${deliveryEmail}</div>
                </div>
              </div>
              <div style="background: #f8fafc; border-radius: 10px; padding: 12px; display: flex; align-items: center; gap: 10px;">
                <div style="width: 32px; height: 32px; background: #ecfdf5; color: #059669; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0;">
                  <i class="ph ph-phone"></i>
                </div>
                <div>
                  <div style="font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Phone Number</div>
                  <div style="font-size: 0.85rem; font-weight: 600; color: #334155; margin-top: 2px;">${deliveryPhone}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Important Info -->
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px;">
            <h4 style="margin: 0 0 16px; font-size: 1rem; color: #1e293b; display: flex; align-items: center; gap: 8px;">
              <i class="ph ph-info"></i> Important Information
            </h4>
            ${instructionsHtml}
          </div>

        </div>

        <!-- Right Column: Summary & Policy -->
        <div style="display: flex; flex-direction: column; gap: 20px;">
          
          <!-- Booking Summary Card -->
          <div style="background: #1e293b; color: white; border-radius: 16px; padding: 24px; box-shadow: 0 10px 25px rgba(30, 41, 59, 0.2);">
            <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; opacity: 0.6; letter-spacing: 1px; margin-bottom: 4px;">Booking ID</div>
            <div style="font-size: 1.1rem; font-weight: 700; margin-bottom: 20px; font-family: monospace;">${bookingId}</div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <span style="opacity: 0.7; font-size: 0.9rem;">Status</span>
              <span style="background: ${status === 'ON_HOLD' ? '#f59e0b' : '#10b981'}; color: white; padding: 4px 12px; border-radius: 999px; font-size: 0.75rem; font-weight: 700;">${status}</span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <span style="opacity: 0.7; font-size: 0.9rem;">Booked On</span>
              <span style="font-weight: 600; font-size: 0.85rem; opacity: 0.9;">${createdOnStr}</span>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; font-size: 0.9rem; margin-top: 16px;">
              <div style="display: flex; justify-content: space-between; opacity: 0.85;">
                <span>Base Amount</span>
                <span>${currency} ${baseAmount.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; opacity: 0.85;">
                <span>Markup Fee</span>
                <span>${currency} ${markupAmount.toFixed(2)}</span>
              </div>
            </div>
            
            <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.15); margin: 12px 0;" />
            
            <div style="display: flex; justify-content: space-between; align-items: flex-end;">
              <span style="opacity: 0.9; font-size: 0.95rem; font-weight: 700;">Total Amount</span>
              <div style="display: flex; flex-direction: column; align-items: flex-end;">
                <span style="font-size: 1.5rem; font-weight: 800; color: #10b981;">${currency} ${totalPrice.toFixed(2)}</span>
                <div style="font-size: 0.75rem; color: #94a3b8; font-weight: 500; margin-top: 4px; font-style: italic; opacity: 0.8;">
                  (${priceInWords(totalPrice.toFixed(2))} Rupees Only)
                </div>
              </div>
            </div>
          </div>

          <!-- Cancellation Policy -->
          <div style="background: #fff1f2; border: 1px solid #fecaca; border-radius: 16px; padding: 20px;">
            <h4 style="margin: 0 0 12px; font-size: 0.9rem; color: #9f1239; display: flex; align-items: center; gap: 8px;">
              <i class="ph ph-shield-warning"></i> Cancellation Policy
            </h4>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 1.5px solid #fecaca;">
                  <th style="text-align: left; font-size: 0.7rem; color: #9f1239; padding-bottom: 8px;">From</th>
                  <th style="text-align: left; font-size: 0.7rem; color: #9f1239; padding-bottom: 8px;">To</th>
                  <th style="text-align: right; font-size: 0.7rem; color: #9f1239; padding-bottom: 8px;">Penalty</th>
                </tr>
              </thead>
              <tbody>
                ${penaltiesHtml}
              </tbody>
            </table>
          </div>

          <!-- Benefits -->
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px;">
            <h4 style="margin: 0 0 16px; font-size: 0.9rem; color: #1e293b; display: flex; align-items: center; gap: 8px;">
              <i class="ph ph-sparkle"></i> Included Amenities
            </h4>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              ${benefitsHtml}
            </div>
          </div>

        </div>

      </div>

      <!-- Action Buttons -->
      <div style="display: flex; gap: 12px; margin-top: 12px;">
        <button onclick="backToSearch()" style="flex: 1; padding: 14px; background: #f8fafc; color: #475569; border: 1px solid #e2e8f0; border-radius: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s ease;">
          <i class="ph ph-house"></i> Return Home
        </button>
        <button onclick="window.print()" style="flex: 1; padding: 14px; background: var(--primary); color: white; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s ease; box-shadow: 0 4px 12px var(--primary-light);">
          <i class="ph ph-printer"></i> Download Receipt
        </button>
      </div>

    </div>
  `;
  
  container.innerHTML = bookingDetailsHtml;
  
  // Add Technical Details
  container.insertAdjacentHTML('beforeend', renderTechnicalDetails('bookingDetail'));
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

    const t0_book = performance.now();
    const res = await fetch(`${API_BASE}/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const t1_book = performance.now();
    const bookResponseTime = Math.round(t1_book - t0_book);

    const data = await res.json();
    
    // Store for Tech Details
    lastApiTransactions.book = {
      req: body,
      res: data,
      time: bookResponseTime,
      status: res.status,
      url: '/book'
    };
    if (!bookingEl) return;

    if (!res.ok || data.ok === false) {
      bookingEl.innerHTML = `
        <div class="alert-box error fade-in" style="margin-bottom: 16px;">
          <i class="ph ph-warning-circle"></i>
          <span class="message">Booking failed: ${data.reason || "Check response"}</span>
        </div>
        ${renderTechnicalDetails('book')}
      `;
      return;
    }

    bookingEl.innerHTML = `
      <div class="alert-box success fade-in" style="margin-bottom: 16px;">
        <i class="ph ph-check-circle"></i>
        <span class="message">Booking confirmed successfully!</span>
      </div>
      ${renderTechnicalDetails('book')}
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
// Recent Searches Functionality
function saveRecentSearch(searchBody) {
  try {
    let searches = JSON.parse(localStorage.getItem('tj_recent_searches') || '[]');
    
    // Create a simplified version for comparison
    const simplified = {
      checkIn: searchBody.checkIn,
      checkOut: searchBody.checkOut,
      hids: searchBody.hids,
      location: searchBody.location,
      rooms: searchBody.rooms
    };
    
    const searchKey = JSON.stringify(simplified);
    
    // Remove existing if duplicate
    searches = searches.filter(s => {
      const sComp = {
        checkIn: s.checkIn,
        checkOut: s.checkOut,
        hids: s.hids,
        location: s.location,
        rooms: s.rooms
      };
      return JSON.stringify(sComp) !== searchKey;
    });
    
    // Add to front
    searches.unshift(searchBody);
    
    // Limit to 5
    if (searches.length > 5) searches.pop();
    
    localStorage.setItem('tj_recent_searches', JSON.stringify(searches));
    renderRecentSearches();
  } catch (err) {
    console.error('Error saving recent search:', err);
  }
}

function renderRecentSearches() {
  const container = document.getElementById('recent-searches-list');
  const section = document.getElementById('recent-searches-section');
  if (!container || !section) return;
  
  const searches = JSON.parse(localStorage.getItem('tj_recent_searches') || '[]');
  if (searches.length === 0) {
    section.style.display = 'none';
    return;
  }
  
  section.style.display = 'block';
  
  container.innerHTML = searches.map((s, idx) => {
    let title = "Custom Search";
    if (s.location) title = s.location.charAt(0).toUpperCase() + s.location.slice(1);
    else if (s.hids && s.hids.length > 0) title = `${s.hids.length} Selected Hotels`;
    
    const dates = `${s.checkIn} to ${s.checkOut}`;
    const guestCount = s.rooms.reduce((acc, r) => acc + (parseInt(r.adults) || 0) + (r.children ? r.children.length : 0), 0);
    const roomCount = s.rooms.length;
    
    // Resolve environment information
    const envUrl = s.env || "https://tj-hotel-admin.tripjack.com/";
    let envName = "Prod Tripjack";
    let envColor = "#dc2626"; // red
    let envBg = "rgba(220, 38, 38, 0.08)";

    if (envUrl.includes("apitest-hms") || envUrl.includes("apitest")) {
      envName = "API Test Sandbox";
      envColor = "#0284c7"; // blue
      envBg = "rgba(2, 132, 199, 0.08)";
    } else if (envUrl.includes("admin")) {
      envName = "Admin TJ";
      envColor = "#ea580c"; // orange
      envBg = "rgba(234, 88, 12, 0.08)";
    }

    // Resolve API key information
    const rawKey = s.apiKey || "";
    let keyName = "Default Key";
    let keyStrDisplay = "751045f64b";
    
    if (rawKey.trim()) {
      keyName = "Custom Key";
      keyStrDisplay = rawKey.trim().substring(0, 10);
    }
    
    return `
      <div class="recent-search-item" onclick="applyRecentSearch(${idx})" style="min-height: 250px; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div class="recent-search-top">
            <div class="recent-search-icon"><i class="ph ph-clock-counter-clockwise"></i></div>
            <div class="recent-search-main">
              <h4 class="recent-search-title-text">${title}</h4>
            </div>
          </div>
          <div class="recent-search-meta">
            <div class="recent-search-detail">
              <i class="ph ph-calendar"></i> ${dates}
            </div>
            <div class="recent-search-detail">
              <i class="ph ph-users"></i> ${roomCount} Room${roomCount > 1 ? 's' : ''}, ${guestCount} Guest${guestCount > 1 ? 's' : ''}
            </div>
          </div>
        </div>
        
        <div>
          <!-- Credentials and Environment Meta Block -->
          <div class="recent-search-credentials" style="margin-top: 10px; margin-bottom: 12px; padding-top: 10px; border-top: 1px dashed rgba(32, 40, 67, 0.12); display: flex; flex-direction: column; gap: 6px; font-size: 0.75rem;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #64748b; font-weight: 600;">Environment:</span>
              <span style="color: ${envColor}; background: ${envBg}; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 0.65rem; border: 1px solid ${envColor}1a;">${envName}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #64748b; font-weight: 600;">Key Type:</span>
              <span style="color: #475569; font-weight: 700; font-size: 0.7rem;">${keyName}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #64748b; font-weight: 600;">API Key (10d):</span>
              <span style="color: #0f172a; font-family: 'Outfit', monospace; font-weight: 700; background: rgba(32, 40, 67, 0.05); padding: 1px 6px; border-radius: 4px; font-size: 0.7rem;">${keyStrDisplay}</span>
            </div>
          </div>
          
          <div class="recent-search-tag">
            <i class="ph ph-clock" style="margin-right: 4px;"></i> History
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function applyRecentSearch(index) {
  try {
    const searches = JSON.parse(localStorage.getItem('tj_recent_searches') || '[]');
    const s = searches[index];
    if (!s) return;
    
    // Fill basic fields
    if (document.getElementById('checkin')) document.getElementById('checkin').value = s.checkIn;
    if (document.getElementById('checkout')) document.getElementById('checkout').value = s.checkOut;
    if (s.hids && document.getElementById('hotelids')) document.getElementById('hotelids').value = s.hids.join(', ');
    if (s.currency && document.getElementById('currency')) document.getElementById('currency').value = s.currency;
    if (s.nationality && document.getElementById('nationality')) document.getElementById('nationality').value = s.nationality;
    
    // Fill rooms
    const roomsContainer = document.getElementById("rooms-container");
    if (roomsContainer) {
      roomsContainer.innerHTML = '';
      s.rooms.forEach((r) => {
        addRoom();
        const rows = roomsContainer.querySelectorAll('.room-row');
        const lastRow = rows[rows.length - 1];
        
        const adultsInput = lastRow.querySelector('input[name="adults"]');
        const childrenInput = lastRow.querySelector('input[name="children"]');
        const agesInput = lastRow.querySelector('input[name="childAges"]');
        
        if (adultsInput) adultsInput.value = r.adults;
        if (childrenInput) {
          childrenInput.value = r.children ? r.children.length : 0;
          updateChildAges(childrenInput);
        }
        if (agesInput && r.children && r.children.length > 0) {
          agesInput.value = r.children.join(', ');
        }
      });
    }
    
    // Restore saved environment and api key if available
    if (s.env) {
      localStorage.setItem("tj_env", s.env);
      const envSelect = document.getElementById("env-select");
      if (envSelect) envSelect.value = s.env;
    }
    if (s.apiKey !== undefined) {
      localStorage.setItem("tj_apikey", s.apiKey);
      const apikeyInput = document.getElementById("apikey-input");
      if (apikeyInput) apikeyInput.value = s.apiKey;
    }
    if (typeof updateSecurityBanner === "function") {
      updateSecurityBanner();
    }
    
    // Visual feedback
    const item = document.querySelectorAll('.recent-search-item')[index];
    if (item) {
      item.style.borderColor = 'var(--primary)';
      item.style.background = 'rgba(59, 130, 246, 0.05)';
    }
    
    // Scroll to action area
    document.querySelector('.form-actions')?.scrollIntoView({ behavior: 'smooth' });
    
  } catch (err) {
    console.error('Error applying recent search:', err);
  }
}

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
        <input type="number" name="children" min="0" value="0" oninput="updateChildAges(this)" />
      </div>
      <div class="input-group child-ages-group" style="margin-bottom:0; display:none;">
        <label>Child Ages <span style="color:#ef4444">*</span></label>
        <input type="text" name="childAges" placeholder="e.g. 5, 8" />
      </div>
    </div>
  `;
  container.appendChild(wrapper);
}

function updateChildAges(inputEl) {
  const row = inputEl.closest(".room-row");
  const count = parseInt(inputEl.value, 10) || 0;
  const group = row.querySelector(".child-ages-group");
  const agesInput = row.querySelector('input[name="childAges"]');
  
  if (count > 0) {
    group.style.display = "block";
    agesInput.required = true;
    // Pre-fill with 5s if empty or count changed
    const currentAges = agesInput.value.split(",").filter(v => v.trim().length > 0);
    if (currentAges.length !== count) {
      const defaultAges = Array(count).fill("5").join(", ");
      agesInput.value = defaultAges;
    }
  } else {
    group.style.display = "none";
    agesInput.required = false;
    agesInput.value = "";
  }
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
  checkoutDate.setDate(checkoutDate.getDate() + 1); // Exactly 1 night stay

  // Format as YYYY-MM-DD
  const formatIso = (date) => {
    const d = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return d.toISOString().split('T')[0];
  };

  checkinInput.value = formatIso(checkinDate);
  checkoutInput.value = formatIso(checkoutDate);
  
  // Set minimum dates to today
  const minToday = formatIso(today);
  checkinInput.min = minToday;
  checkoutInput.min = minToday;

  // Auto-update checkout when checkin changes
  checkinInput.addEventListener('change', function() {
    const selected = new Date(this.value);
    const nextDay = new Date(selected);
    nextDay.setDate(nextDay.getDate() + 1);
    checkoutInput.value = formatIso(nextDay);
    checkoutInput.min = formatIso(nextDay);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("rooms-container");
  if (container && container.children.length === 0) {
    addRoom();
  }
  initializeDates();
  loadConfigState();
  renderRecentSearches();
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
// Scroll Navigation Functions
function scrollToPageTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToPageBottom() {
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}

/* =========================================
   API Inspector Modal Functions
   ========================================= */
function openSearchApiModal(step = 'search') {
  window.activeApiModalStep = step;
  const transaction = lastApiTransactions[step];
  const modal = document.getElementById("search-api-modal");
  if (!modal) return;

  const titleEl = modal.querySelector(".api-modal-title");
  if (titleEl) {
    if (step === 'bookingDetail') {
      titleEl.textContent = "Saved Booking Detail API Inspector";
    } else if (step === 'detail' || step === 'staticDetail') {
      titleEl.textContent = "Room Detail API Inspector";
    } else if (step === 'review') {
      titleEl.textContent = "Room Review API Inspector";
    } else if (step === 'book') {
      titleEl.textContent = "Hotel Booking API Inspector";
    } else {
      titleEl.textContent = "Search API Inspector";
    }
  }

  // Handle source switcher visibility and highlighting
  const sourceSelector = document.getElementById("api-modal-source-selector");
  if (sourceSelector) {
    if (step === 'detail' || step === 'staticDetail') {
      sourceSelector.classList.remove("hidden");
      
      const staticBtn = document.getElementById("api-modal-source-static");
      const dynamicBtn = document.getElementById("api-modal-source-dynamic");
      
      if (step === 'staticDetail') {
        if (staticBtn) {
          staticBtn.style.background = "#ffffff";
          staticBtn.style.borderColor = "#D4AF37";
          staticBtn.style.color = "#202843";
          staticBtn.style.boxShadow = "0 2px 6px rgba(212, 175, 55, 0.15)";
          const staticIcon = staticBtn.querySelector("i");
          if (staticIcon) staticIcon.style.color = "#D4AF37";
        }
        if (dynamicBtn) {
          dynamicBtn.style.background = "transparent";
          dynamicBtn.style.borderColor = "rgba(0, 0, 0, 0.1)";
          dynamicBtn.style.color = "#64748b";
          dynamicBtn.style.boxShadow = "none";
          const dynamicIcon = dynamicBtn.querySelector("i");
          if (dynamicIcon) dynamicIcon.style.color = "#64748b";
        }
      } else {
        if (dynamicBtn) {
          dynamicBtn.style.background = "#ffffff";
          dynamicBtn.style.borderColor = "#D4AF37";
          dynamicBtn.style.color = "#202843";
          dynamicBtn.style.boxShadow = "0 2px 6px rgba(212, 175, 55, 0.15)";
          const dynamicIcon = dynamicBtn.querySelector("i");
          if (dynamicIcon) dynamicIcon.style.color = "#D4AF37";
        }
        if (staticBtn) {
          staticBtn.style.background = "transparent";
          staticBtn.style.borderColor = "rgba(0, 0, 0, 0.1)";
          staticBtn.style.color = "#64748b";
          staticBtn.style.boxShadow = "none";
          const staticIcon = staticBtn.querySelector("i");
          if (staticIcon) staticIcon.style.color = "#64748b";
        }
      }
    } else {
      sourceSelector.classList.add("hidden");
    }
  }

  const endpointEl = document.getElementById("api-modal-endpoint");
  const correlationEl = document.getElementById("api-modal-correlation-id");
  const statusEl = document.getElementById("api-modal-status");
  const timeEl = document.getElementById("api-modal-time");
  
  const reqPre = document.getElementById("api-modal-req-pre");
  const resPre = document.getElementById("api-modal-res-pre");
  
  const searchInput = document.getElementById("api-modal-search-input");
  const searchCount = document.getElementById("api-modal-search-count");

  // Reset search filters
  if (searchInput) searchInput.value = "";
  if (searchCount) {
    searchCount.classList.add("hidden");
    searchCount.textContent = "";
  }

  if (!transaction || !transaction.res) {
    if (endpointEl) endpointEl.textContent = "/search";
    if (correlationEl) correlationEl.textContent = "--";
    if (statusEl) {
      statusEl.textContent = "No Data";
      statusEl.className = "tech-status-badge error";
    }
    if (timeEl) timeEl.innerHTML = '<i class="ph ph-timer"></i> 0.00s';
    
    if (reqPre) reqPre.textContent = "-- No search has been performed yet --";
    if (resPre) resPre.textContent = "-- No search has been performed yet --";
    
    modal.classList.remove("hidden");
    return;
  }

  // Populate data
  if (endpointEl) endpointEl.textContent = transaction.url || "/search";
  
  // Correlation ID from request payload
  const correlationId = transaction.req?.correlationId || "--";
  if (correlationEl) correlationEl.textContent = correlationId;

  // Status Badge
  if (statusEl) {
    statusEl.textContent = `${transaction.status} ${transaction.status < 400 ? 'OK' : 'Error'}`;
    statusEl.className = `tech-status-badge ${transaction.status < 400 ? 'success' : 'error'}`;
  }

  // Elapsed Time
  if (timeEl) {
    const elapsedS = (transaction.time / 1000).toFixed(2);
    timeEl.innerHTML = `<i class="ph ph-timer"></i> ${elapsedS}s (${transaction.time}ms)`;
  }

  // Store full payloads for copying
  window.globalJsonStore = window.globalJsonStore || {};
  window.globalJsonStore['api-modal-req'] = JSON.stringify(transaction.req, null, 2);
  window.globalJsonStore['api-modal-res'] = JSON.stringify(transaction.res, null, 2);

  // Syntax highlighting
  if (reqPre) reqPre.innerHTML = syntaxHighlightJson(transaction.req, 'api-modal-req');
  if (resPre) resPre.innerHTML = syntaxHighlightJson(transaction.res, 'api-modal-res');

  // Display Modal
  modal.classList.remove("hidden");
  
  // Prevent page scroll when modal is open
  document.body.style.overflow = "hidden";
}

function closeSearchApiModal() {
  const modal = document.getElementById("search-api-modal");
  if (modal) {
    modal.classList.add("hidden");
  }
  // Restore scroll
  document.body.style.overflow = "";
}

function closeSearchApiModalOnOverlay(event) {
  if (event.target.id === "search-api-modal") {
    closeSearchApiModal();
  }
}

function switchApiModalSource(source) {
  openSearchApiModal(source);
}

function switchApiModalTab(btn, paneId) {
  const modal = document.getElementById("search-api-modal");
  if (!modal) return;

  // Switch tabs
  modal.querySelectorAll(".api-modal-tab").forEach(t => t.classList.remove("active"));
  btn.classList.add("active");

  // Switch panes
  modal.querySelectorAll(".api-modal-pane").forEach(p => p.classList.remove("active"));
  const targetPane = document.getElementById(paneId);
  if (targetPane) {
    targetPane.classList.add("active");
  }

  // Reset search
  const searchInput = document.getElementById("api-modal-search-input");
  if (searchInput) {
    searchInput.value = "";
    filterApiModalJson();
  }
}

function copyApiModalJson(type) {
  const storeId = type === 'request' ? 'api-modal-req' : 'api-modal-res';
  const preId = type === 'request' ? 'api-modal-req-pre' : 'api-modal-res-pre';
  const jsonText = window.globalJsonStore[storeId] || document.getElementById(preId).textContent;
  
  navigator.clipboard.writeText(jsonText).then(() => {
    const btn = document.querySelector(`#api-modal-${type === 'request' ? 'req' : 'res'}-pane .pane-action-btn`);
    if (!btn) return;
    const originalContent = btn.innerHTML;
    btn.innerHTML = '<i class="ph ph-check" style="color: #10b981;"></i> Copied!';
    btn.style.borderColor = '#10b981';
    btn.style.color = '#10b981';
    setTimeout(() => {
      btn.innerHTML = originalContent;
      btn.style.borderColor = '';
      btn.style.color = '';
    }, 2000);
  });
}

function filterApiModalJson() {
  const query = document.getElementById("api-modal-search-input").value.trim().toLowerCase();
  const activePane = document.querySelector(".api-modal-pane.active");
  if (!activePane) return;
  
  const pre = activePane.querySelector("pre.tech-json");
  const countEl = document.getElementById("api-modal-search-count");
  const step = window.activeApiModalStep || 'search';
  const transaction = lastApiTransactions[step];
  if (!transaction) return;
  
  const isResponse = activePane.id.includes("res-pane");
  const originalData = isResponse ? transaction.res : transaction.req;
  if (!originalData) return;
  
  let formattedJson = JSON.stringify(originalData, null, 2);
  
  // Truncate if extreme
  const MAX_LEN = 12000;
  if (formattedJson.length > MAX_LEN) {
    formattedJson = formattedJson.substring(0, MAX_LEN) + `\n\n... [JSON truncated for performance] ...`;
  }
  
  if (!query) {
    pre.innerHTML = syntaxHighlightJson(formattedJson);
    if (countEl) countEl.classList.add("hidden");
    return;
  }
  
  const highlightedHtml = syntaxHighlightJson(formattedJson);
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = highlightedHtml;
  
  let matchesCount = 0;
  
  function highlightTextNodes(node) {
    if (node.nodeType === 3) { // Text Node
      const text = node.nodeValue;
      const index = text.toLowerCase().indexOf(query);
      if (index >= 0) {
        matchesCount++;
        const span = document.createElement("span");
        span.className = "json-search-match";
        span.textContent = text.substr(index, query.length);
        
        const afterText = document.createTextNode(text.substr(index + query.length));
        const beforeText = document.createTextNode(text.substr(0, index));
        
        const parent = node.parentNode;
        parent.insertBefore(beforeText, node);
        parent.insertBefore(span, node);
        parent.insertBefore(afterText, node);
        parent.removeChild(node);
        
        highlightTextNodes(afterText);
      }
    } else if (node.nodeType === 1) { // Element Node
      const children = Array.from(node.childNodes);
      for (let child of children) {
        highlightTextNodes(child);
      }
    }
  }
  
  highlightTextNodes(tempDiv);
  pre.innerHTML = tempDiv.innerHTML;
  
  if (countEl) {
    if (matchesCount > 0) {
      countEl.textContent = `${matchesCount} match${matchesCount > 1 ? 'es' : ''}`;
      countEl.classList.remove("hidden");
    } else {
      countEl.textContent = "0 matches";
      countEl.classList.remove("hidden");
    }
  }
}

