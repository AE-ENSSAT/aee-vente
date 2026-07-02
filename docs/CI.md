# CI/CD — build & distribute

On every push to `main` (and via the **Run workflow** button), GitHub Actions builds a
signed **release** APK and IPA and uploads both to **Firebase App Distribution**. See
[.github/workflows/build-and-distribute.yml](../.github/workflows/build-and-distribute.yml).

It runs on **free** standard runners — `ubuntu-latest` (Android) and `macos-15` (iOS). Both
are free and unlimited on **public** repos, so the whole pipeline costs nothing. The repo
must be **public** and the SumUp submodule must be **public** (no CI token is configured).

Nothing runs until the secrets below are set. Secrets are **not** exposed to pull requests
from forks, so keeping them here is safe for a public repo — the workflow only builds on
direct pushes to `main`.

---

## One-time setup

### 1. Firebase App Distribution

1. Create (or reuse) a Firebase project.
2. Register **two apps** in it:
   - Android package `bzh.aee.vente`
   - iOS bundle ID `bzh.aee.vente`
   Copy each **App ID** (looks like `1:1234567890:android:abcdef…`).
3. In **App Distribution**, create a tester group (default name used by the workflow:
   `testers`) and add testers.
4. Create a service account for uploads:
   **Project settings → Service accounts → Generate new private key** → download the JSON.
   Then in the Google Cloud console grant that service account the
   **Firebase App Distribution Admin** role.

### 2. Android upload keystore

Generate once and keep the `.jks` safe (losing it means testers must uninstall/reinstall):

```bash
keytool -genkeypair -v -keystore aee-upload.jks -alias aee-upload \
  -keyalg RSA -keysize 2048 -validity 10000
base64 -i aee-upload.jks | pbcopy   # → ANDROID_KEYSTORE_BASE64
```

### 3. iOS distribution certificate + provisioning profile

Using your Apple team (the one with the `proximity-reader.payment.acceptance` entitlement):

1. Create an **Apple Distribution** certificate, export it from Keychain Access as a
   `.p12` (set a password).
2. Create an **Ad Hoc** distribution provisioning profile for `bzh.aee.vente` that includes
   the entitlement **and every tester device's UDID** (ad-hoc/development installs only launch
   on registered devices). Download the `.mobileprovision`.
3. Note the **profile name** (as shown in the Developer portal) and your **Team ID**.

```bash
base64 -i dist_cert.p12          | pbcopy   # → IOS_DIST_CERT_BASE64
base64 -i aee_adhoc.mobileprovision | pbcopy # → IOS_PROVISIONING_PROFILE_BASE64
```

> If you distribute with a **development** profile instead of ad-hoc, change the
> `method` in the workflow's `ExportOptions.plist` from `release-testing` to `development`.

---

## Secrets & variables

Add under **Settings → Secrets and variables → Actions**.

### Repository secrets

| Secret | What it is |
|---|---|
| `SUMUP_AFFILIATE_KEY` | SumUp affiliate key (`sup_afk_…`) — baked into the app at build time |
| `SUMUP_ACCESS_TOKEN` | SumUp access token (`sup_sk_…`) |
| `SUMUP_MAVEN_USER` | SumUp private Maven username (Android build) |
| `SUMUP_MAVEN_PASSWORD` | SumUp private Maven password (Android build) |
| `FIREBASE_SERVICE_ACCOUNT` | Full JSON of the service-account key from step 1.4 |
| `FIREBASE_APP_ID_ANDROID` | Firebase App ID for the Android app |
| `FIREBASE_APP_ID_IOS` | Firebase App ID for the iOS app |
| `ANDROID_KEYSTORE_BASE64` | base64 of the upload keystore |
| `ANDROID_KEYSTORE_PASSWORD` | keystore (store) password |
| `ANDROID_KEY_ALIAS` | key alias (e.g. `aee-upload`) |
| `ANDROID_KEY_PASSWORD` | key password |
| `IOS_DIST_CERT_BASE64` | base64 of the `.p12` distribution certificate |
| `IOS_DIST_CERT_PASSWORD` | password set when exporting the `.p12` |
| `IOS_PROVISIONING_PROFILE_BASE64` | base64 of the ad-hoc `.mobileprovision` |
| `IOS_TEAM_ID` | Apple Developer Team ID (10 chars) |
| `IOS_PROFILE_NAME` | Provisioning profile name (as in the Developer portal) |

`FIREBASE_APP_ID_*` are not sensitive and may be stored as **repository variables**
instead of secrets if you prefer.

### Optional repository variable

| Variable | Default | What it is |
|---|---|---|
| `FIREBASE_TESTER_GROUPS` | `testers` | Comma-separated Firebase tester group alias(es) |

---

## How it works (brief)

- **Prebuild**: `ios/`/`android/` are gitignored (Expo CNG), so each job runs
  `expo prebuild` first. `BUILD_NUMBER=${{ github.run_number }}` feeds
  `ios.buildNumber` / `android.versionCode` in [app.config.js](../app.config.js) so every
  upload is a distinct, monotonic build.
- **Android signing**: [plugin/withAndroidSigning.js](../plugin/withAndroidSigning.js) adds a
  `release` signing config to the generated `build.gradle`, reading the keystore creds from
  `ORG_GRADLE_PROJECT_AEE_UPLOAD_*` env. With no keystore configured it falls back to debug
  signing, so local builds need no setup.
- **iOS signing**: the cert is imported into a temporary keychain and the profile installed;
  `xcodebuild archive`/`-exportArchive` produce a manually-signed IPA.
- **Caching**: Gradle user home (`setup-gradle`), CocoaPods, and bun/`node_modules` (keyed on
  `bun.lock`). The first run is cold; later runs are much faster.

## Troubleshooting

- **iOS "no matching provisioning profile"** — the profile's bundle ID, team, or entitlement
  doesn't match, or the profile name in `IOS_PROFILE_NAME` is wrong.
- **App installs but won't open (iOS)** — the test device's UDID isn't in the ad-hoc profile.
- **Firebase "group does not exist"** — create the `testers` group (or set
  `FIREBASE_TESTER_GROUPS`).
- **Android Maven 401/500** — check `SUMUP_MAVEN_USER`/`SUMUP_MAVEN_PASSWORD`.
