# TODO: Auto-Detect System IP & Inject into Config

## Plan
- [x] Step 1: Update `src/components/Pages/ConfigScreen.tsx`
  - Import `getSystemIPv4` from `src/config.ts`
  - Auto-detect IP on mount and pre-fill `serverIP` + `dbHost`
  - Remove `required` validation from `serverIP`
  - Show detected IP info badge
- [x] Step 2: Update `src/config.ts`
  - In `loadConfig()`, auto-inject detected IP if saved config uses localhost/127.0.0.1
  - Re-export `getSystemIPv4`
- [x] Step 3: Update `main.cjs`
  - In `save-config` handler, if `serverIP` is blank/missing, auto-fill with `get-system-ipv4` result
  - In `load-config` handler, inject detected IP if saved IP is localhost/127.0.0.1
- [ ] Step 4: Test & verify (`npm run dev`)

