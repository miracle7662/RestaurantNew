# Network Accessibility Setup for RestaurantNew Project

## Goal
Make the full-stack app (backend:3001, frontend:5173) accessible over local network (LAN) from other devices.

## Steps
- [x] **1. Code Updates** ✅ (completed by AI)
  - ✅ Update `backend/server.js`: Bind server to `0.0.0.0:3001`
  - ✅ Update `vite.config.ts`: Add `server.host: true`

- [ ] **2. Start Backend**
  
```
  cd backend
  npm install  # if needed
  npm start    # or node server.js
  
```
  Should log: Server running at http://0.0.0.0:3001

- [ ] **3. Start Frontend**
  
```
  cd ..  # back to root
  npm install  # if needed
  npm run dev -- --host
  
```
  Should log network URL like http://192.168.x.x:5173

- [ ] **4. Find Your Local IP**
  
```
  ipconfig
  
```
  Look for "IPv4 Address" under Wi-Fi/Ethernet (e.g., 192.168.1.100)

- [ ] **5. Test Access**
  - Backend: http://[YOUR-IP]:3001/api/health → {"status":"OK"}
  - Frontend: http://[YOUR-IP]:5173 → App loads
  - From another device on same network

## Notes
- Firewall may block ports 3001/5173 → Allow Node.js/Vite
- Proxy /api will work as backend is now network-accessible
- Production: Use nginx/PM2, but this is for dev network access

Progress will be marked as we go.
