# Dashboard Update: Unified Experience

I have successfully updated the Admin and Co-Admin pages.

## Key Changes
- **Unified Design**: Admin and Co-Admin dashboards now include ALL standard user tools (Notes, Planner, AI Tools, Leaderboard).
- **Extra Powers**:
    - **Admin**: Gets 'Command Center' tab.
    - **Co-Admin**: Gets 'Moderation Hub' tab.
- **Codebase**: Reverted to using `dashboard.js` as the master script to ensure consistency. `admin-dashboard.js` is no longer the primary controller.

## How to Test
1.  Login as **Admin**: See standard tools + Command Center.
2.  Login as **Co-Admin**: See standard tools + Moderation Hub.
3.  Login as **User**: See standard tools only.
