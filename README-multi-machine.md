# Restaurant POS Multi-Machine Setup Guide 🌐

## 🎯 Overview
**1 Server** (DB + API) + **Multiple Clients** (Electron POS)

## 🖥️Prhase 1: Seevre Sqeup

### 1. Install MySQL/MariaDB
```
# Windows: Download XAMPP → Start MySQL
# Ubuntu: sudo apt install mariadb-server
```

### 2. Create DB User
```sql
mysql -u root
source backend/db/setup-remote-user.sql
```

### 3. Configure Server
```
cd RestaurantNew
copy .env.example backend/.env
# Edit backend/.env → DB_HOST=localhost DB_USER=pos_user etc.
cd backend
npm install
npm start
```

**Test:** `http://LAN-IP:3001/api/config/server-info`

### 4. Windows Service (Optional)
```
cd backend
scripts/install-service.bat
```

## 💻 Phase 2: Client Setup (Any Machine)

### Install Client
```
cd RestaurantNew
npm run build:client
npm run build:win  # Creates Miracle POS Client.exe
```

### First Run
1. **Config Screen** appears automatically
2. **Auto-detect** or enter `Server LAN IP:3001`  
3. **Test Connection** → Green ✅
4. **Save & Continue**

**Clients now connect to central server!** Multiple counters = real-time sync.

## 🔧 Usage

```
Server: npm run dev:full  (dev)
Client: npm run dev-electron (single) or install .exe (multi)
```

## 📱 NetworkConfig Screen
```
Server Host/IP: 192.168.1.100
Port: 3001
[TEST] → [SAVE]
```

## 🛠️ Build Production

```
npm run build:full  # Server + Client installers
```

## ✅ Features Complete
- ✅ Real-time multi-client sync
- ✅ Configurable server IP/port  
- ✅ Auto-detect on LAN
- ✅ Connection testing
- ✅ Offline config persistence

**Ready for restaurant deployment! 🚀**

