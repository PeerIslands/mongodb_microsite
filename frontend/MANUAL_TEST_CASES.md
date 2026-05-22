# Frontend manual test cases

Use these to verify login, signup, and Azure AD SSO in the browser.  
Prerequisites: backend running, `VITE_API_BASE_URL` reachable from the browser, and for SSO: `VITE_AZURE_CLIENT_ID`, `VITE_AZURE_TENANT_ID` set (and matching backend `AZURE_*`).

---

## Environment checks

| Check | How |
|--------|-----|
| API reachable | DevTools → Network: requests go to your `VITE_API_BASE_URL` and return 200/4xx (not blocked/CORS). |
| CORS | Backend `BACKEND_CORS_ORIGINS` includes your frontend origin (e.g. `http://localhost:5173`). |
| SSO visible | With both `VITE_AZURE_*` set, **Login** shows **Sign in with Microsoft** on the first screen. |
| SSO hidden | Remove tenant or client id → rebuild/restart dev server → Microsoft entry should not appear. |

---

## Login — internal (Peer Islands / Microsoft)

| ID | Steps | Expected |
|----|--------|----------|
| L-INT-1 | Open site → **Login** | Default view: Microsoft button + short copy for Peer Islands; **no** email/password until you choose external. |
| L-INT-2 | Click **Sign in with Microsoft** | Microsoft popup; sign in with a work account whose email ends with `@peerislands.io`. |
| L-INT-3 | After successful sign-in | Toast success, modal closes, page reloads, header shows logged-in state. |
| L-INT-4 | First-time user (no DB row) | Same flow; account is created server-side (JIT); then same as L-INT-3. |
| L-INT-5 | **Back** from login modal and reopen | SSO-first view again (not stuck on external form). |

---

## Login — external (email + password)

| ID | Steps | Expected |
|----|--------|----------|
| L-EXT-1 | **Login** → **External user? Sign in with email and password** | Email + password form appears; hint that external accounts use this path. |
| L-EXT-2 | **← Sign in with Microsoft (Peer Islands)** | Returns to Microsoft-only view. |
| L-EXT-3 | Valid external user email/password | Login succeeds (or TOTP step if enabled on account). |
| L-EXT-4 | TOTP when required | After password, TOTP screen; valid code completes login. |
| L-EXT-5 | Wrong password | Error toast / message; no session. |

---

## Login — internal must not use password (when Azure is configured)

| ID | Steps | Expected |
|----|--------|----------|
| L-BLK-1 | **Login** → external path → enter `@peerislands.io` + password | Backend rejects; toast/error indicates **Microsoft sign-in** (not generic “invalid password” only—copy may vary). |

---

## Signup

| ID | Steps | Expected |
|----|--------|----------|
| S-1 | **Sign up** (from header/modal) | Callout (if SSO env set): Peer Islands use **Login → Microsoft**; form is for **external** users. |
| S-2 | Fill form with **external** email (not `@peerislands.io`) | Proceeds to TOTP / MFA steps as today. |
| S-3 | Submit with **`@peerislands.io`** (SSO configured) | Toast blocks signup; message to use Microsoft login instead. |
| S-4 | Switch **Login** ↔ **Sign up** | Modals switch without full page errors. |

---

## Footer / copy

| ID | Steps | Expected |
|----|--------|----------|
| C-1 | Login, SSO-first screen | Footer: **Need an external account? Sign up** (or equivalent). |
| C-2 | Login, external email path | Footer: **Don’t have an account? Sign up**. |

---

## Popup / CSP / redirect

| ID | Steps | Expected |
|----|--------|----------|
| P-1 | Microsoft sign-in | If popup blocked, browser shows blocked-popup UI; allow popups for localhost. |
| P-2 | After Azure consent | Redirect/popup closes; app receives token and calls `/api/v1/auth/azure/token`. |
| P-3 | Wrong redirect URI in Entra | Azure error in popup (e.g. AADSTS50011); fix URIs in Azure portal to match `redirectUri` (usually site origin). |

---

## Regression (quick)

| ID | Steps | Expected |
|----|--------|----------|
| R-1 | Logout (if you have it) → Login external → login | Session restored. |
| R-2 | **Forgot password** from external login path | Navigates to forgot-password flow (existing behavior). |
| R-3 | Mobile width | Login modal usable; buttons tappable. |

---

## Notes

- Use **`http://localhost:5173`** (or your Vite URL) in Azure **SPA redirect URIs**; avoid `0.0.0.0` as `VITE_API_BASE_URL` in the browser—prefer `http://127.0.0.1:8000` or `http://localhost:8000`.
- Internal domain in app logic is **`@peerislands.io`**; keep test accounts aligned.
