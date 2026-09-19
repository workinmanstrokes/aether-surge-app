# Publishing Aether Surge to Google Play

## What's already done
- Native Android project (Capacitor) builds successfully — debug and signed release AAB both verified.
- Polish: pause (button + Android back button + auto-pause on backgrounding), haptics on hit/level-up/ascend/death, status bar theming, native splash screen, portrait lock, persisted best-score.
- Monetization: AdMob wired for a bottom banner (start/end screens only, hidden during gameplay), an interstitial every other retry/continue, and a rewarded "watch ad to revive" on death — **currently using Google's official test ad unit IDs**, safe to build and test with, but they show only test ads and earn no revenue.
- App icon (adaptive + legacy, all densities) and splash screen generated from `assets/icon*.svg` / `assets/splash.svg`.
- Feature graphic for the store listing: `assets/store/feature-graphic.png` (1024x500).
- Privacy policy draft: `privacy-policy.html` — **has placeholders you must fill in** (your name/contact, effective date, children's-audience statement) before hosting it.
- Signed release keystore: `keystore/aether-surge-upload.jks`, wired into `android/app/build.gradle` via `android/keystore.properties`.

## Before you publish — required steps

### Signing fingerprint (SHA-256)
`27:7F:5A:1A:D2:1E:E7:87:F8:47:0C:79:2B:81:C1:DE:BF:F7:1A:53:79:26:DC:D2:CB:F6:45:50:B1:4F:DF:88`
Keep this handy — some services (Firebase, other SDKs) ask for it when you register the app.

### 1. Back up the keystore. This is the single most important step.
`keystore/aether-surge-upload.jks` plus the credentials in `keystore/CREDENTIALS_DO_NOT_COMMIT.txt` are what let you
ever publish an update to this app again. **If you lose them, you cannot update the app under this listing — Google
cannot recover or reset it.** Copy both files somewhere safe and durable (a password manager, an encrypted backup) —
not just this machine. Neither file is committed to git (see `.gitignore`), so don't lose your only copy.

### 2. Swap in real AdMob IDs
1. Create an AdMob account at https://admob.google.com (separate from your Play Console account, same Google login is fine).
2. Create an app in AdMob, get your real **App ID** (format `ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY`).
3. Create three ad units: Banner, Interstitial, Rewarded — get their ad unit IDs (format `ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ`).
4. Replace:
   - `android/app/src/main/AndroidManifest.xml` — the `com.google.android.gms.ads.APPLICATION_ID` meta-data value (search for the `TODO` comment above it).
   - `www/index.html` — the `AD.bannerId`, `AD.interId`, `AD.rewardId` values near the top of the script, and remove `isTesting:true` from the three `AdMob.prepare*`/`showBanner` calls once you're ready for real traffic (leave `isTesting:true` while you're still testing so you never risk serving/clicking real ads yourself, which AdMob can penalize).
   - Copy `www/index.html` to `android/app/src/main/assets/public/index.html` (or run `npx cap sync android`) and rebuild.

### 3. Finish and host the privacy policy
Fill in the placeholders in `privacy-policy.html` (your name/contact email, effective date, and whether the app targets
children). Host it somewhere public (GitHub Pages is free and simple) and use that URL in Play Console's Store Listing
and Data Safety sections. **Required** because the app uses ads (AdMob collects advertising ID / device data).

### 4. Build the real release
```
cd android
./gradlew bundleRelease
```
Output: `android/app/build/outputs/bundle/release/app-release.aab` — this is the file you upload to Play Console.
(Already built once during setup to confirm signing works — rebuild after step 2's ID swap.)

### 5. Google Play Console checklist
You said you already have a developer account, so:
1. Create a new app (Aether Surge: Survivor RPG, package `com.aethersurge.game`).
2. **Store listing**: short/long description, screenshots (see below), `assets/store/feature-graphic.png`, app icon (`assets/icon.png`, 512x512 — resize if Play wants exactly 512, current is 1024, downscale it).
3. **Content rating** questionnaire — answer based on violence level (cartoon/fantasy violence, no blood) and ads.
4. **Target audience and content** — pick the actual audience; if not children, say so explicitly (affects ad settings).
5. **Data safety** form — declare AdMob's data collection (advertising ID, device identifiers) as described in the privacy policy. AdMob's own Play Console help page has the exact checklist AdMob requires.
6. **Privacy policy URL** — paste your hosted URL from step 3.
7. **App content** — ads declaration: yes, contains ads.
8. Upload `app-release.aab` under Production (or start with Internal Testing to try it on a real device first — recommended for a first release).
9. Submit for review.

### Screenshots
Not yet generated. Easiest path: run the app on the emulator (`emulator -avd Pixel_8`, install the debug APK,
`adb shell screencap`) or on a real device, and capture the start screen, mid-gameplay, and a level-up screen —
Play Store needs at least 2 phone screenshots (1080x1920 or similar portrait aspect works well).

## Reference: project layout
- `www/index.html` — the game itself (source of truth; edit here, then sync to `android/app/src/main/assets/public/`)
- `android/` — native Capacitor Android project
- `assets/` — icon/splash SVG sources and generated PNGs, `assets/store/` — store listing graphics
- `keystore/` — signing key (back this up!)
- `capacitor.config.json` — app ID / name / web dir config
