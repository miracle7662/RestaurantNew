# Task: Convert Horizontal Tabs to Vertical Tabs

## Current State
- Tabs are horizontal (top tabs) in the ItemModal component
- Using React-Bootstrap `<Tabs>` component with `defaultActiveKey="multiplePrice"`

## Target State
- Tabs navigation on the left side (vertical)
- Tab content on the right side
- Using flex layout so content gets full width

## Implementation Plan

### Step 1: Modify Tabs to Vertical Layout
- Replace `<Tabs>` with a flex container using `<div className="d-flex">`
- Use `<Nav variant="pills" className="flex-column">` for vertical tabs on the left
- Use `<Tab.Content>` and `<Tab.Pane>` for content on the right
- Keep existing tab names: "Multiple Price" and "Stock"

### Step 2: Keep Existing Logic Intact
- Do not modify any logic inside tab content
- Keep all form fields, tables, and functionality unchanged

### Step 3: Apply Styling
- Add appropriate styles for vertical tabs layout
- Ensure responsive behavior

## Files to Edit
- `src/views/apps/Masters/RestaurantMasters/Menu.tsx` - Modify the Tabs section in ItemModal

## Status
- [ ] Read and understand the existing Tabs implementation
- [ ] Implement vertical tabs with flex layout
- [ ] Test that all existing functionality remains intact

