# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a **Restaurant Management System** built with React + TypeScript frontend and Node.js/Express backend. It handles restaurant operations including table management, KOT (Kitchen Order Ticket) creation, billing, and inventory management. The system supports multiple outlets, departments, and comprehensive restaurant workflow management.

## Technology Stack

- **Frontend**: React 18 + TypeScript, Vite, Bootstrap 5, React Router
- **Backend**: Node.js, Express.js, better-sqlite3 database
- **Desktop**: Electron wrapper for desktop application
- **State Management**: React Context API
- **Authentication**: JWT-based authentication
- **UI Components**: React Bootstrap, custom components

## Development Commands

### Frontend Development
```bash
# Start development server with hot reload on all network interfaces
npm run dev

# Build for production
npm run build

# Run linting with auto-fix
npm run lint

# Format code with Prettier
npm run format

# Preview production build
npm run preview
```

### Backend Development
```bash
# Start backend server (runs on port 3001)
npm run backend

# Start both frontend and backend concurrently
npm run dev:full
```

### Desktop Application
```bash
# Start Electron app
npm run electron-start

# Development mode with both Vite and Electron
npm run dev-electron

# Build and start Electron app
npm run build-electron
```

### Testing
```bash
# Test various functionalities (run individual test files)
node testLogin.js
node test_fetchOutletUsers.js
node test_hotel_admin_creation.js
node test_outlet_crud.js
node test_outlet_user.js
node test_outlet_user_crud.js
node test_quantity_aggregation.js
node test_reverse_kot.js
node test_revqty_functionality.js

# Check database and users
node check_db.js
node checkUsers.js
```

### Single Test Execution
To run a specific test for a feature:
```bash
# Test KOT/Re-KOT functionality
node test_reverse_kot.js

# Test quantity fixes
node test_revqty_functionality.js

# Test user authentication
node testLogin.js
```

## Architecture Overview

### Database Layer (SQLite)
The system uses SQLite with better-sqlite3 for local data persistence:
- **Master Tables**: Countries, States, Cities, Hotels, Outlets, Users, Items
- **Transaction Tables**: `TAxnTrnbill` (main transactions), `TAxnTrnbilldetails` (transaction line items)
- **Management Tables**: Table assignments, customer data, tax configurations

### Backend Architecture (`backend/`)
RESTful API server with modular route structure:
- **Routes**: Each entity has dedicated routes (e.g., `TAxnTrnbillRoutes.js`, `outletRoutes.js`)
- **Controllers**: Business logic handlers (e.g., `TAxnTrnbillControllers.js`)
- **Configuration**: Database setup in `config/db.js`

Key API Endpoints:
- `/api/TAxnTrnbill/*` - Transaction and billing operations
- `/api/outlets/*` - Outlet management
- `/api/auth/*` - Authentication
- `/api/tablemanagement/*` - Table operations

### Frontend Architecture (`src/`)
Component-based React architecture:
- **Views**: Main application screens in `views/apps/Transaction/`
- **Components**: Reusable components in `components/Apps/Transaction/`
- **Context**: Authentication and theme providers in `common/context/`
- **API Layer**: Centralized API calls in `common/api/`

### Core Business Logic

#### KOT (Kitchen Order Ticket) System
- **Normal KOT**: Creates positive quantity records in database
- **Re-KOT (Reverse)**: Creates negative quantity records for order modifications
- **Net Calculation**: System automatically calculates net quantities (KOT qty + Re-KOT qty)
- **Frontend Display**: Shows only positive quantities to users while maintaining accurate backend calculations

#### Bill Management Critical Logic
**IMPORTANT**: When printing bills, immediately update the backend record:
```sql
UPDATE TAxnTrnbill 
SET isBilled = 1, BilledDate = CURRENT_TIMESTAMP 
WHERE TxnID = ?;
```
- `isBilled = 1` means bill already printed
- This prevents duplicate billing and maintains transaction integrity

#### Transaction Flow
1. **Table Selection**: User selects table → Fetches unbilled items
2. **Order Management**: Add/modify items → Creates new transaction records
3. **KOT Generation**: Print KOT → Saves to database with positive quantities
4. **Re-KOT (if needed)**: Modify orders → Creates negative quantity records
5. **Billing**: Generate final bill → Updates `isBilled = 1` in database

### Key Features

#### Reverse Quantity Mode
- **F8 Key Toggle**: Activates reverse quantity mode
- **Authentication**: Configurable (NoPassword/PasswordRequired)
- **Functionality**: Click items to decrease quantity by 1

#### Focus Mode
- Enhances UI focus for order management
- Controlled via state in `Orders.tsx`

#### Multi-Language Support
- KOT printing supports bilingual output (English/Hindi)
- Configurable through KOT settings

## File Structure Highlights

### Critical Files
- `src/views/apps/Transaction/Orders.tsx` - Main order management component
- `backend/controllers/TAxnTrnbillControllers.js` - Core transaction logic
- `backend/server.js` - Express server configuration
- `src/config.ts` - Frontend API configuration

### Configuration Files
- `package.json` - Dependencies and scripts
- `vite.config.ts` - Vite bundler configuration  
- `tsconfig.json` - TypeScript configuration
- `.eslintrc.cjs` - ESLint rules

## Recent Fixes & Implementation Status

### KOT/Re-KOT Implementation ✅
- Frontend only displays positive quantities in billing interface
- Database correctly stores all KOT (positive) and Re-KOT (negative) records
- Automatic net quantity calculation when tables are accessed
- Complete audit trail maintained for all operations

### RevQty Fix ✅
- Fixed RevQty field showing "U" values instead of numeric values
- Improved minus button logic for items with/without transaction info
- Enhanced backend query grouping and null handling
- Added debugging tools and test endpoints

### TODO Items
- Implement F8 key handling for Reverse Qty Mode toggle
- Add password authentication for reverse mode
- Complete quantity decrease functionality testing

## Development Guidelines

### Database Operations
- Always use parameterized queries to prevent SQL injection
- Maintain referential integrity between `TAxnTrnbill` and `TAxnTrnbilldetails`
- Use transactions for multi-table operations

### Frontend State Management
- Use React Context for global state (auth, theme)
- Local component state for UI-specific data
- Proper cleanup of event listeners and timers

### Testing Strategy
- Individual test files for specific features
- Database integrity verification
- Transaction flow validation
- UI component functionality

### API Integration
- Centralized API configuration in `src/config.ts`
- Error handling with user-friendly toast messages
- Loading states for better UX

## Common Patterns

### Adding New Features
1. Create backend route in `backend/routes/`
2. Implement controller logic in `backend/controllers/`
3. Add frontend API function in `src/common/api/`
4. Create/update React components
5. Add test file for verification

### Database Queries
- Use `COALESCE()` for handling NULL values
- Implement proper GROUP BY clauses for aggregations
- Include debugging console.log statements during development

### Error Handling
- Backend: Return structured responses with success/error flags
- Frontend: Display user-friendly error messages via toast notifications
- Log detailed errors to console for debugging