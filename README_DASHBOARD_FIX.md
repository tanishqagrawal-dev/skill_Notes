# Dashboard Error Fix

**Issue:** "GlobalData is not defined"
**Cause:** Scope isolation. `GlobalData` was private to `dashboard.js`.
**Fix:** Expose it globally.

## Verification
Reload the dashboard. The error should be gone and the admin/co-admin panels should load their data correctly.
