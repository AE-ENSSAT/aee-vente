# AEE Vente

Expo app + a **React Native wrapper for the SumUp SDKs**, exposing one identical
JS API for **Tap to Pay** and the **Bluetooth card reader** on both iOS and Android.

The wrapper is an Expo local module (`modules/sumup-tap-to-pay-sdk`) whose native
implementations live in two git submodules:

```
aee-vente/                                  ← this app
├── app/                                    ← Expo Router screens (the POS demo)
├── modules/sumup-tap-to-pay-sdk/           ← Expo module (the bridge)
│   ├── index.ts · src/                     ← unified TS API (SumUp)
│   ├── ios/  SumUpTapToPay.podspec + Swift Module
│   │   └── sumup-tap-to-pay-sdk-ios-react-native/      ← submodule (Swift facade)
│   └── android/  build.gradle + Kotlin Module
│       └── sumup-tap-to-pay-sdk-android-react-native/  ← submodule (Kotlin facade)
└── plugin/withSumUp.js                      ← Android maven repos + desugaring
```

| | iOS | Android |
|---|---|---|
| SumUp dependency | `SumUpSDK` 7.1 (one xcframework) | `utopia-sdk` 1.1.2 + `merchant-sdk` 7.1.0 |
| Tap to Pay | `SumUpSDK` | `com.sumup.tap-to-pay:utopia-sdk` |
| Bluetooth reader | `SumUpSDK` | `com.sumup:merchant-sdk` |

## The JS API (identical on both platforms)

```ts
import { SumUp } from './modules/sumup-tap-to-pay-sdk';

await SumUp.login(accessToken, affiliateKey);          // { tapToPay, bluetoothCardReader }
await SumUp.checkTapToPayAvailability();               // { available, activated }
const r = await SumUp.pay({ method: 'tapToPay', amount: 150, currency: 'EUR' }); // 150 = €1.50
if (r.success) console.log(r.sumupTransactionId);
await SumUp.openCardReaderSettings();
await SumUp.logout();
```

`amount` is **integer minor units** (cents). `method` is `'tapToPay'` or `'bluetoothCardReader'`.

## Setup

1. **Clone with submodules**
   ```bash
   git clone --recurse-submodules <this repo>
   # or, in an existing clone:
   git submodule update --init --recursive
   ```
2. **Install JS deps**
   ```bash
   bun install        # or: npm install
   npx expo install   # aligns native package versions with the SDK
   ```
3. **Configure secrets** — copy `.env.example` → `.env` and fill in:
   - `SUMUP_AFFILIATE_KEY`, `SUMUP_ACCESS_TOKEN` (runtime keys)
   - `SUMUP_MAVEN_USER`, `SUMUP_MAVEN_PASSWORD` (Android Tap to Pay private maven repo —
     request from `integration@sumup.com`)
4. **Prebuild + run on a real device** (SumUp needs hardware; the iOS simulator slice is excluded):
   ```bash
   npx expo run:ios --device       # real iPhone, iOS 16+
   npx expo run:android --device   # real Android device, API 30+
   ```

## Important constraints

- **Tap to Pay needs a RELEASE build on a real device.** Both SDKs perform device
  attestation and refuse to run with USB debugging / Developer Options enabled.
  The Bluetooth card reader works in debug builds.
- **iOS** needs the `com.apple.developer.proximity-reader.payment.acceptance`
  entitlement on the provisioning profile (set in `app.config.js`; Apple must grant it).
- Run on a **real device** — the SumUp iOS xcframework excludes the arm64 simulator slice.

## Publishing the submodules

The two `sumup-tap-to-pay-sdk-*-react-native` repos and this repo all push to
`github.com/AE-ENSSAT`. After making changes, commit & push each submodule first,
then commit the updated submodule pointers here.
