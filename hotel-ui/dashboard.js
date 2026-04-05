// Dashboard JavaScript
const API_BASE = window.location.origin;

// Analytics Functions
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
            <div class="endpoint-stat-value" style="color: #06b6d4;">${Math.round(stats.avg_time)}ms</div>
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
  document.getElementById(`${sectionName}-section`).classList.add('active');
  
  // Add active to clicked nav item
  event.target.closest('.nav-item').classList.add('active');
  
  // Refresh analytics when switching to analytics section
  if (sectionName === 'analytics') {
    loadAnalytics();
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
    background: ${type === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)'};
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
  "7510455af381d5-d315-41e2-8e5e-e94cc0a960fe",
  "8112616278b36e4e-6996-4088-b66b-bf5d6787fe13",
  "81139487b3f2160f-acb8-41d6-9177-4bc69df0148a",
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
  loadAnalytics();
  loadCurrentIP();
  loadWhitelistStatus();
  loadIPList();
  loadAPIConfiguration();
  
  // Auto-refresh analytics every 30 seconds
  setInterval(loadAnalytics, 30000);
});
