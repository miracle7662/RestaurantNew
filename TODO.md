# TODO: Fix 404 Error on PUT /api/tablemanagement/:id/status

## Problem
The PUT request to `/api/tablemanagement/90/status` returns 404 (Not Found).

## Root Cause
In `backend/routes/TableManagementRoutes.js`, the route `router.put("/:tableid", ...)` is defined BEFORE `router.put("/:tableid/status", ...)`. 

Express.js matches routes in order, so the first matching route wins. When requesting `/api/tablemanagement/90/status`:
1. It matches `router.put("/:tableid", ...)` because `:tableid` matches "90" 
2. The "status" part is ignored and the more specific `/status` route never gets matched

## Solution
Reorder the routes in TableManagementRoutes.js to put the more specific route (`/:tableid/status`) BEFORE the generic route (`/:tableid`).

## Tasks
- [x] Analyze the error and identify root cause
- [ ] Edit backend/routes/TableManagementRoutes.js to fix route order
