# Deployment & Environment Management Workflow

## Overview
This system allows you to manage multiple environments (Test, Staging, Admin/Production) and create controlled releases from test to production.

## Workflow: Test → Admin Release

### Step 1: Make Changes in Test Environment
1. All changes are made and tested in the **Test Environment** (local development)
2. Test thoroughly with real data and scenarios
3. Verify all features work as expected

### Step 2: Create a Release
1. Go to **Dashboard** → **Deployment**
2. Fill in the release details:
   - **Version**: e.g., `v1.2.3` (semantic versioning)
   - **From Environment**: Select `test`
   - **Changes Description**: Document what changed
     - New features added
     - Bugs fixed
     - Performance improvements
     - Breaking changes (if any)
3. Click **Create Release**
4. Release is created with status: **Pending Approval**

### Step 3: Review & Approve Release
1. Release appears in **Release History**
2. Review the changes and version
3. Click **Approve Release** button
4. Release status changes to **Approved**

### Step 4: Deploy to Admin/Production
1. Once approved, the release is ready for deployment
2. Switch environment to **Admin** using the environment switcher
3. Deploy the approved release

## Environments

### Test Environment
- **URL**: `http://localhost:8000`
- **Purpose**: Local development and testing
- **Data**: Test data only
- **Access**: Unrestricted

### Staging Environment
- **URL**: `https://staging-api.example.com`
- **Purpose**: Pre-production testing
- **Data**: Production-like data
- **Access**: Limited to team

### Admin/Production Environment
- **URL**: `https://admin-api.example.com`
- **Purpose**: Live production
- **Data**: Real customer data
- **Access**: Restricted to admins

## API Endpoints

### Get Deployment Status
```bash
GET /api/deployment/status
```
Returns current environment and deployment configuration.

### Get All Environments
```bash
GET /api/deployment/environments
```
Returns list of all available environments.

### Switch Environment
```bash
POST /api/deployment/switch-environment
Content-Type: application/json

{
  "environment": "admin"
}
```

### Update Environment URL
```bash
POST /api/deployment/update-url
Content-Type: application/json

{
  "environment": "admin",
  "url": "https://new-admin-url.com"
}
```

### Create Release
```bash
POST /api/deployment/create-release
Content-Type: application/json

{
  "version": "v1.2.3",
  "changes": "Fixed bug in search, added new filter",
  "from_environment": "test",
  "to_environment": "admin"
}
```

### Approve Release
```bash
POST /api/deployment/approve-release
Content-Type: application/json

{
  "release_id": "release-20260409-120000",
  "approved_by": "admin"
}
```

### Get Release History
```bash
GET /api/deployment/releases?limit=10
```
Returns recent releases.

## Configuration Files

### deployment_config.json
Stores environment configuration and current active environment.

```json
{
  "environments": {
    "test": {
      "name": "Test Environment",
      "url": "http://localhost:8000",
      "status": "active",
      "description": "Local testing environment"
    },
    "admin": {
      "name": "Admin Environment",
      "url": "https://admin-api.example.com",
      "status": "inactive",
      "description": "Admin/Production environment"
    }
  },
  "current_environment": "test",
  "release_approval_required": true,
  "auto_backup": true,
  "last_updated": "2026-04-09T12:00:00"
}
```

### releases_history.json
Stores all releases with their status and approval information.

```json
[
  {
    "id": "release-20260409-120000",
    "version": "v1.2.3",
    "timestamp": "2026-04-09T12:00:00",
    "from_environment": "test",
    "to_environment": "admin",
    "changes": "Fixed bug in search, added new filter",
    "status": "approved",
    "approved_by": "admin",
    "approved_at": "2026-04-09T12:05:00"
  }
]
```

## Best Practices

### 1. Version Numbering
Use semantic versioning:
- **Major.Minor.Patch** (e.g., v1.2.3)
- Increment major for breaking changes
- Increment minor for new features
- Increment patch for bug fixes

### 2. Release Notes
Always include detailed change descriptions:
- What was changed
- Why it was changed
- Any breaking changes
- Migration steps (if needed)

### 3. Testing Before Release
- Test all features in test environment
- Test with different user roles
- Test edge cases and error scenarios
- Verify performance

### 4. Approval Process
- Always require approval before production
- Have at least 2 people review changes
- Document who approved and when
- Keep audit trail of all releases

### 5. Rollback Plan
- Keep previous version available
- Document rollback procedure
- Test rollback process
- Have quick rollback capability

## Dashboard Usage

### Deployment Section
1. **Current Environment Status**: Shows active environment and URL
2. **Switch Environment**: Change between test, staging, and admin
3. **Create Release**: Create new release from test to admin
4. **Release History**: View all releases and their status

### Quick Actions
- **Refresh**: Update deployment status
- **Switch**: Change active environment
- **Create Release**: Create new release
- **Approve**: Approve pending releases

## Troubleshooting

### Release Not Appearing
- Check if release was created successfully
- Verify environment names are correct
- Check releases_history.json file

### Cannot Switch Environment
- Verify environment exists in configuration
- Check environment URL is valid
- Ensure no active requests are running

### Approval Not Working
- Verify release_approval_required is true
- Check release status is "pending_approval"
- Ensure release_id is correct

## Future Enhancements

- [ ] Automated testing before release
- [ ] Slack/Email notifications for releases
- [ ] Automatic rollback on errors
- [ ] Release scheduling
- [ ] Multi-environment deployment
- [ ] Database migration tracking
- [ ] Performance comparison between versions
- [ ] A/B testing support
