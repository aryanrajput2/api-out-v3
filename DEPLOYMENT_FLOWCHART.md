# Deployment System - Complete Flowcharts

## 1. User Creates Release - Complete Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ USER CREATES RELEASE                                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND (Dashboard)                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User fills form:                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Version:        [v1.0.1]                                │   │
│  │ From Env:       [test ▼]                                │   │
│  │ Changes:        [Fixed bug in search]                   │   │
│  │                 [Create Release →]                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  JavaScript function: createRelease()                          │
│  ├─ Get form values                                            │
│  ├─ Validate inputs                                            │
│  └─ Send POST request                                          │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ POST /api/deployment/create-release
                         │ {
                         │   "version": "v1.0.1",
                         │   "changes": "Fixed bug in search",
                         │   "from_environment": "test",
                         │   "to_environment": "admin"
                         │ }
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND (API)                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Endpoint: POST /api/deployment/create-release                 │
│  ├─ Receive request                                            │
│  ├─ Extract data                                               │
│  └─ Call DeploymentManager.create_release()                    │
│                                                                 │
│  DeploymentManager.create_release():                           │
│  ├─ Generate unique ID: "release-20260409-193000"              │
│  ├─ Create release object:                                     │
│  │  {                                                          │
│  │    "id": "release-20260409-193000",                         │
│  │    "version": "v1.0.1",                                     │
│  │    "timestamp": "2026-04-09T19:30:00.123456",               │
│  │    "from_environment": "test",                              │
│  │    "to_environment": "admin",                               │
│  │    "changes": "Fixed bug in search",                        │
│  │    "status": "pending_approval",                            │
│  │    "approved_by": null,                                     │
│  │    "approved_at": null                                      │
│  │  }                                                          │
│  ├─ Load releases_history.json                                 │
│  ├─ Append new release                                         │
│  └─ Save to releases_history.json                              │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Return JSON response
                         │ {
                         │   "ok": true,
                         │   "release": { ... }
                         │ }
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ STORAGE (File System)                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  releases_history.json updated:                                │
│  [                                                              │
│    {                                                            │
│      "id": "release-20260409-193000",                           │
│      "version": "v1.0.1",                                       │
│      "status": "pending_approval",                              │
│      ...                                                        │
│    },                                                           │
│    { ... previous releases ... }                                │
│  ]                                                              │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Response received
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND (Dashboard)                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  JavaScript function: createRelease() continues                │
│  ├─ Show success message                                       │
│  ├─ Clear form                                                 │
│  ├─ Call loadReleases()                                        │
│  └─ Update Release History display                             │
│                                                                 │
│  Release History now shows:                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ v1.0.1 → admin          [PENDING APPROVAL]              │   │
│  │ test → admin                                            │   │
│  │ Fixed bug in search                                     │   │
│  │ 2026-04-09 19:30:00                                     │   │
│  │                                                         │   │
│  │ [Approve Release]                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. User Approves Release - Complete Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ USER APPROVES RELEASE                                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND (Dashboard)                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Release History shows:                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ v1.0.1 → admin          [PENDING APPROVAL]              │   │
│  │ test → admin                                            │   │
│  │ Fixed bug in search                                     │   │
│  │ 2026-04-09 19:30:00                                     │   │
│  │                                                         │   │
│  │ [Approve Release] ← User clicks here                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  JavaScript function: approveRelease(releaseId)                │
│  ├─ Get release ID                                            │
│  └─ Send POST request                                         │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ POST /api/deployment/approve-release
                         │ {
                         │   "release_id": "release-20260409-193000",
                         │   "approved_by": "admin"
                         │ }
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND (API)                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Endpoint: POST /api/deployment/approve-release                │
│  ├─ Receive request                                            │
│  ├─ Extract release_id and approved_by                         │
│  └─ Call DeploymentManager.approve_release()                   │
│                                                                 │
│  DeploymentManager.approve_release():                          │
│  ├─ Load releases_history.json                                 │
│  ├─ Find release with matching ID                              │
│  ├─ Check if status is "pending_approval"                      │
│  ├─ Update release:                                            │
│  │  {                                                          │
│  │    "id": "release-20260409-193000",                         │
│  │    "version": "v1.0.1",                                     │
│  │    "status": "approved",  ← Changed from pending            │
│  │    "approved_by": "admin",  ← Added                         │
│  │    "approved_at": "2026-04-09T19:30:15.654321"  ← Added     │
│  │    ...                                                      │
│  │  }                                                          │
│  ├─ Save updated releases_history.json                         │
│  └─ Return updated release                                     │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Return JSON response
                         │ {
                         │   "ok": true,
                         │   "message": "Release approved",
                         │   "release": { ... }
                         │ }
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ STORAGE (File System)                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  releases_history.json updated:                                │
│  [                                                              │
│    {                                                            │
│      "id": "release-20260409-193000",                           │
│      "version": "v1.0.1",                                       │
│      "status": "approved",  ← Updated                           │
│      "approved_by": "admin",  ← Added                           │
│      "approved_at": "2026-04-09T19:30:15.654321"  ← Added       │
│      ...                                                        │
│    },                                                           │
│    { ... other releases ... }                                   │
│  ]                                                              │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Response received
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND (Dashboard)                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  JavaScript function: approveRelease() continues               │
│  ├─ Show success message                                       │
│  ├─ Call loadReleases()                                        │
│  └─ Update Release History display                             │
│                                                                 │
│  Release History now shows:                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ v1.0.1 → admin          [APPROVED]                      │   │
│  │ test → admin                                            │   │
│  │ Fixed bug in search                                     │   │
│  │ Approved by: admin at 19:30:15                          │   │
│  │ 2026-04-09 19:30:00                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  No more "Approve Release" button (already approved)            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. User Switches Environment - Complete Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ USER SWITCHES ENVIRONMENT                                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND (Dashboard)                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Current Environment shows:                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Environment: Test Environment                           │   │
│  │ URL: http://localhost:8000                              │   │
│  │ Status: Active                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Switch Environment section:                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Select Environment: [Admin Environment ▼]               │   │
│  │                     [Switch →]                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  User selects "Admin Environment" from dropdown                │
│  User clicks "Switch" button                                   │
│                                                                 │
│  JavaScript function: switchEnvironment()                      │
│  ├─ Get selected environment from dropdown                     │
│  ├─ Validate selection                                        │
│  └─ Send POST request                                         │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ POST /api/deployment/switch-environment
                         │ {
                         │   "environment": "admin"
                         │ }
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND (API)                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Endpoint: POST /api/deployment/switch-environment             │
│  ├─ Receive request                                            │
│  ├─ Extract environment name                                   │
│  └─ Call DeploymentManager.switch_environment()                │
│                                                                 │
│  DeploymentManager.switch_environment():                       │
│  ├─ Validate environment exists                                │
│  ├─ Load deployment_config.json                                │
│  ├─ Update current_environment:                                │
│  │  {                                                          │
│  │    "environments": { ... },                                 │
│  │    "current_environment": "admin",  ← Changed from test     │
│  │    "last_updated": "2026-04-09T19:30:30.123456"  ← Updated  │
│  │    ...                                                      │
│  │  }                                                          │
│  ├─ Save updated deployment_config.json                        │
│  └─ Return confirmation                                        │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Return JSON response
                         │ {
                         │   "ok": true,
                         │   "message": "Switched from test to admin",
                         │   "current_environment": "admin",
                         │   "environment_details": { ... }
                         │ }
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ STORAGE (File System)                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  deployment_config.json updated:                               │
│  {                                                              │
│    "environments": { ... },                                    │
│    "current_environment": "admin",  ← Changed                  │
│    "last_updated": "2026-04-09T19:30:30.123456",  ← Updated    │
│    ...                                                          │
│  }                                                              │
│                                                                 │
│  All future API calls will use:                                │
│  URL: https://admin-api.example.com                            │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Response received
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND (Dashboard)                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  JavaScript function: switchEnvironment() continues            │
│  ├─ Show success message                                       │
│  ├─ Call loadDeploymentStatus()                                │
│  └─ Update Current Environment display                         │
│                                                                 │
│  Current Environment now shows:                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Environment: Admin Environment                          │   │
│  │ URL: https://admin-api.example.com                      │   │
│  │ Status: Active                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  All future API calls use admin URL                            │
│  Release v1.0.1 is now live! ✓                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Complete Release Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│ RELEASE LIFECYCLE                                               │
└─────────────────────────────────────────────────────────────────┘

STAGE 1: CREATION
┌─────────────────────────────────────────────────────────────────┐
│ User creates release                                            │
│ ├─ Version: v1.0.1                                              │
│ ├─ Changes: "Fixed bug in search"                               │
│ └─ Status: pending_approval                                     │
│                                                                 │
│ Release stored in releases_history.json                         │
│ ID: release-20260409-193000                                     │
│ Created: 2026-04-09T19:30:00                                    │
└─────────────────────────────────────────────────────────────────┘
                         ↓
STAGE 2: REVIEW
┌─────────────────────────────────────────────────────────────────┐
│ Admin reviews release                                           │
│ ├─ Checks version number                                        │
│ ├─ Reads changes description                                    │
│ ├─ Verifies test environment                                    │
│ └─ Decides to approve                                           │
│                                                                 │
│ Release status: pending_approval                                │
│ Waiting for approval                                            │
└─────────────────────────────────────────────────────────────────┘
                         ↓
STAGE 3: APPROVAL
┌─────────────────────────────────────────────────────────────────┐
│ Admin approves release                                          │
│ ├─ Clicks "Approve Release"                                     │
│ ├─ Status updated to: approved                                  │
│ ├─ Recorded: approved_by = "admin"                              │
│ └─ Recorded: approved_at = 2026-04-09T19:30:15                  │
│                                                                 │
│ Release stored in releases_history.json                         │
│ Status: approved                                                │
│ Approved by: admin                                              │
│ Approved at: 2026-04-09T19:30:15                                │
└─────────────────────────────────────────────────────────────────┘
                         ↓
STAGE 4: DEPLOYMENT
┌─────────────────────────────────────────────────────────────────┐
│ Admin switches to admin environment                             │
│ ├─ Selects "Admin Environment"                                  │
│ ├─ Clicks "Switch"                                              │
│ ├─ Current environment: admin                                   │
│ └─ All API calls use admin URL                                  │
│                                                                 │
│ Release v1.0.1 goes live                                        │
│ All users see new version                                       │
│ Status: deployed                                                │
└─────────────────────────────────────────────────────────────────┘
                         ↓
STAGE 5: MONITORING
┌─────────────────────────────────────────────────────────────────┐
│ Monitor deployment                                              │
│ ├─ Check for errors                                             │
│ ├─ Monitor performance                                          │
│ ├─ Verify users can access                                      │
│ └─ Success! ✓                                                   │
│                                                                 │
│ Release status: deployed                                        │
│ Live in production                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ COMPLETE DATA FLOW                                              │
└─────────────────────────────────────────────────────────────────┘

USER INTERFACE (Dashboard)
    │
    ├─ Create Release Form
    │  └─ Version, Changes, Environment
    │
    ├─ Approve Release Button
    │  └─ Release ID
    │
    └─ Switch Environment Dropdown
       └─ Environment Name
           │
           ▼
    JAVASCRIPT FUNCTIONS
    │
    ├─ createRelease()
    │  └─ POST /api/deployment/create-release
    │
    ├─ approveRelease()
    │  └─ POST /api/deployment/approve-release
    │
    └─ switchEnvironment()
       └─ POST /api/deployment/switch-environment
           │
           ▼
    API ENDPOINTS (FastAPI)
    │
    ├─ POST /api/deployment/create-release
    │  └─ DeploymentManager.create_release()
    │
    ├─ POST /api/deployment/approve-release
    │  └─ DeploymentManager.approve_release()
    │
    └─ POST /api/deployment/switch-environment
       └─ DeploymentManager.switch_environment()
           │
           ▼
    DEPLOYMENT MANAGER (Python)
    │
    ├─ create_release()
    │  ├─ Generate ID
    │  ├─ Create object
    │  └─ Save to file
    │
    ├─ approve_release()
    │  ├─ Find release
    │  ├─ Update status
    │  └─ Save to file
    │
    └─ switch_environment()
       ├─ Validate environment
       ├─ Update config
       └─ Save to file
           │
           ▼
    FILE STORAGE (JSON)
    │
    ├─ deployment_config.json
    │  ├─ Environments
    │  ├─ Current environment
    │  └─ Configuration
    │
    └─ releases_history.json
       ├─ All releases
       ├─ Status
       └─ Approval info
           │
           ▼
    RESPONSE BACK TO FRONTEND
    │
    ├─ Success/Error message
    ├─ Updated data
    └─ Refresh display
```

---

## 6. State Transitions

```
┌─────────────────────────────────────────────────────────────────┐
│ RELEASE STATE TRANSITIONS                                       │
└─────────────────────────────────────────────────────────────────┘

                    ┌──────────────────┐
                    │ Release Created  │
                    │ (pending_approval)
                    └────────┬─────────┘
                             │
                    User clicks Approve
                             │
                             ▼
                    ┌──────────────────┐
                    │ Release Approved │
                    │ (approved)       │
                    └────────┬─────────┘
                             │
                    User switches environment
                             │
                             ▼
                    ┌──────────────────┐
                    │ Release Deployed │
                    │ (deployed)       │
                    └──────────────────┘

ENVIRONMENT STATE TRANSITIONS

                    ┌──────────────────┐
                    │ Test Environment │
                    │ (active)         │
                    └────────┬─────────┘
                             │
                    User clicks Switch
                             │
                             ▼
                    ┌──────────────────┐
                    │ Admin Environment│
                    │ (active)         │
                    └──────────────────┘
```

---

## 7. Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ ERROR HANDLING                                                  │
└─────────────────────────────────────────────────────────────────┘

USER ACTION
    │
    ▼
VALIDATION
    │
    ├─ Valid? → Continue
    │
    └─ Invalid? → Show Error
       ├─ Missing fields
       ├─ Invalid environment
       └─ Invalid release ID
           │
           ▼
       FRONTEND ERROR DISPLAY
       ├─ Alert message
       ├─ Highlight field
       └─ User can retry

API REQUEST
    │
    ▼
BACKEND PROCESSING
    │
    ├─ Success? → Return data
    │
    └─ Error? → Return error
       ├─ File not found
       ├─ Release not found
       ├─ Invalid status
       └─ Permission denied
           │
           ▼
       FRONTEND ERROR DISPLAY
       ├─ Show error message
       ├─ Log to console
       └─ User can retry
```

---

## Summary

The deployment system works through:

1. **User Interface** - Dashboard forms and buttons
2. **JavaScript Functions** - Handle user actions
3. **API Endpoints** - Process requests
4. **Deployment Manager** - Business logic
5. **File Storage** - Persist data
6. **Response** - Update frontend

All connected through HTTP requests and JSON data!

