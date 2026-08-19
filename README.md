# AEE Vente

A point-of-sale app for the associations of ENSSAT, built on **Expo (React Native)**:
a product grid, a basket and a checkout that takes cards through **SumUp**, backed by
the **AEE Manager API**.

It ships with a reusable **React Native wrapper for the SumUp SDKs**, exposing one
identical JS API for **Tap to Pay** and the **Bluetooth card reader** on both platforms.
The wrapper is an Expo local module kept in its own git submodule:

```
aee-vente/                                       ← this app
├── app/                                         ← Expo Router screens (login, tenant, sell…)
├── src/
│   ├── api/                                     ← generated typed client (AEE Manager API)
│   ├── services/                                ← auth (Keycloak SSO), orders, payments
│   ├── presentation/                            ← contexts, hooks, components
│   └── domain/                                  ← models + repository interfaces
├── modules/sumup-tap-to-pay-sdk-react-native/   ← submodule: the SumUp wrapper
│   ├── index.ts · src/                          ← unified TS API (SumUp)
│   ├── ios/                                     ← Swift bridge + facade
│   ├── android/                                 ← Kotlin bridge + facade
│   └── plugin/withSumUp.js                      ← Android maven repos + desugaring
└── plugin/                                      ← app-level Expo config plugins
```

| | iOS | Android |
|---|---|---|
| SumUp dependency | `SumUpSDK` 7.1 (one xcframework) | `utopia-sdk` 1.1.2 + `merchant-sdk` 7.1.0 |
| Tap to Pay | `SumUpSDK` | `com.sumup.tap-to-pay:utopia-sdk` |
| Bluetooth reader | `SumUpSDK` | `com.sumup:merchant-sdk` |

## The JS API (identical on both platforms)

```ts
import { SumUp } from './modules/sumup-tap-to-pay-sdk-react-native';

await SumUp.login(accessToken, affiliateKey);          // { tapToPay, bluetoothCardReader }
await SumUp.checkTapToPayAvailability();               // { available, activated }
const r = await SumUp.pay({ method: 'tapToPay', amount: 150, currency: 'EUR' }); // 150 = €1.50
if (r.success) console.log(r.sumupTransactionId);
await SumUp.openCardReaderSettings();
await SumUp.logout();
```

`amount` is **integer minor units** (cents). `method` is `'tapToPay'` or `'bluetoothCardReader'`.

## Setup

Package manager is **bun** — use `bun` / `bunx`, never `npm` / `npx`.

1. **Clone with submodules**
   ```bash
   git clone --recurse-submodules <this repo>
   # or, in an existing clone:
   git submodule update --init --recursive
   ```
2. **Install JS deps**
   ```bash
   bun install
   bunx expo install   # aligns native package versions with the SDK
   ```
3. **Configure secrets** — copy `.env.example` → `.env` and fill in (it also documents the
   optional build-time switches: `APP_VARIANT`, `BUILD_NUMBER`):
   - `API_BASE_URL` — the AEE Manager API
   - `KEYCLOAK_URL`, `KEYCLOAK_REALM`, `KEYCLOAK_CLIENT_ID` — the realm issuing its tokens
     (not secrets: the client is public)
   - `SUMUP_AFFILIATE_KEY` (runtime key; it identifies the app, not a merchant). The SumUp
     **access token** is deliberately absent — each association's own key is served by
     `GET /payment-method-config`, so no merchant secret ships in the app
   - `SUMUP_MAVEN_USER`, `SUMUP_MAVEN_PASSWORD` (Android Tap to Pay private maven repo —
     request from `integration@sumup.com`)
4. **Prebuild + run on a real device** (SumUp needs hardware; the iOS simulator slice is excluded):
   ```bash
   bunx expo run:ios --device       # real iPhone, iOS 16+
   bunx expo run:android --device   # real Android device, API 30+
   ```

Lint and format with Biome: `bun run lint`, `bun run format` (CI-style, no writes:
`bun run check-lint`, `bun run check-format`).

## The AEE Manager API

The app talks to `https://api.aee-manager.bde-enssat.fr` through a **generated** client in
`src/api/` — do not hand-edit it. Two files are checked in and must move together:

```bash
# 1. types: one interface per schema, one method signature per operationId
bunx openapicmd typegen https://api.aee-manager.bde-enssat.fr/swagger.json > src/api/openapi.d.ts

# 2. the same document, bundled so the runtime client needs no network round-trip
curl -s https://api.aee-manager.bde-enssat.fr/swagger.json -o src/api/spec.json
```

Run both whenever the backend contract changes, then `bunx tsc --noEmit` — a renamed field
or operation surfaces as a type error at every call site. Both files are excluded from
Biome in `biome.json`.

`src/api/client.ts` builds an **`openapi-client-axios`** client over an axios instance the
app owns (its interceptors, its base URL), giving one typed method per `operationId`:
`api.listGrids()`, `api.createOrder(null, body)`, `api.confirmOrder({ id }, { sumupTxId })`.

Two rules the OpenAPI document does not state:

- **Tenancy** — every call carries an `X-Tenant-Id` header, except `/me`, `/me/tenants`
  and `/tenants/join` (`TENANT_FREE_PATHS`), which are how a tenant is discovered in the
  first place.
- **Auth** — a Keycloak JWT; the API has no login endpoint. Sign-in is **SSO**
  (authorization code + PKCE via `expo-auth-session`), so the app never handles a password.

### Keycloak client

The public client (`KEYCLOAK_CLIENT_ID`, default `web`) needs *Standard flow* enabled and
the app's redirect registered in **both** lists — they are separate, and logout does not
fall back to the login one. Each build variant has its own scheme, so both belong in each
list (`APP_VARIANT=dev` builds `aeevente-dev` so the test build can sit on the same device
as production without the two fighting over the callback):

| Field | Value |
|---|---|
| Valid redirect URIs | `aeevente://auth`, `aeevente-dev://auth` |
| Valid post logout redirect URIs | same two (or `+` to reuse the list above) |

The exact string is logged at start-up in dev. Sign-out is two-sided on purpose — the
refresh token is revoked back-channel *and* the end-session endpoint is opened in the
browser, otherwise Keycloak's SSO cookie silently signs the same person back in on a POS
passed between sellers.

On **Android** the callback returns as a real deep link (a Custom Tab cannot hand its
result back in-process the way `ASWebAuthenticationSession` does), which expo-router would
otherwise answer with "Unmatched Route" — `app/+native-intent.ts` keeps that URL away from
the router.

## Important constraints

- **Tap to Pay needs a RELEASE build on a real device.** Both SDKs perform device
  attestation and refuse to run with USB debugging / Developer Options enabled.
  The Bluetooth card reader works in debug builds.
- **iOS** needs the `com.apple.developer.proximity-reader.payment.acceptance`
  entitlement on the provisioning profile (set in `app.config.js`; Apple must grant it).
- Run on a **real device** — the SumUp iOS xcframework excludes the arm64 simulator slice.
- `ios/` and `android/` are generated by prebuild (CNG). Change `app.config.js`,
  `expo-build-properties` or a config plugin instead — and re-run
  `bunx expo prebuild --clean` after editing a plugin or a native dependency.

## Publishing the submodule

The `sumup-tap-to-pay-sdk-react-native` repo and this one both push to
`github.com/AE-ENSSAT`. Native changes (Swift / Kotlin / `withSumUp.js`) live in the
submodule: commit and **push it first**, then commit the updated submodule pointer here —
otherwise this repo references a SHA the remote does not have.
