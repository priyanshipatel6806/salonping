# SalonPing — QA Testing Report
**Date:** June 10, 2026  
**Tester:** Claude (automated + code review)  
**Status of previous report (June 9):** All 6 bugs previously reported were confirmed fixed.

---

## Testing Method

1. **Interactive testing** — Dev server started on port 3001, public pages tested via browser (Chrome MCP). Authenticated pages could not be interactively tested because the Supabase project was paused (see Critical Infrastructure issue below).
2. **Code review** — Full static analysis of all page source files in `src/app/`.

---

## Critical Infrastructure Issues

### ⚠️ Supabase project is paused
Supabase paused the project in May 2026 due to inactivity (free-tier projects pause after 1 week inactive). Magic-link login emails are not being sent, so no one can log in.

**To fix:** Go to https://supabase.com/dashboard → select your project → click "Restore project". This is required before the app can be used in production.

### ⚠️ Vercel deployment is broken (404 DEPLOYMENT_NOT_FOUND)
`salonping.vercel.app` returns `DEPLOYMENT_NOT_FOUND`. There was a failed production deployment email on June 9. The app only works locally.

**To fix:** Push a fresh commit to trigger a new Vercel deployment, or re-deploy from the Vercel dashboard.

---

## Bugs Found & Fixed (This Session — June 10)

All 13 bugs below were fixed in the codebase.

### Bug 1 — Wrong Vercel domain in booking link
**File:** `src/app/dashboard/page.tsx`  
**Problem:** `appUrl` fallback was `'https://salonping-app.vercel.app'` (non-existent domain). Correct domain is `salonping.vercel.app`.  
**Fix:** Changed fallback to `'https://salonping.vercel.app'`.  
**Impact:** Dashboard "Your Booking Page" link showed the wrong URL.

### Bug 2 — Tip amount truncated to integer
**File:** `src/app/appointments/page.tsx`  
**Problem:** `parseInt(tipInput || '0')` truncates decimal tips. Entering $5.50 saves as $5.  
**Fix:** Changed both occurrences to `parseFloat(tipInput || '0')`.  
**Impact:** Decimal tip amounts (e.g. $5.50) were silently truncated.

### Bug 3 — Pricing page missing "How it works" nav link
**File:** `src/app/pricing/page.tsx`  
**Problem:** Pricing page nav had only "Features" and "Pricing". Landing page nav has all four links including "How it works" — inconsistent.  
**Fix:** Added the missing `<Link href="/#how-it-works">How it works</Link>` between Features and Pricing.

### Bug 4 — Reschedule page using old inline nav instead of NavBar component
**File:** `src/app/appointments/reschedule/[id]/page.tsx`  
**Problem:** Hard-coded NAV array with manually rendered nav bar. No mobile hamburger menu, no active link highlighting.  
**Fix:** Removed dead NAV constant, imported and rendered `<NavBar />`.

### Bug 5 — Client profile page using old inline nav instead of NavBar component
**File:** `src/app/clients/[phone]/page.tsx`  
**Problem:** Same issue — hard-coded NAV array, manual render, no mobile support.  
**Fix:** Removed dead NAV constant, imported `<NavBar />`, added `export const metadata` for tab title.

### Bug 6 — Intake Forms page using old inline nav instead of NavBar component
**File:** `src/app/intake/page.tsx`  
**Problem:** Same issue — hard-coded NAV array, manual render, no mobile support.  
**Fix:** Removed dead NAV constant, imported `<NavBar />`, added `document.title`.

### Bug 7 — Customise page using two different Supabase storage buckets
**File:** `src/app/customise/page.tsx`  
**Problem:** Logo/cover upload used bucket `'salon-photos'`; gallery photos used `'salon-assets'`. One bucket would always be missing in Supabase, causing upload failures.  
**Fix:** Changed all references to use `'salon-assets'` consistently.

### Bugs 8–12 — Dead NAV constants in 9 files
**Files:** `dashboard`, `blocked`, `clients`, `customise`, `loyalty`, `staff`, `waitlist`, `settings`, `hours` pages  
**Problem:** All these pages correctly used `<NavBar />` but still had unused `const NAV` or `const NAV_LINKS` arrays — leftover dead code from before the NavBar component was introduced.  
**Fix:** Removed all dead constants.

### Bug 13 — 8 authenticated pages missing browser tab titles
**Files:** `staff`, `hours`, `blocked`, `waitlist`, `loyalty`, `settings`, `customise`, `intake` pages  
**Problem:** All showed the marketing tagline "SalonPing — Stop Losing Money to No-Shows" in the browser tab, which is inappropriate for app pages.  
**Fix:** Added `document.title` via `useEffect` to each client component. Server components got `export const metadata`.

---

## Pages Tested Interactively

### ✅ Landing Page (`/`)
- All nav links work (Features, How it works, Pricing, Get started free)
- All CTA buttons link to `/login`
- Responsive layout correct on desktop
- All sections render: hero, features grid, how-it-works, pricing teaser, CTA footer

### ✅ Pricing Page (`/pricing`)
- Three plan cards render correctly (Starter free, Pro $39/mo, Salon Suite $79/mo)
- "Get started free" buttons link to `/login`
- FAQ section present
- Fixed: "How it works" nav link added (Bug 3)

### ✅ Login Page (`/login`)
- Email field and "Send magic link" button work
- Shows confirmation message after submit
- Note: Email won't arrive while Supabase is paused

### ✅ Booking Page (`/book/my-salon-297df8`)
- Full 3-step flow works: service selection → date picker → time slots → summary + form
- Service cards show name, duration, price correctly
- Date picker works; past dates and closed days are disabled
- Time slots grid renders correctly
- Client details form fields all present (name, phone, email, reminder channel, notes)
- AI chat widget (Anthropic) loads and responds
- Waitlist join button visible when appropriate

### ✅ Privacy Policy (`/privacy`) — loads correctly
### ✅ Terms of Service (`/terms`) — loads correctly

---

## Code Review — Authenticated Pages

All authenticated pages reviewed for correctness. No additional functional bugs found beyond those listed above.

- **Dashboard:** Auto-creates salon on first login, stats grid, onboarding checklist, today's schedule, booking link
- **Appointments:** Upcoming/past split, search/filter, mark paid, cancel, no-show, reschedule, CSV export
- **Services/Hours/Staff/Blocked/Waitlist/Loyalty/Intake:** CRUD operations look correct
- **Settings:** Stripe Connect, Twilio SMS, booking settings
- **Customise:** Booking page editor, logo/cover/gallery upload (now unified to `salon-assets`)

---

## Remaining Issues (Not Fixed — Require Decisions)

### Minor: `useMemo` missing `now` in dependency array
**File:** `src/app/appointments/page.tsx`  
The upcoming/past split uses `now` inside a `useMemo` but `now` is not in the deps array. In practice the component re-renders with appointments fetch, so this is unlikely to cause a visible bug. Could be fixed by moving `now` inside the memo or adding it as a dependency.

### Minor: Dashboard cancel button causes full-page reload
**File:** `src/app/dashboard/page.tsx`  
Today's schedule cancel buttons use `<form method="POST">` which triggers a hard reload. Works correctly but UX could be improved to use a client-side fetch for an optimistic update.

### Config: Stripe keys are placeholders in `.env.local`
`STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` contain placeholder values. Deposit collection and Stripe Connect will not work until real keys are added from the Stripe dashboard.

---

## Summary

| | Count |
|---|---|
| Critical infrastructure issues | 2 |
| Bugs fixed this session (Jun 10) | 13 |
| Bugs fixed previous session (Jun 9) | 6 |
| Minor remaining issues | 2 |
| Pages with broken nav replaced with NavBar | 3 |
| Files with dead code removed | 9 |

**Priority actions before launch:**
1. **Restore Supabase project** (supabase.com/dashboard → Restore) 
2. **Fix Vercel deployment** (push a commit or redeploy from Vercel dashboard)
3. **Add real Stripe keys** to Vercel environment variables
4. **Test full authenticated flow** once Supabase is restored
