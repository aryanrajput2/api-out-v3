// Dashboard JavaScript
const API_BASE = window.location.origin;

// Analytics Functions
let allBookings = []; // Store all bookings for filtering

async function loadAnalytics() {
  try {
    const response = await fetch(`${API_BASE}/api/analytics/stats?hours=24`);
    const data = await response.json();
    
    if (data.ok && data.stats) {
      displayAnalytics(data.stats);
    }
  } catch (error) {
    console.error('Error loading analytics:', error);
  }
}

function displayAnalytics(stats) {
  const overview = stats.overview;
  
  // Update main stat cards
  document.getElementById('success-rate').textContent = `${overview.success_rate}%`;
  document.getElementById('success-subtitle').textContent = 
    `${overview.successful_calls} / ${overview.total_api_calls} calls`;
  
  document.getElementById('successful-calls').textContent = overview.successful_calls;
  document.getElementById('failed-calls').textContent = overview.failed_calls;
  document.getElementById('error-subtitle').textContent = `${overview.total_errors} errors`;
  document.getElementById('avg-response-time').textContent = `${overview.avg_response_time_ms}ms`;
  
  // Update mini stats
  document.getElementById('total-searches').textContent = overview.total_searches;
  document.getElementById('total-bookings').textContent = overview.total_bookings;
  document.getElementById('booking-success-rate').textContent = `${overview.booking_success_rate}%`;
  document.getElementById('total-page-views').textContent = overview.total_page_views;
  
  // Display endpoint stats
  displayEndpointStats(stats.endpoint_stats);
  
  // Display recent errors
  displayRecentErrors(stats.recent_errors);
  
  // Display recent API calls
  displayRecentApiCalls(stats.recent_api_calls);
}

function displayEndpointStats(endpointStats) {
  const container = document.getElementById('endpoint-stats');
  const countEl = document.getElementById('endpoint-count');
  
  const endpoints = Object.entries(endpointStats);
  countEl.textContent = `${endpoints.length} endpoint${endpoints.length !== 1 ? 's' : ''}`;
  
  if (endpoints.length === 0) {
    container.innerHTML = `
      <div class="loading-state">
        <i class="ph ph-info" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 16px;"></i>
        <p>No endpoint data available</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = endpoints.map(([endpoint, stats]) => {
    const successRate = stats.count > 0 ? ((stats.success / stats.count) * 100).toFixed(1) : 0;
    return `
      <div class="endpoint-item">
        <div class="endpoint-header">
          <div class="endpoint-name">${endpoint}</div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">
              ${successRate}% success
            </span>
          </div>
        </div>
        <div class="endpoint-stats-row">
          <div class="endpoint-stat">
            <div class="endpoint-stat-value">${stats.count}</div>
            <div class="endpoint-stat-label">Total</div>
          </div>
          <div class="endpoint-stat" style="background: rgba(16, 185, 129, 0.08);">
            <div class="endpoint-stat-value" style="color: var(--success);">${stats.success}</div>
            <div class="endpoint-stat-label">Success</div>
          </div>
          <div class="endpoint-stat" style="background: rgba(239, 68, 68, 0.08);">
            <div class="endpoint-stat-value" style="color: var(--danger);">${stats.failed}</div>
            <div class="endpoint-stat-label">Failed</div>
          </div>
          <div class="endpoint-stat" style="background: rgba(6, 182, 212, 0.08);">
            <div class="endpoint-stat-value" style="color: #D85A30;">${Math.round(stats.avg_time)}ms</div>
            <div class="endpoint-stat-label">Avg Time</div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function displayRecentErrors(errors) {
  const container = document.getElementById('error-list');
  const countEl = document.getElementById('error-count');
  
  countEl.textContent = `${errors.length} error${errors.length !== 1 ? 's' : ''}`;
  
  if (errors.length === 0) {
    container.innerHTML = `
      <div class="loading-state">
        <i class="ph ph-check-circle" style="font-size: 3rem; color: var(--success); margin-bottom: 16px;"></i>
        <p>No errors in the last 24 hours</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = errors.reverse().map(error => {
    const time = new Date(error.timestamp).toLocaleString();
    return `
      <div class="error-item">
        <div class="error-header">
          <span class="error-type">${error.type}</span>
          <span class="error-time">${time}</span>
        </div>
        <div class="error-source">${error.source}</div>
        <div class="error-message">${error.message}</div>
      </div>
    `;
  }).join('');
}

function displayRecentApiCalls(calls) {
  const container = document.getElementById('api-call-list');
  const countEl = document.getElementById('api-call-count');
  
  countEl.textContent = `${calls.length} call${calls.length !== 1 ? 's' : ''}`;
  
  if (calls.length === 0) {
    container.innerHTML = `
      <div class="loading-state">
        <i class="ph ph-info" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 16px;"></i>
        <p>No API calls recorded</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = calls.reverse().map(call => {
    const time = new Date(call.timestamp).toLocaleString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
    const statusClass = call.success ? 'success' : 'failed';
    const statusIcon = call.success ? 'ph-check-circle' : 'ph-x-circle';
    
    return `
      <div class="api-call-item ${statusClass}">
        <div class="api-call-info">
          <span class="api-call-method">${call.method}</span>
          <span class="api-call-endpoint">${call.endpoint}</span>
        </div>
        <div class="api-call-meta">
          <span class="api-call-status ${statusClass}">
            <i class="ph ${statusIcon}"></i>
            ${call.status_code}
          </span>
          <span class="api-call-time">${call.response_time_ms}ms</span>
          <span class="api-call-timestamp">${time}</span>
        </div>
      </div>
    `;
  }).join('');
}

function refreshAnalytics() {
  showNotification('Refreshing analytics...', 'info');
  loadAnalytics();
}

// Bookings Management Functions
async function loadBookings() {
  try {
    const response = await fetch(`${API_BASE}/recent-bookings?limit=100`);
    const data = await response.json();
    
    if (data.ok && data.bookings) {
      allBookings = data.bookings;
      displayBookings(allBookings);
      updateBookingsStats(allBookings);
    }
  } catch (error) {
    console.error('Error loading bookings:', error);
    showBookingsError();
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showNotification('Booking ID copied to clipboard!', 'success');
  }).catch(err => {
    console.error('Failed to copy ID:', err);
  });
}

function displayBookings(bookings) {
  const container = document.getElementById('bookings-list');
  const countEl = document.getElementById('bookings-list-count');
  
  countEl.textContent = `${bookings.length} booking${bookings.length !== 1 ? 's' : ''}`;
  
  if (bookings.length === 0) {
    container.innerHTML = `
      <div class="no-bookings-state">
        <i class="ph ph-calendar-x"></i>
        <p>No bookings found</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = bookings.map(booking => {
    const date = new Date(booking.createdAt);
    const formattedDate = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const bookingIdLower = (booking.id || '').toLowerCase();
    let envName = 'Prod / Admin TJ';
    let envColor = '#D85A30';
    let envBg = 'rgba(0, 102, 204, 0.08)';
    let envBorder = 'rgba(0, 102, 204, 0.2)';
    let defaultApiKey = '751045f64b362c-7462-4f82-ad59-0a9c2b9b9fc9';
    
    if (bookingIdLower.startsWith('tgp')) {
      envName = 'API Test Server (Sandbox)';
      envColor = '#5d6a4a';
      envBg = 'rgba(16, 185, 129, 0.08)';
      envBorder = 'rgba(16, 185, 129, 0.2)';
      defaultApiKey = '6116982da6b759-28f8-4cdf-b210-04cb98116165';
    }
    
    const apiKey = booking.usedApiKey || defaultApiKey;

    const totalTime = booking.totalResponseTime || 0;
    const totalSeconds = (totalTime / 1000).toFixed(2);
    
    // Latency steps breakdown
    const rt = booking.responseTimes || {};
    const searchTime = rt.search ? `${(rt.search / 1000).toFixed(1)}s` : '—';
    const staticDetailTime = rt.staticDetail ? `${(rt.staticDetail / 1000).toFixed(1)}s` : '—';
    const bookTime = rt.book ? `${(rt.book / 1000).toFixed(1)}s` : '—';
    const bookingDetailTime = rt.bookingDetail ? `${(rt.bookingDetail / 1000).toFixed(1)}s` : '—';
    
    const steps = [
      { label: 'Search', time: searchTime, active: !!rt.search },
      { label: 'Detail', time: staticDetailTime, active: !!rt.staticDetail },
      { label: 'Book', time: bookTime, active: !!rt.book },
      { label: 'Details', time: bookingDetailTime, active: !!rt.bookingDetail }
    ];
    
    const stepsHtml = steps.map((step, idx) => `
      <div class="timeline-step ${step.active ? 'active' : ''}">
        <span class="step-dot">${idx + 1}</span>
        <span class="step-label">${step.label}</span>
        <span class="step-time">${step.time}</span>
      </div>
    `).join('');
    
    // Capping total latency visualization at 12 seconds for the progress bar
    const latencyClass = totalSeconds < 3.0 ? 'fast' : (totalSeconds < 6.0 ? 'moderate' : 'slow');
    const progressWidth = Math.min((totalTime / 12000) * 100, 100);
    
    return `
      <div class="booking-card">
        <!-- Header -->
        <div class="booking-header">
          <div class="booking-id">
            <div class="id-badge">
              <i class="ph ph-ticket"></i>
              <span>${booking.id}</span>
            </div>
            <button class="btn-copy-id" onclick="copyToClipboard('${booking.id}')" title="Copy ID">
              <i class="ph ph-copy"></i>
            </button>
          </div>
          
          <div class="booking-header-actions">
            <span class="status-badge">
              <span class="dot"></span>CONFIRMED
            </span>
            <span class="booking-date">
              <i class="ph ph-calendar" style="margin-right: 4px;"></i>
              ${formattedDate}
            </span>
          </div>
        </div>
        
        <!-- Content -->
        <div class="booking-content">
          <!-- Environment & API Key Badge Row -->
          <div class="booking-metadata-row" style="display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; align-items: center;">
            <!-- Env Badge -->
            <div class="meta-badge env" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: ${envBg}; border: 1px solid ${envBorder}; border-radius: 8px; font-size: 0.8rem; font-weight: 700; color: ${envColor};">
              <i class="ph ph-globe" style="font-size: 1rem;"></i>
              <span>${envName}</span>
            </div>
            <!-- API Key Badge -->
            <div class="meta-badge apikey" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 8px; font-size: 0.8rem; font-weight: 700; color: #d97706; font-family: monospace; letter-spacing: 0.5px; flex: 1; min-width: 200px; justify-content: space-between; position: relative;">
              <span style="display: flex; align-items: center; gap: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 320px;" title="Full API Key: ${apiKey}">
                <i class="ph ph-key" style="font-size: 1rem; color: #f59e0b;"></i>
                <span>${apiKey}</span>
              </span>
              <button onclick="navigator.clipboard.writeText('${apiKey}').then(() => showNotification('API Key copied to clipboard!', 'success'))" style="background: none; border: none; padding: 0 4px; color: #d97706; cursor: pointer; display: flex; align-items: center; font-size: 0.85rem;" title="Copy API Key">
                <i class="ph ph-copy"></i>
              </button>
            </div>
          </div>
          
          ${totalTime > 0 ? `
          <!-- Latency Timeline -->
          <div class="latency-timeline">
            <div class="timeline-header">
              <span>API Latency Timeline</span>
              <span style="font-family: monospace; font-weight: 800;">Breakdown</span>
            </div>
            <div class="timeline-steps">
              ${stepsHtml}
            </div>
          </div>
          
          <!-- Overall Latency Bar -->
          <div class="latency-bar-container">
            <div class="latency-bar-header">
              <span>Total Latency</span>
              <span style="font-family: monospace; font-weight: 800;">${totalSeconds}s</span>
            </div>
            <div class="latency-bar-bg">
              <div class="latency-bar-fill ${latencyClass}" style="width: ${progressWidth}%"></div>
            </div>
          </div>
          ` : `
          <div class="latency-timeline" style="opacity: 0.6; padding: 24px; text-align: center; border: 1px dashed rgba(32, 40, 67, 0.2);">
            <i class="ph ph-clock-slash" style="font-size: 1.8rem; margin-bottom: 8px; color: var(--text-muted);"></i>
            <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-muted);">Latency data unavailable</div>
          </div>
          `}
        </div>
        
        <!-- Footer -->
        <div class="booking-footer">
          <div class="booking-actions">
            <button class="btn-dashboard-action btn-view" onclick="viewBookingDetail('${booking.id}')">
              <i class="ph ph-arrow-square-out"></i> Details
            </button>
            <button class="btn-icon btn-delete" style="flex: none; border-radius: 12px; height: 100%; min-height: 42px; width: 42px;" onclick="deleteBooking('${booking.id}')" title="Delete">
              <i class="ph ph-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function updateBookingsStats(bookings) {
  const totalCount = bookings.length;
  document.getElementById('total-bookings-count').textContent = totalCount;
  
  // Calculate average response time
  if (totalCount > 0) {
    const avgTime = bookings.reduce((sum, b) => sum + (b.totalResponseTime || 0), 0) / totalCount;
    document.getElementById('avg-booking-time').textContent = `${(avgTime / 1000).toFixed(2)}s`;
  } else {
    document.getElementById('avg-booking-time').textContent = '0ms';
  }
  
  // Count today's bookings
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCount = bookings.filter(b => {
    const bookingDate = new Date(b.createdAt);
    bookingDate.setHours(0, 0, 0, 0);
    return bookingDate.getTime() === today.getTime();
  }).length;
  document.getElementById('bookings-today').textContent = todayCount;
  
  // Count this week's bookings
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekCount = bookings.filter(b => new Date(b.createdAt) >= weekAgo).length;
  document.getElementById('bookings-this-week').textContent = weekCount;
}

function filterBookings() {
  const searchId = document.getElementById('search-booking-id').value.toLowerCase();
  const dateFrom = document.getElementById('filter-date-from').value;
  const dateTo = document.getElementById('filter-date-to').value;
  
  let filtered = allBookings;
  
  // Filter by booking ID
  if (searchId) {
    filtered = filtered.filter(b => b.id.toLowerCase().includes(searchId));
  }
  
  // Filter by date range
  if (dateFrom) {
    const fromDate = new Date(dateFrom);
    fromDate.setHours(0, 0, 0, 0);
    filtered = filtered.filter(b => new Date(b.createdAt) >= fromDate);
  }
  
  if (dateTo) {
    const toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999);
    filtered = filtered.filter(b => new Date(b.createdAt) <= toDate);
  }
  
  displayBookings(filtered);
}

function clearBookingFilters() {
  document.getElementById('search-booking-id').value = '';
  document.getElementById('filter-date-from').value = '';
  document.getElementById('filter-date-to').value = '';
  displayBookings(allBookings);
}

function refreshBookings() {
  showNotification('Refreshing bookings...', 'info');
  loadBookings();
}

async function deleteBooking(bookingId) {
  if (!confirm(`Are you sure you want to delete booking ${bookingId}?`)) {
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/booking/${bookingId}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (data.ok) {
      showNotification(`Booking ${bookingId} deleted successfully`, 'success');
      loadBookings();
    } else {
      showNotification(data.message || 'Error deleting booking', 'error');
    }
  } catch (error) {
    showNotification('Error deleting booking', 'error');
  }
}

function viewBookingDetail(bookingId) {
  // Open the booking detail page in the main app
  window.open(`/home/booking-detail?id=${bookingId}`, '_blank');
}

function showBookingsError() {
  const container = document.getElementById('bookings-list');
  container.innerHTML = `
    <div class="no-bookings-state">
      <i class="ph ph-warning-circle" style="color: var(--danger);"></i>
      <p>Error loading bookings. Please try again.</p>
    </div>
  `;
}

// Show/Hide sections
function showSection(sectionName) {
  // Hide all sections
  document.querySelectorAll('.dashboard-section').forEach(section => {
    section.classList.remove('active');
  });
  
  // Remove active from all nav items
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  
  // Show selected section
  const targetSection = document.getElementById(`${sectionName}-section`);
  if (targetSection) {
    targetSection.classList.add('active');
  }
  
  // Add active to clicked nav item
  const navItem = event.target.closest('.nav-item');
  if (navItem) {
    navItem.classList.add('active');
  }
  
  // Refresh data when switching to specific sections
  if (sectionName === 'analytics') {
    loadAnalytics();
  } else if (sectionName === 'bookings') {
    loadBookings();
  } else if (sectionName === 'deployment') {
    loadDeploymentStatus();
  } else if (sectionName === 'whitelist') {
    loadCurrentIP();
    loadWhitelistStatus();
    loadIPList();
  } else if (sectionName === 'api-config') {
    loadAPIConfiguration();
  } else if (sectionName === 'logs') {
    loadLogs();
  }
  
  // Close mobile sidebar if open
  const sidebar = document.querySelector('.dashboard-sidebar');
  if (sidebar) {
    sidebar.classList.remove('open');
  }
  const toggleBtn = document.querySelector('.mobile-sidebar-toggle i');
  if (toggleBtn) {
    toggleBtn.className = 'ph ph-list';
  }
}

// Load current IP
async function loadCurrentIP() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    document.getElementById('current-ip').textContent = data.ip;
  } catch (error) {
    document.getElementById('current-ip').textContent = 'Unable to detect';
  }
}

// Load whitelist status
async function loadWhitelistStatus() {
  try {
    const response = await fetch(`${API_BASE}/api/whitelist/status`);
    const data = await response.json();
    
    const statusBtn = document.querySelector('.btn-toggle');
    const statusText = document.getElementById('whitelist-status');
    
    if (data.enabled) {
      statusBtn.classList.add('enabled');
      statusBtn.classList.remove('disabled');
      statusText.textContent = 'Enabled';
    } else {
      statusBtn.classList.add('disabled');
      statusBtn.classList.remove('enabled');
      statusText.textContent = 'Disabled';
    }
  } catch (error) {
    console.error('Error loading whitelist status:', error);
  }
}

// Toggle whitelist
async function toggleWhitelist() {
  try {
    const response = await fetch(`${API_BASE}/api/whitelist/toggle`, {
      method: 'POST'
    });
    const data = await response.json();
    
    if (data.ok) {
      await loadWhitelistStatus();
      showNotification(data.enabled ? 'Whitelist enabled' : 'Whitelist disabled', 'success');
    }
  } catch (error) {
    showNotification('Error toggling whitelist', 'error');
  }
}

// Load IP list
async function loadIPList() {
  try {
    const response = await fetch(`${API_BASE}/api/whitelist/ips`);
    const data = await response.json();
    
    const ipList = document.getElementById('ip-list');
    const ipCount = document.getElementById('ip-count');
    
    if (!data.ips || data.ips.length === 0) {
      ipList.innerHTML = `
        <div class="loading-state">
          <i class="ph ph-warning" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 16px;"></i>
          <p>No IP addresses whitelisted yet</p>
        </div>
      `;
      ipCount.textContent = '0 IPs';
      return;
    }
    
    ipCount.textContent = `${data.ips.length} IP${data.ips.length !== 1 ? 's' : ''}`;
    
    ipList.innerHTML = data.ips.map((item, index) => `
      <div class="ip-item" style="animation-delay: ${index * 0.05}s">
        <div class="ip-info">
          <div class="ip-address">${item.ip}</div>
          <div class="ip-label">${item.label || 'No label'}</div>
        </div>
        <div class="ip-actions">
          <button class="btn-icon btn-delete" onclick="deleteIP('${item.ip}')" title="Remove IP">
            <i class="ph ph-trash"></i>
          </button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading IP list:', error);
    showNotification('Error loading IP list', 'error');
  }
}

// Add new IP
async function addIP(event) {
  event.preventDefault();
  
  const ipInput = document.getElementById('new-ip');
  const labelInput = document.getElementById('ip-label');
  
  const ip = ipInput.value.trim();
  const label = labelInput.value.trim();
  
  try {
    const response = await fetch(`${API_BASE}/api/whitelist/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip, label })
    });
    
    const data = await response.json();
    
    if (data.ok) {
      showNotification(`IP ${ip} added successfully`, 'success');
      ipInput.value = '';
      labelInput.value = '';
      await loadIPList();
    } else {
      showNotification(data.message || 'Error adding IP', 'error');
    }
  } catch (error) {
    showNotification('Error adding IP', 'error');
  }
}

// Delete IP
async function deleteIP(ip) {
  if (!confirm(`Are you sure you want to remove ${ip} from the whitelist?`)) {
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/api/whitelist/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip })
    });
    
    const data = await response.json();
    
    if (data.ok) {
      showNotification(`IP ${ip} removed successfully`, 'success');
      await loadIPList();
    } else {
      showNotification(data.message || 'Error removing IP', 'error');
    }
  } catch (error) {
    showNotification('Error removing IP', 'error');
  }
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 24px;
    right: 24px;
    padding: 16px 24px;
    background: ${type === 'success' ? 'linear-gradient(135deg, #5d6a4a, #5d6a4a)' : 'linear-gradient(135deg, #ef4444, #dc2626)'};
    color: white;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    z-index: 10000;
    font-weight: 600;
    animation: slideInFromRight 0.3s ease-out;
    display: flex;
    align-items: center;
    gap: 12px;
  `;
  
  notification.innerHTML = `
    <i class="ph ${type === 'success' ? 'ph-check-circle' : 'ph-warning-circle'}" style="font-size: 1.5rem;"></i>
    <span>${message}</span>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// API Configuration Functions
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

function saveEnvironment() {
  const envEl = document.getElementById("dashboard-env");
  if (!envEl) return;
  
  localStorage.setItem("tj_env", envEl.value);
  updateActiveConfigDisplay();
  showNotification('Environment updated successfully', 'success');
}

function handleDashboardApiKeySelection() {
  const selectEl = document.getElementById("dashboard-apikey-select");
  const customContainer = document.getElementById("dashboard-custom-apikey-container");
  
  if (!selectEl) return;
  
  if (selectEl.value === "custom") {
    customContainer.style.display = "block";
    unmaskDashboardCustomKey();
  } else {
    customContainer.style.display = "none";
    localStorage.setItem("tj_apikey", selectEl.value);
    updateActiveConfigDisplay();
    showNotification('API key updated successfully', 'success');
  }
}

function saveDashboardCustomApiKey() {
  const inputEl = document.getElementById("dashboard-apikey-custom");
  if (!inputEl) return;
  const rawData = inputEl.value;
  
  // Guard against saving asterisks accidentally
  if (!rawData.includes("***")) {
    localStorage.setItem("tj_apikey", rawData.trim());
    updateActiveConfigDisplay();
  }
}

function unmaskDashboardCustomKey() {
  const inputEl = document.getElementById("dashboard-apikey-custom");
  if (inputEl) {
    const raw = localStorage.getItem("tj_apikey") || "";
    inputEl.value = raw;
  }
}

function maskDashboardCustomKey() {
  const inputEl = document.getElementById("dashboard-apikey-custom");
  const rawKey = localStorage.getItem("tj_apikey") || "";
  
  if (inputEl && rawKey.length > 10) {
    inputEl.value = rawKey.substring(0, 10) + "******************";
  } else if (inputEl) {
    inputEl.value = rawKey;
  }
}

function loadAPIConfiguration() {
  // Load environment
  const envEl = document.getElementById("dashboard-env");
  const savedEnv = localStorage.getItem("tj_env") || "https://tj-hotel-admin.tripjack.com/";
  if (envEl) envEl.value = savedEnv;
  
  // Load API key
  const savedApikey = localStorage.getItem("tj_apikey") || "7510455af381d5-d315-41e2-8e5e-e94cc0a960fe";
  const selectEl = document.getElementById("dashboard-apikey-select");
  const customContainer = document.getElementById("dashboard-custom-apikey-container");
  
  if (PREDEFINED_KEYS.includes(savedApikey)) {
    if (selectEl) selectEl.value = savedApikey;
    if (customContainer) customContainer.style.display = "none";
  } else {
    if (selectEl) selectEl.value = "custom";
    if (customContainer) customContainer.style.display = "block";
    maskDashboardCustomKey();
  }
  
  updateActiveConfigDisplay();
}

function updateActiveConfigDisplay() {
  const envStr = localStorage.getItem("tj_env") || "https://tj-hotel-admin.tripjack.com/";
  const keyStr = localStorage.getItem("tj_apikey") || "";
  
  // Update environment display
  const envDisplay = document.getElementById("active-env-display");
  const currentEnvDisplay = document.getElementById("current-env");
  
  let envName = "";
  if (envStr.includes("apitest-hms")) {
    envName = "API Test Server (Sandbox)";
  } else if (envStr.includes("admin")) {
    envName = "Admin TJ";
  } else {
    envName = "Prod Tripjack";
  }
  
  if (envDisplay) envDisplay.textContent = envName;
  if (currentEnvDisplay) currentEnvDisplay.textContent = envName;
  
  // Update API key display (masked)
  const keyDisplay = document.getElementById("active-key-display");
  if (keyDisplay) {
    if (keyStr.length > 10) {
      keyDisplay.textContent = keyStr.substring(0, 10) + "***";
    } else if (keyStr) {
      keyDisplay.textContent = keyStr;
    } else {
      keyDisplay.textContent = "Not Set";
    }
  }
}

// Initialize dashboard
window.addEventListener('DOMContentLoaded', () => {
  // Check URL hash and show appropriate section
  const hash = window.location.hash.substring(1); // Remove the # symbol
  if (hash) {
    // Find the section and nav item
    const section = document.getElementById(`${hash}-section`);
    const navItem = document.querySelector(`a[href="#${hash}"]`);
    
    if (section && navItem) {
      // Hide all sections
      document.querySelectorAll('.dashboard-section').forEach(s => {
        s.classList.remove('active');
      });
      
      // Remove active from all nav items
      document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
      });
      
      // Show the section from hash
      section.classList.add('active');
      navItem.classList.add('active');
      
      // Load data for specific sections
      if (hash === 'whitelist') {
        loadCurrentIP();
        loadWhitelistStatus();
        loadIPList();
      } else if (hash === 'analytics') {
        loadAnalytics();
      } else if (hash === 'api-config') {
        loadAPIConfiguration();
      } else if (hash === 'bookings') {
        loadBookings();
      } else if (hash === 'deployment') {
        loadDeploymentStatus();
      }
    } else {
      // Hash not found, default to analytics
      loadAnalytics();
      loadCurrentIP();
      loadWhitelistStatus();
      loadIPList();
      loadAPIConfiguration();
      loadDeploymentStatus();
    }
  } else {
    // No hash, load all
    loadAnalytics();
    loadCurrentIP();
    loadWhitelistStatus();
    loadIPList();
    loadAPIConfiguration();
    loadDeploymentStatus();
  }
  
  // Auto-refresh analytics every 30 seconds
  setInterval(loadAnalytics, 30000);
  
  // Auto-refresh deployment every 30 seconds
  setInterval(loadDeploymentStatus, 30000);
});


// ============================================================================
// DEPLOYMENT & ENVIRONMENT MANAGEMENT FUNCTIONS
// ============================================================================

async function loadDeploymentStatus() {
  try {
    console.log('Loading deployment status...');
    const response = await fetch(`${API_BASE}/api/deployment/status`);
    const data = await response.json();
    
    console.log('Deployment status response:', data);
    
    if (data.ok) {
      // Update current environment display
      const envDetails = data.environment_details;
      const envNameEl = document.getElementById('current-env-name');
      const envUrlEl = document.getElementById('current-env-url');
      const envStatusEl = document.getElementById('current-env-status');
      
      if (envNameEl) envNameEl.textContent = envDetails.name || 'Unknown';
      if (envUrlEl) envUrlEl.textContent = envDetails.url || 'N/A';
      if (envStatusEl) envStatusEl.textContent = envDetails.status || 'Unknown';
      
      // Load all environments for dropdown
      await loadEnvironmentsList();
      
      // Load releases
      await loadReleases();
    } else {
      console.error('Deployment status error:', data.error);
    }
  } catch (error) {
    console.error('Error loading deployment status:', error);
  }
}

async function loadEnvironmentsList() {
  try {
    console.log('Loading environments list...');
    const response = await fetch(`${API_BASE}/api/deployment/environments`);
    const data = await response.json();
    
    console.log('Environments response:', data);
    
    if (data.ok && data.environments) {
      const select = document.getElementById('env-select');
      if (!select) {
        console.error('env-select element not found');
        return;
      }
      
      select.innerHTML = '<option value="">-- Select Environment --</option>';
      
      Object.entries(data.environments).forEach(([key, env]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = `${env.name} (${key})`;
        select.appendChild(option);
        console.log(`Added environment option: ${key}`);
      });
      
      console.log('Environments loaded successfully');
    } else {
      console.error('Failed to load environments:', data.error);
    }
  } catch (error) {
    console.error('Error loading environments:', error);
  }
}

async function switchEnvironment() {
  const envSelect = document.getElementById('env-select');
  const envName = envSelect.value;
  
  if (!envName) {
    alert('Please select an environment');
    return;
  }
  
  try {
    console.log('Switching to environment:', envName);
    const response = await fetch(`${API_BASE}/api/deployment/switch-environment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ environment: envName })
    });
    
    const data = await response.json();
    
    console.log('Switch environment response:', data);
    
    if (data.ok) {
      alert(`Successfully switched to ${data.current_environment}`);
      loadDeploymentStatus();
    } else {
      alert(`Error: ${data.error}`);
    }
  } catch (error) {
    console.error('Error switching environment:', error);
    alert('Error switching environment');
  }
}

async function createRelease() {
  const version = document.getElementById('release-version').value.trim();
  const changes = document.getElementById('release-changes').value.trim();
  const fromEnv = document.getElementById('release-from-env').value;
  
  console.log('Creating release:', { version, changes, fromEnv });
  
  if (!version || !changes) {
    alert('Please fill in all fields');
    return;
  }
  
  if (!version.match(/^v\d+\.\d+\.\d+$/)) {
    alert('Version must be in format: v1.0.0');
    return;
  }
  
  try {
    console.log('Sending create release request...');
    const response = await fetch(`${API_BASE}/api/deployment/create-release`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        version,
        changes,
        from_environment: fromEnv,
        to_environment: 'admin'
      })
    });
    
    const data = await response.json();
    
    console.log('Create release response:', data);
    
    if (data.ok) {
      alert(`✓ Release ${version} created successfully!\nStatus: Pending Approval`);
      document.getElementById('release-version').value = '';
      document.getElementById('release-changes').value = '';
      await loadReleases();
    } else {
      alert(`Error: ${data.error}`);
    }
  } catch (error) {
    console.error('Error creating release:', error);
    alert('Error creating release: ' + error.message);
  }
}

async function loadReleases() {
  try {
    console.log('Loading releases...');
    const response = await fetch(`${API_BASE}/api/deployment/releases?limit=10`);
    const data = await response.json();
    
    console.log('Releases response:', data);
    
    if (data.ok && data.releases) {
      displayReleases(data.releases);
    } else {
      console.error('Failed to load releases:', data.error);
      const container = document.getElementById('releases-list');
      if (container) {
        container.innerHTML = '<div style="padding: 16px; background: #fee2e2; border-radius: 8px; color: #991b1b;">Error loading releases</div>';
      }
    }
  } catch (error) {
    console.error('Error loading releases:', error);
    const container = document.getElementById('releases-list');
    if (container) {
      container.innerHTML = '<div style="padding: 16px; background: #fee2e2; border-radius: 8px; color: #991b1b;">Error: ' + error.message + '</div>';
    }
  }
}

function displayReleases(releases) {
  const container = document.getElementById('releases-list');
  
  if (releases.length === 0) {
    container.innerHTML = '<div style="padding: 16px; background: #FBF7F4; border-radius: 8px; text-align: center; color: #999;">No releases yet</div>';
    return;
  }
  
  container.innerHTML = releases.map(release => {
    const statusColor = release.status === 'approved' ? '#5d6a4a' : '#f59e0b';
    const statusBg = release.status === 'approved' ? '#f1f1ea' : '#fffbeb';
    const timestamp = new Date(release.timestamp).toLocaleString();
    
    return `
          <span style="background: ${statusBg}; color: ${statusColor}; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; text-transform: capitalize;">
            ${release.status}
          </span>
        </div>
        <div style="font-size: 0.85rem; color: #666; margin-bottom: 8px;">
          ${release.changes}
        </div>
        <div style="font-size: 0.75rem; color: #999;">
          ${timestamp}
        </div>
        ${release.status === 'pending_approval' ? `
          <button onclick="approveRelease('${release.id}')" style="margin-top: 8px; padding: 6px 12px; background: #D85A30; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; font-weight: 600;">
            Approve Release
          </button>
        ` : ''}
      </div>
    `;
  }).join('');
}

async function approveRelease(releaseId) {
  try {
    const response = await fetch(`${API_BASE}/api/deployment/approve-release`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        release_id: releaseId,
        approved_by: 'admin'
      })
    });
    
    const data = await response.json();
    
    if (data.ok) {
      alert('Release approved successfully!');
      loadReleases();
    } else {
      alert(`Error: ${data.error}`);
    }
  } catch (error) {
    console.error('Error approving release:', error);
    alert('Error approving release');
  }
}

// Load deployment data when deployment section is shown
function loadDeploymentSection() {
  loadDeploymentStatus();
}

// Mobile sidebar drawer toggler
function toggleMobileSidebar() {
  const sidebar = document.querySelector('.dashboard-sidebar');
  if (!sidebar) return;
  sidebar.classList.toggle('open');
  
  const toggleBtn = document.querySelector('.mobile-sidebar-toggle i');
  if (toggleBtn) {
    if (sidebar.classList.contains('open')) {
      toggleBtn.className = 'ph ph-x';
    } else {
      toggleBtn.className = 'ph ph-list';
    }
  }
}

// Load and display API Logs in Admin panel
async function loadLogs() {
  const listEl = document.getElementById("logs-list");
  const countEl = document.getElementById("logs-count");
  if (!listEl) return;

  listEl.innerHTML = `
    <div class="loading-state">
      <div class="loader"></div>
      <p>Retrieving API logs from server...</p>
    </div>`;

  try {
    const res = await fetch("/api-logs");
    const logs = await res.json();

    if (countEl) {
      countEl.textContent = `${logs.length || 0} logs`;
    }

    if (!Array.isArray(logs) || logs.length === 0) {
      listEl.innerHTML = `
        <div class="no-bookings-state">
          <i class="ph ph-receipt" style="font-size: 2.5rem; color: var(--text-muted); margin-bottom: 12px;"></i>
          <p>No API transactions recorded yet.</p>
        </div>`;
      return;
    }

    let html = "";
    logs.forEach((log, index) => {
      const isReq = log.type === "REQUEST";
      const typeStyle = isReq 
        ? "background: rgba(16, 185, 129, 0.1); color: #5d6a4a; border: 1px solid rgba(16, 185, 129, 0.2);"
        : "background: rgba(14, 165, 233, 0.1); color: #D85A30; border: 1px solid rgba(14, 165, 233, 0.2);";
      
      const badgeText = isReq ? "REQUEST" : `RESPONSE (${log.status_code || 200})`;
      const timestamp = log.timestamp || "Unknown Time";
      const endpoint = log.endpoint || "Unknown Endpoint";
      const method = log.method || "POST";
      const clientIp = log.ip || "127.0.0.1";
      const bodyData = isReq ? log.body : log.response;
      
      // Build visual preview of key attributes
      let previewInfo = "";
      if (bodyData) {
        if (bodyData.bookingId) {
          previewInfo += `<span style="padding: 2px 6px; background: rgba(0,0,0,0.05); border-radius: 4px; font-size:0.75rem;">ID: <b>${bodyData.bookingId}</b></span> `;
        }
        if (bodyData.hotelId) {
          previewInfo += `<span style="padding: 2px 6px; background: rgba(0,0,0,0.05); border-radius: 4px; font-size:0.75rem;">Hotel: <b>${bodyData.hotelId}</b></span> `;
        }
        if (bodyData.status && bodyData.status.success !== undefined) {
          const succ = bodyData.status.success;
          previewInfo += `<span style="padding: 2px 6px; background: ${succ ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}; color: ${succ ? '#5d6a4a' : '#ef4444'}; border-radius: 4px; font-size:0.75rem;">Success: <b>${succ}</b></span> `;
        }
      }

      const rawJson = JSON.stringify(bodyData || {}, null, 2);
      
      html += `
        <div class="booking-card" style="padding: 16px; display: flex; flex-direction: column; gap: 12px; transition: all 0.3s ease;">
          <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
              <span class="badge" style="padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; ${typeStyle}">${badgeText}</span>
              <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">
                <i class="ph ph-clock" style="vertical-align: middle;"></i> ${timestamp}
              </span>
              <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">
                <i class="ph ph-desktop" style="vertical-align: middle;"></i> ${clientIp}
              </span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 0.75rem; font-weight: 700; color: #D85A30; background: rgba(216, 90, 48, 0.1); padding: 2px 8px; border-radius: 4px; font-family: monospace;">${method}</span>
              <span style="font-size: 0.9rem; font-weight: 700; color: var(--primary); font-family: monospace;">${endpoint}</span>
            </div>
          </div>
          
          <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px dashed rgba(0,0,0,0.06);">
            <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
              ${previewInfo || '<span style="color: var(--text-muted); font-size: 0.75rem;">No metadata preview</span>'}
            </div>
            <button onclick="toggleLogAccordion(${index})" class="btn-dashboard-action btn-view" style="padding: 4px 10px; font-size: 0.8rem; height: auto; font-weight: 600; display: flex; align-items: center; gap: 4px;">
              <i class="ph ph-code"></i> Inspect JSON
            </button>
          </div>
          
          <div id="log-accordion-${index}" style="display: none; margin-top: 8px;">
            <div style="position: relative; background: #3a2a22; border-radius: 8px; padding: 12px; border: 1px solid rgba(255,255,255,0.05);">
              <button onclick="copyLogJson(${index})" style="position: absolute; top: 8px; right: 8px; background: rgba(255,255,255,0.1); border: none; border-radius: 4px; padding: 4px 8px; color: #fff; cursor: pointer; font-size: 0.75rem; display: flex; align-items: center; gap: 4px; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">
                <i class="ph ph-copy"></i> Copy
              </button>
              <div id="log-pre-${index}" style="margin: 0; color: #e07a52; font-family: monospace; font-size: 0.8rem; overflow: auto; max-height: 250px; line-height: 1.4; white-space: pre; text-align: left;">${rawJson}</div>
            </div>
          </div>
        </div>`;
    });

    listEl.innerHTML = html;
  } catch (error) {
    console.error("Error loading logs:", error);
    listEl.innerHTML = `
      <div class="no-bookings-state">
        <i class="ph ph-warning-circle" style="font-size: 2.5rem; color: var(--danger); margin-bottom: 12px;"></i>
        <p>Error loading API logs. Please make sure the backend server is running.</p>
      </div>`;
  }
}

// Toggle accordion display for inspecting raw JSON
function toggleLogAccordion(index) {
  const container = document.getElementById(`log-accordion-${index}`);
  if (!container) return;
  
  if (container.style.display === "none") {
    container.style.display = "block";
  } else {
    container.style.display = "none";
  }
}

// Copy JSON block text content to clipboard
function copyLogJson(index) {
  const pre = document.getElementById(`log-pre-${index}`);
  if (!pre) return;
  
  navigator.clipboard.writeText(pre.textContent)
    .then(() => {
      showNotification("JSON copied to clipboard!", "success");
    })
    .catch(() => {
      showNotification("Failed to copy JSON", "error");
    });
}
