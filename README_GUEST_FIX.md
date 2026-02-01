# Guest Login Fix

**Issue:** Dashboard blank / tools not working for Guest.
**Cause:** Firebase event loop bypassed guest check.
**Fix:** Added explicit fallback to Guest dispatch in `auth.js`.

## Verification
1.  Click "Continue as Guest".
2.  Dashboard should load.
3.  Tools (Notes, Planner) should be clickable.
