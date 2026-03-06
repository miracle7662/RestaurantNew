# TODO: Redesign Item Modal for Modern POS UI

## Task
Redesign the Add Item / Edit Item modal in Menu.tsx to look like a modern SaaS dashboard (Petpooja POS style)

## Plan Steps

### 1. Update Modal Component Structure
- [x] Analyze existing code and understand current implementation
- [ ] Redesign Modal with XL size, centered, rounded corners
- [ ] Create gradient header (blue/indigo) with white text

### 2. Create Card-Based Layout Sections
- [ ] Section 1: Basic Information Card
  - Item Number
  - Outlet dropdown
  - Hotel / Brand dropdown
  
- [ ] Section 2: Item Details Card
  - Item Name
  - Print Name
  - Short Name
  - Description
  - HSN Code
  - Base Price

- [ ] Section 3: Pricing Details Card (with Tabs)
  - Tab 1: Multiple Price (Department Name, Rate, Tax Group)
  - Tab 2: Stock (Opening Stock, Stock Unit)

- [ ] Section 4: Status Card
  - Active / Inactive dropdown

### 3. Style Improvements
- [ ] Use Bootstrap 5 cards with shadow-sm
- [ ] Rounded inputs (rounded-lg)
- [ ] Good spacing between elements
- [ ] Clean modern layout

### 4. Footer Buttons
- [ ] Cancel (light button)
- [ ] Save Item (green button)

### 5. Preserve Existing Logic
- [ ] Keep all state variables unchanged
- [ ] Keep all form handlers unchanged
- [ ] Keep API calls and data handling

## Implementation
- Edit: src/views/apps/Masters/RestaurantMasters/Menu.tsx
- Replace the ItemModal component's return statement (JSX)

