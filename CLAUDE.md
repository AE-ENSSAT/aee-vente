# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**AEE Vente** is an Expo (React Native) point-of-sale demo app plus a reusable Expo
local module that wraps the **SumUp** payment SDKs — **Tap to Pay** and the **Bluetooth
card reader** — behind one identical JS API for both iOS and Android. The app is a small
layered POS demo — a login screen plus a **sell page** (product grid, category carousel,
basket, checkout) — that reaches payments through a `PaymentService` abstraction over the
module. The reusable substance lives in the module; the app's own structure is in
**App architecture** below.

The module is a **git submodule** at `modules/sumup-tap-to-pay-sdk-react-native`
(repo `AE-ENSSAT/sumup-tap-to-pay-sdk-react-native`, branch `main`). It contains the
unified TS API, both native implementations (Swift + Kotlin), and the Android config
plugin.

## Commands

Package manager is **bun** (`bun.lock`) — always `bun` / `bunx`, never `npm` / `npx`.
Tooling is **Biome** (lint + format). There is **no test suite**.

```bash
bun install                       # JS deps
bunx expo run:ios --device        # build + run on a real iPhone (iOS 16+)
bunx expo run:android --device    # build + run on a real Android device (API 30+)
bunx expo prebuild --clean        # regenerate ios/ + android/ and re-run withSumUp.js
                                  #   (REQUIRED after editing the config plugin or native deps)

bun run lint          # biome check --write   (lint + apply safe fixes)
bun run format        # biome format --write
bun run check-lint    # biome check           (no writes — CI-style)
bun run check-format  # biome format          (no writes)
```

Biome config ([biome.json](biome.json)): **tab indent, width 4, single quotes**. Match it.
([app/index.tsx](app/index.tsx) has some pre-existing format deviations unrelated to most
changes — don't reflexively reformat the whole file.)

Must run on a **real device**: the SumUp iOS xcframework excludes the arm64 simulator
slice, and both SDKs do device attestation. **Tap to Pay additionally needs a RELEASE
build with Developer Options/USB debugging OFF**; the Bluetooth reader works in debug.

## App architecture (the Expo app)

Clean layered structure: the UI depends on **interfaces**, and a small "composition root"
binds each interface to a concrete impl — so the dummy data and the SumUp module can be
swapped without touching screens. Each lower layer is reached only through its interface.

**Screens** (`app/`, expo-router): [_layout.tsx](app/_layout.tsx) nests the providers
(`GestureHandlerRootView` → `SafeAreaProvider` → `AuthProvider` → `SumUpProvider` →
`BasketProvider` → `Stack`); [index.tsx](app/index.tsx) is the SSO login (one button — no
credential fields);
[tenant.tsx](app/tenant.tsx) picks the association (or joins one with an invite code) and
is shown after every sign-in, even to a seller who belongs to just one — only a session
resumed at start-up skips it;
[sell.tsx](app/sell.tsx) is the POS page.

- **Presentation** (`src/presentation/`) — contexts, hooks, components:
  - [auth/AuthContext.tsx](src/presentation/auth/AuthContext.tsx) — owns the signed-in
    session: token, selected tenant, roles/permissions (`canSell`).
    [auth/SessionGuard.tsx](src/presentation/auth/SessionGuard.tsx) returns to the login
    screen when a live session lapses.
  - [basket/BasketContext.tsx](src/presentation/basket/BasketContext.tsx) — reducer-backed
    basket (`items`, `itemCount`, `totalCents`, `addProduct/increment/decrement/remove/clear`).
  - [sumup/SumUpContext.tsx](src/presentation/sumup/SumUpContext.tsx) — owns the SumUp
    session: logs in once on mount, exposes `pay` / `openReaderSettings`.
  - [checkout/useCheckout.ts](src/presentation/checkout/useCheckout.ts) — use-case: sell the
    basket (see **Sale flow**). [checkout/usePaymentMethods.ts](src/presentation/checkout/usePaymentMethods.ts)
    reads the tenant's enabled rails. [sell/useSellGrids.ts](src/presentation/sell/useSellGrids.ts)
    loads grids from the repository, keyed on the selected tenant.
  - `components/` (see **Sell screen UI**), [money.ts](src/presentation/money.ts)
    (`formatEuros`), [theme.ts](src/presentation/theme.ts) (`APP_MARGIN` — the one app-wide
    spacing constant).
- **Services** (`src/services/`) — [PaymentService.ts](src/services/PaymentService.ts)
  interface (abstracts the module), [SumUpPaymentService.ts](src/services/SumUpPaymentService.ts)
  impl (shared/de-duplicated login, Android runtime BT permissions), bound in
  [payment.ts](src/services/payment.ts). Over the API: [orders.ts](src/services/orders.ts)
  (sale lifecycle), [account.ts](src/services/account.ts) (identity, tenants, profile),
  [tenant.ts](src/services/tenant.ts) (selected tenant),
  [paymentConfig.ts](src/services/paymentConfig.ts) (enabled rails **and the tenant's SumUp
  key** — `SumUpProvider` logs the device into that association's merchant account, and
  re-logs in on a switch, so takings land where the sale is recorded), and
  `auth/` (`AuthService` interface + `KeycloakAuthService`, bound in
  [auth.ts](src/services/auth.ts)).
- **API** (`src/api/`) — see **The AEE Manager API** below.
- **Data** (`src/data/`) — [ApiSellGridRepository.ts](src/data/ApiSellGridRepository.ts)
  maps the API's grids onto the domain, bound in
  [repositories.ts](src/data/repositories.ts). `DummySellGridRepository` is still there —
  bind it instead to run the sell screen with no backend.
- **Domain** (`src/domain/`) — [models.ts](src/domain/models.ts) (`Product`, `SellGrid`,
  `BasketItem`) + the `SellGridRepository` interface. No dependencies.

**Money is always integer cents** (matches the module and the API); display via `formatEuros`.

### Sell screen UI

- **Grid** ([SellGrid.tsx](src/presentation/components/SellGrid.tsx)) — products chunked
  into rows of exactly 3 square tiles via flexbox (`flex: 1` + `aspectRatio: 1`, no pixel
  math, so it never wraps/overflows); a short last row is padded with empty cells. Each
  [ProductTile](src/presentation/components/ProductTile.tsx) shows its basket quantity as a
  [CountBadge](src/presentation/components/CountBadge.tsx) — the same bubble as the basket
  button.
- **Category carousel** ([GridTabs.tsx](src/presentation/components/GridTabs.tsx)) — a
  synthetic **"Tout"** pill (all products, deduped) first, then one per grid. The grid is a
  horizontal **paging `ScrollView`** (one page per tab): tapping a pill pages to it, swiping
  the grid selects the pill — both keep `selectedId` in sync and centre the active pill.
- **Basket** — a floating [BasketFab](src/presentation/components/BasketFab.tsx) opens a
  native bottom sheet ([BasketSheet.tsx](src/presentation/components/BasketSheet.tsx)) built
  on **`@lodev09/react-native-true-sheet`** (detents `[0.7, 1]` — 0.7 default, drag to full
  screen; pinned header/footer, only the list scrolls). Rows support **swipe-to-delete** via
  `react-native-gesture-handler`'s `ReanimatedSwipeable`; on Android the sheet content needs
  its **own** `GestureHandlerRootView` (it renders in a separate window, outside the app
  root's).
- [PayButtons](src/presentation/components/PayButtons.tsx) drive `useCheckout`; the Tap to
  Pay label is per-platform (iPhone / Android). Only the rails
  `GET /payment-method-config` reports as enabled are rendered.

## The AEE Manager API

Backend: `https://api.aee-manager.bde-enssat.fr` (OpenAPI at `/swagger.json`). Its client
lives in `src/api/` and is **generated, not hand-written**:

```bash
# types — regenerate whenever the backend contract changes
bunx openapicmd typegen https://api.aee-manager.bde-enssat.fr/swagger.json > src/api/openapi.d.ts
# the same document, bundled so the runtime client needs no network round-trip; keep in step
curl -s https://api.aee-manager.bde-enssat.fr/swagger.json -o src/api/spec.json
```

[client.ts](src/api/client.ts) builds an **`openapi-client-axios`** client over an axios
instance we own (so the interceptors and the .env base URL are ours), via `initSync` —
the document is a local object, so there's no async startup step. That yields one typed
method per `operationId` for all 65 operations: `api.listGrids()`,
`api.createOrder(null, body)`, `api.confirmOrder({ id }, { sumupTxId })`, …
Both generated files are excluded from Biome in [biome.json](biome.json).

Two things the OpenAPI document does **not** say, both confirmed against the live API:
- **Tenancy** is an `X-Tenant-Id` header on every call. `/me`, `/me/tenants` and
  `/tenants/join` must NOT carry it — they're how a tenant gets discovered in the first
  place (`TENANT_FREE_PATHS` in client.ts). Note `/me/profile` and `/me/sales` *are*
  tenant-scoped despite the prefix.
- **Auth** is a Keycloak JWT; the API has no login endpoint of its own. Realm `app` at
  `https://auth.aee-manager.bde-enssat.fr`, public client `web`.
  [KeycloakAuthService](src/services/auth/KeycloakAuthService.ts) does **SSO**:
  authorization code + PKCE via `expo-auth-session`, with Keycloak's own page shown in a
  system browser session — the app never handles a password. That client needs *Standard
  flow* enabled and **`aeevente://auth`** registered as both a Valid redirect URI and a
  Valid post logout redirect URI (the exact string is logged at start-up in dev). PKCE is
  what makes a secretless public client safe.

  Android needs one extra piece: the callback comes back as a real deep link
  (`aeevente://auth?code=…`), because a Custom Tab can't return its result in-process the
  way `ASWebAuthenticationSession` does. expo-router hears that same `Linking` event and
  renders **"Unmatched Route"** over the app — so
  [app/+native-intent.ts](app/+native-intent.ts) drops the callback URL for the router
  only (`expo-web-browser` still gets it, and post-sign-in navigation follows session
  state, not the URL). iOS never reaches that code path.

  The realm is also the only source of a **person's name**: the API's `MeProfileDto`
  carries just a `username` (`aee-test`), so `AuthService.fetchUser()` reads `name` /
  `given_name` / `family_name` from the OIDC **userinfo** endpoint for anything a seller
  sees on screen.

  Sign-out is deliberately two-sided: the refresh token is revoked back-channel **and**
  the end-session endpoint is opened in the browser. Skipping the second leaves Keycloak's
  SSO cookie alive, so the next "Se connecter via SSO" silently signs the *same* person
  back in — on a POS passed between sellers that's a real bug, not a nicety.

[session.ts](src/api/session.ts) holds the token + tenant the interceptors read. Only the
**refresh** token is persisted (SecureStore) — access tokens are minted fresh on start-up.
Renewal happens *before* a call when the token is near expiry, and reactively on a 401,
de-duplicated so parallel 401s cost one token exchange. Every error leaves the client as an
[ApiError](src/api/errors.ts), never an `AxiosError`.

### Sale flow

The sale is opened on the server **before** any money is taken, which is what makes the two
sides reconcilable ([useCheckout](src/presentation/checkout/useCheckout.ts)):

1. `POST /orders` — cash returns `completed`; a card mean returns `pending`.
2. the device charges the card **for the server's total**, not the basket's (the backend
   prices the cart: member rates, option deltas, catalogue edits since load).
3. `POST /orders/{id}/confirm` with SumUp's transaction id, or `/decline` when refused.

If step 3 is lost (network drop, app killed) the customer has still paid, so the sale
succeeds locally and `POST /orders/reconcile` settles it against SumUp later. Each attempt
carries a fresh `idempotencyKey`; a refused card order **must** be retried under a new one.

Sales are also mirrored into the local [transactionStore](src/data/transactionStore.ts),
which keeps the product **names** the API's sale items don't carry — that is what the
receipt and history screens read.

## SumUp module architecture

Three layers, top to bottom. **The JS layer never branches on platform** — parity is the
job of the two native facades, which return result maps with identical keys.

1. **Unified JS API** — [src/SumUp.ts](modules/sumup-tap-to-pay-sdk-react-native/src/SumUp.ts)
   (`SumUp.login/pay/logout/getStatus/...`) over the native module interface
   `src/SumUpTapToPayModule.ts`. Shared, platform-agnostic types in
   [src/types.ts](modules/sumup-tap-to-pay-sdk-react-native/src/types.ts). `amount` is
   always **integer minor units** (cents): `150` = €1.50.

2. **Expo bridge modules** (thin) — `ios/SumUpTapToPayModule.swift` and
   `android/.../expo/modules/sumuptaptopay/SumUpTapToPayModule.kt`. They only marshal
   args/promises and forward to the facade; no SumUp logic here. The Android bridge also
   forwards `OnActivityResult` (the merchant SDK is Activity-based) and passes the current
   `Activity` into `login`/`pay`.

3. **Platform facades** (the real logic) — `ios/SumUpManager.swift` and
   `android/.../bzh/aee/sumup/SumUpManager.kt`. All SumUp behavior lives here.

### The core asymmetry (read this before touching login/pay)

| | iOS | Android |
|---|---|---|
| SDKs | **one** `SumUpSDK` | **two**: `com.sumup.tap-to-pay:utopia-sdk` 1.1.2 + `com.sumup:merchant-sdk` 7.1.0 |
| Login | one `login(withToken:)` powers **both** methods (~fast) | Tap to Pay: headless `init()`; card reader: **Activity-based** `SumUpAPI.openLoginActivity` — no headless login exists |

Consequences baked into `SumUpManager.kt`:
- `login()` logs in **both** methods (iOS parity). Tap to Pay inits headlessly; the card
  reader logs in eagerly (or refreshes an existing session with `updateAccessToken`). The
  two are run **concurrently** (`async`/`await`) since they're independent SDKs.
- `pay()` **never auto-connects**: if the requested method has no session it throws
  `"Log in first!"` (string kept identical to iOS `SumUpError.notLoggedIn`).
- Result-map keys (`tapToPay`, `bluetoothCardReader`, `success`, `state`,
  `sumupTransactionId`, `transactionId`) are declared as constants in both facades and
  **must stay in sync** — the JS/types layer assumes they match.

## The Android config plugin — `plugin/withSumUp.js`

All Android-only native config that can't live in the module's `build.gradle`. Editing it
requires `expo prebuild --clean` to take effect. It handles:
- SumUp maven repos (incl. the **private Tap-to-Pay repo** with credentials from
  `SUMUP_MAVEN_USER`/`SUMUP_MAVEN_PASSWORD` and a content filter so its HTTP 500s don't
  break other resolution), core-library desugaring, a **Koin 3.5.3 pin** (utopia-sdk needs
  the old `lazyModules` signature), raised Gradle JVM memory, and disabling release lint.
- **Hiding the card-reader login flash** (see below).

### Card-reader login flash (Android)

The merchant SDK's `LoginActivity` flashes a full-screen branded screen for ~0.5s during
the token-exchange RPC even with an access token; there is no headless login API. The
plugin hides it (for the opaque-token path) by: (1) a per-activity **translucent theme**
override via `tools:replace`, inheriting `SumUpTheme.ActionBarNoShadow` so the AppCompat
ActionBar the Activity needs still exists; (2) an **app-level resource override** of
`res/layout/sumup_activity_login.xml` (app resources win the merge over the library's) that
keeps the original `<include>` — so every `findViewById` still resolves — but marks the
root `visibility="invisible"`. The flash is also a **first-login-only** event (the session
persists across restarts; later logins just refresh the token). Caveat: JWT access tokens
route to `SSOLoginActivity` instead, which sets its theme in code and is **not** covered.
Full rationale is in the plugin's header comment.

## Submodule workflow (important)

Native changes (Swift / Kotlin / `withSumUp.js`) live in the **submodule**, not the parent.
- **Commit in two steps**: commit inside `modules/sumup-tap-to-pay-sdk-react-native` first,
  then a second commit in `aee-vente` bumping the submodule pointer.
- **Push order**: submodule first, then parent — otherwise the parent references a SHA the
  remote doesn't have (GitHub shows 404 for it).
- There may be a **separate standalone clone** of this submodule elsewhere on disk; commits
  in the embedded `modules/...` copy do not appear there. Treat the embedded copy as the
  source of truth and `pull` in the standalone.
- All three repos (this one + the submodule) push to `github.com/AE-ENSSAT`.

## Configuration & constraints

- Secrets and endpoints live in `.env` (see `.env.example`), surfaced via `app.config.js` →
  `extra` → [constants/sumup.ts](constants/sumup.ts) and [constants/api.ts](constants/api.ts):
  `SUMUP_AFFILIATE_KEY` (runtime — the *access token* is not here: it is the tenant's own
  merchant key, served by `GET /payment-method-config`, so nothing secret is bundled),
  `SUMUP_MAVEN_USER`/`SUMUP_MAVEN_PASSWORD` (Android private maven), plus `API_BASE_URL`
  and `KEYCLOAK_URL`/`KEYCLOAK_REALM`/`KEYCLOAK_CLIENT_ID` (not secrets — the client is
  public — so shipping them in `extra` is fine).
- iOS requires the `com.apple.developer.proximity-reader.payment.acceptance` entitlement
  (set in `app.config.js`, granted by Apple on the provisioning profile).
- Android: `minSdkVersion 30`, Java 17 (set via `expo-build-properties`).
- `ios/` and `android/` are generated by prebuild (CNG) — don't hand-edit them; change
  `app.config.js`, `expo-build-properties`, or the config plugin instead.
