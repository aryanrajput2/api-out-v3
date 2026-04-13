# Deployment Quick Start Guide

## 5-Minute Setup

### 1. Access Dashboard
- Go to your application
- Click **Dashboard** button (top right)
- Click **Deployment** in the sidebar

### 2. Check Current Environment
You'll see:
- **Current Environment**: Shows which environment is active (Test, Staging, or Admin)
- **URL**: The API endpoint being used
- **Status**: Active/Inactive

### 3. Make Changes in Test
1. Make all your changes in the test environment
2. Test thoroughly
3. Verify everything works

### 4. Create Release
1. Fill in the form:
   - **Version**: `v1.0.0` (or your version)
   - **From Environment**: `test`
   - **Changes**: Describe what changed
2. Click **Create Release**
3. Release appears in history with "Pending Approval" status

### 5. Approve Release
1. Review the release details
2. Click **Approve Release** button
3. Status changes to "Approved"

### 6. Switch to Admin
1. Use the **Switch Environment** dropdown
2. Select **Admin Environment**
3. Click **Switch**
4. Now using admin/production environment

## Common Tasks

### View Release History
- Scroll to **Release History** section
- See all releases with status and timestamps
- Click **Approve** on pending releases

### Change Environment URL
- Go to Dashboard → Deployment
- Update the URL in the environment configuration
- Changes take effect immediately

### Rollback to Previous Version
- Check release history
- Note the previous version number
- Create a new release reverting to that version
- Approve and deploy

## Environment URLs

| Environment | URL | Purpose |
|---|---|---|
| Test | `http://localhost:8000` | Local development |
| Staging | `https://staging-api.example.com` | Pre-production |
| Admin | `https://admin-api.example.com` | Production |

## Release Status

| Status | Meaning | Action |
|---|---|---|
| Pending Approval | Waiting for approval | Review and approve |
| Approved | Ready to deploy | Deploy to production |
| Deployed | Live in production | Monitor performance |

## Tips

✅ **Always test in test environment first**
✅ **Write clear change descriptions**
✅ **Get approval before production**
✅ **Keep version numbers consistent**
✅ **Document breaking changes**

❌ **Don't skip testing**
❌ **Don't deploy without approval**
❌ **Don't make changes directly in production**
❌ **Don't forget to update version numbers**

## Need Help?

See `DEPLOYMENT_WORKFLOW.md` for detailed documentation.
