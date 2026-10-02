# Publishing Brainrot: Tactical Aura Rush to Google Play

> This project was split out of the original "Aether Surge" app (which now lives in its own repo,
> `workinmanstrokes/aether-surge`). Brainrot has its own app ID and must be published as a **separate**
> Play Console app — never upload it to the Aether Surge listing.

## Identity
- App ID / package: `com.brainrot.aurarush` (`capacitor.config.json`, `android/app/build.gradle` `applicationId` + `namespace`)
- App name: `Brainrot: Tactical Aura Rush` (`capacitor.config.json`); launcher label `Brainrot: Aura Rush`
  (`android/app/src/main/res/values/strings.xml` → `app_name`; shortened so it fits under the home-screen icon)
- Main activity: `android/app/src/main/java/com/brainrot/aurarush/MainActivity.java`

## Current state
- Native Android project (Capacitor 8). GitHub Actions (`.github/workflows/build-apk.yml`) builds a **debug APK** on
  push to `master`/`main` and on manual `workflow_dispatch`; the artifact is `BrainrotAuraRush-debug`.
- The game (`www/index.html`) is a self-contained canvas game with no network calls. It uses `localStorage` only for
  the best aura, best zone and mute setting (key `brainrot-aura-rush-v1`). It has its own pause/mute buttons and
  pauses when the app is backgrounded. It does **not** call any Capacitor plugins yet: no ads, no haptics, no Android
  back-button handling, no status-bar/splash handling. The wordmark font (`www/fonts/`, SIL OFL) is bundled.
- `package.json` still depends on `@capacitor-community/admob`, `@capacitor/haptics`, `@capacitor/app`,
  `@capacitor/status-bar` and `@capacitor/splash-screen` (inherited from Aether Surge). Either wire them into the game
  or remove the unused ones before release — the AdMob SDK in particular affects the Data safety form.
- `AndroidManifest.xml` still contains **Google's test AdMob App ID** (`ca-app-pub-3940256099942544~3347511713`).

## Before you publish — required steps

### 1. Store art (done, regenerate with `tools/art/`)
All Brainrot art is generated from code by `tools/art/` (see `tools/art/README.md`). It's original, with no
third-party characters:
- Play icon: `store-assets/icon-512.png` (512x512, 32-bit PNG)
- Feature graphic: `store-assets/feature-graphic-1024x500.png` (24-bit PNG, no alpha)
- Phone screenshots: `store-assets/phone-1080x1920/` (8 real gameplay captures, 1080x1920)
- Launcher icons (`mipmap-*`, adaptive foreground/background) and all `drawable*/splash.png` are replaced, and so are
  the `assets/icon*` / `assets/splash*` sources. To change them, edit `tools/art/scenes.mjs` and run
  `cd tools/art && npm install && node generate.mjs`.
- Re-shoot the screenshots after gameplay changes (`node capture-screenshots.mjs`).

### 2. Signing key
Create a **new upload keystore for this app** (don't reuse the Aether Surge key), e.g.:
```
keytool -genkeypair -v -keystore keystore/brainrot-upload.jks -alias brainrot -keyalg RSA -keysize 2048 -validity 10000
```
Then create `android/keystore.properties` (git-ignored) with `storeFile`, `storePassword`, `keyAlias`, `keyPassword`
— `android/app/build.gradle` picks it up automatically. **Back the keystore and passwords up somewhere safe**; if you
lose them you cannot update the app. Keystores and `keystore.properties` are git-ignored — keep it that way.

### 3. Ads (only if you decide to monetize with AdMob)
1. Create the app in AdMob, get the real App ID (`ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY`) and ad unit IDs.
2. Replace the test App ID in `android/app/src/main/AndroidManifest.xml` (`com.google.android.gms.ads.APPLICATION_ID`).
3. Add the AdMob calls to `www/index.html` (keep `isTesting:true` while testing).
If you don't want ads, remove `@capacitor-community/admob` from `package.json` and the AdMob `<meta-data>` from the
manifest, and update the privacy policy's Advertising section accordingly.

### 4. Finish and host the privacy policy
`privacy-policy.html` still has TODOs: developer name, contact email, children's-audience statement, and whether the
Advertising section applies. Host it publicly (e.g. GitHub Pages) and use the URL in Play Console.

### 5. Build the release
```
npx cap sync android
cd android
./gradlew bundleRelease
```
Output: `android/app/build/outputs/bundle/release/app-release.aab`.

### 6. Google Play Console checklist
1. Create a **new** app: Brainrot: Tactical Aura Rush, package `com.brainrot.aurarush`.
2. Store listing: descriptions, screenshots, feature graphic, 512x512 icon.
3. Content rating questionnaire.
4. Target audience and content — must match the privacy policy's children's statement.
5. Data safety form — declare what the final build collects (none by the game itself; AdMob data if ads are used).
6. Privacy policy URL.
7. Ads declaration (yes/no, depending on step 3).
8. Upload `app-release.aab` (start with Internal testing), then submit for review.

## Project layout
- `www/index.html` — the game (source of truth; `npx cap sync android` copies it into the Android project)
- `android/` — native Capacitor Android project
- `assets/`: icon/splash sources (generated by `tools/art/`)
- `store-assets/`: Play Store icon, feature graphic and phone screenshots
- `tools/art/`: code that generates all of the art above
- `capacitor.config.json` — app ID / name / web dir
