# Ghufran Khalil Petroleum Pump

A complete, offline-first fuel station hisab app for **Ghufran Khalil Petroleum Pump**.
It runs as a normal web page, installs as an Android APK, and updates itself from GitHub
without reinstalling the APK.

Sign in with Google once, finish the guided pump setup, and every sale, purchase, payment and
expense syncs through Firebase to every phone on that Google account. Each account is fully
isolated from every other account.

- **Live app:** https://khalilgemini214-boop.github.io/ghufran-khalil-petroleum-pump/
- **APK:** GitHub → **Actions** → **Build Android APK** → latest run → **Artifacts**

---

## Download and install the APK

1. Open the **Actions** tab of this repository.
2. Open the latest **Build Android APK** run.
3. Download **Ghufran-Khalil-Petroleum-Pump-APK**.
4. Unzip it and install `Ghufran-Khalil-Petroleum-Pump.apk` on the phone.
   Android will ask to allow installs from unknown apps — allow it for the browser/file manager you used.
5. Open the app once **with internet**. It will download the current version and cache it.

> The APK is a one-time install. Future app updates are pushed to GitHub Pages and are picked up
> automatically the next time the app opens online. You do **not** need a new APK for normal updates.
>
> Each CI debug APK can be signed with a different key. If you ever need to install a newer APK over
> the old one, take a backup and uninstall the old app first. Normal web updates never need this.

---

## Google login and cloud sync (Firebase)

The app starts with **Sign in with Google** and a **first-time setup wizard**. Every add, edit and
delete is saved to the phone first, then mirrored to **Firebase Firestore**, so the same hisab
appears on every phone signed in with that Google account.

Each Google account is isolated:

- its own Firestore station at `stations/{uid}`;
- its own local database key on the phone;
- its own offline deletion queue.

Two emails on the same phone cannot read, overwrite or upload each other's data.

### Firebase project (already connected)

The app is permanently connected to the **`petrolpump-8888d`** Firebase project through the
`FIREBASE_CONFIG` block in `index.html`. There is **no in-app screen to view, paste, or change the
Firebase configuration**, and user code cannot override it. Every install uses the same project.

One-time project checks in the Firebase console:

1. **Authentication → Sign-in method → Google → Enable**.
2. **Authentication → Settings → Authorized domains** → add the exact origin that serves the app.
   The current live app is served from `khalilgemini214-boop.github.io`, so that domain must be in
   the list. `paiwandsoftwares.com` only works once the app itself is served from that domain.
3. **Firestore Database** → create the database (production mode is fine).
4. Publish `firestore.rules`:
   - easiest: Firestore → Rules → paste the file contents → **Publish**
   - or with the Firebase CLI: `firebase deploy --only firestore:rules`
5. Push to `main`. Phones pick up the update on their next online launch.

Firebase web config values are public by design; the Firestore security rules protect the data.

### What the first launch does

- Tap **Continue with Google** and choose the account that owns the pump.
- If this account has no cloud hisab yet, the setup wizard opens:
  **Pump details → Partners → Storage & tanks → Dispensers & nozzles → Selling rates →
  Staff & bank (optional) → Review → Welcome**.
- At the end, the station is created in Firestore and all existing entries for that account are
  uploaded. The app then opens.
- On a new phone, signing in with the same Google account downloads that account's hisab
  automatically.

The first Google account that signs in on an upgraded phone claims the old single-device data.
After that, any other Google account starts with its own empty hisab — never the first account's
records.

### Offline behaviour

- The phone keeps working with no internet. Entries are stored locally and queued.
- Firebase Authentication keeps the signed-in session, so a parked phone still opens offline.
- When the internet returns, queued changes upload and remote changes stream in live.
- The app always uses the configured Firebase project; there is no “use without cloud” mode and no
  way to change the project from the app.

### Google sign-in in the Android APK

Google blocks OAuth inside embedded WebViews. The live web app opened in Chrome signs in normally.
If the APK shows **“disallowed_useragent”** (or the Google window closes immediately), the native
Google Sign-In plugin is required: `@capacitor-firebase/authentication` plus `google-services.json`
in `android/app/` and the APK signing SHA-1 added to the Firebase Android app. That is a native
change and needs a new APK build. The web app continues to work without it.

### Firestore layout

```
users/{uid}                    → { email, displayName, stationId }
stations/{uid}                 → { name, ownerUid, ownerEmail, createdAt }
stations/{uid}/settings/main   → settings + selling rates
stations/{uid}/{collection}/{docId}
                               → partners, tanks, nozzles, sales, purchases, expenses,
                                 staff, accounts, banks, cashEntries, ... (all app data)
stations/{uid}/tombstones/...  → deletion markers so deletes sync to other phones
```

The station ID is the owner's Firebase UID. Security rules only allow that signed-in user to read
or write the station and its subcollections. There are no extra rule lookup reads, so sync stays
inside the free Firestore quota for a normal station.

---

## How live updates work

- The Android app is a small Capacitor shell that opens the live GitHub Pages app.
- Every push to `main` runs two workflows:
  - **Deploy web app** — publishes the latest `index.html` to GitHub Pages.
  - **Build Android APK** — builds a fresh APK artifact.
- When the app opens online it fetches the newest page. A service worker keeps the last good
  version for offline use.
- **Settings → App updates → Check for updates** forces a refresh.
- Web updates never touch the saved data on the phone. Backups remain important.

### First launch needs internet

The app is served from GitHub Pages. The first online launch installs the offline cache and
downloads the Firebase SDK. Signing in also needs internet the first time.
After that, the last downloaded version and the signed-in session open without internet.

### Moving data from the old local file

The old `index.html` opened from a file used a different browser storage area than the GitHub
Pages app. To move your data:

1. Open the old file → **Settings → Download backup (JSON)**.
2. Open the new APK/live app → **Settings → Restore backup**.
3. Choose the JSON file.

---

## Updating the app in future

Edit `index.html` at the root (the single source of truth), then:

```bash
git add index.html
git commit -m "Update app"
git push origin main
```

GitHub Actions deploys the new version and builds a new APK. Phones pick up the web update on
their next online launch. The APK is only needed again if the native Android shell changes
(app icon, permissions, plugins, etc.).

---

## Project layout

```
index.html                    The entire app (UI, data, calculations, cloud sync, setup wizard)
firestore.rules               Firestore security rules (owner/member only)
firebase.json                 Lets the Firebase CLI deploy the rules
sw.js                         Service worker — offline cache + latest page
offline.html                  Shown when the phone has never loaded the app online
manifest.webmanifest          PWA metadata
capacitor.config.json         Android app config; loads the GitHub Pages URL
scripts/build-web.js          Copies index.html into www/ and stamps the build id
assets/                       App icons (generated)
android/                      Capacitor Android project
.github/workflows/pages.yml   Deploy the web app to GitHub Pages
.github/workflows/android.yml Build the APK artifact
```

### Local web preview

Open `index.html` directly for layout work. Google sign-in and Firestore need an `http://` or
`https://` origin, so use a small local server (or the live GitHub Pages app) when testing login.

### Local Android build

Needs Node 20+, JDK 21 and the Android SDK:

```bash
npm install
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```

The APK will be at `android/app/build/outputs/apk/debug/app-debug.apk`.
The easiest path is to let GitHub Actions build it.

---

## Data and backups

- Data is stored in `localStorage` on the phone and synced to Firestore.
- Use **Settings → Backup now** regularly and keep a copy on WhatsApp or Drive. Cloud sync is not
  a substitute for a backup.
- **Settings → Restore backup** brings everything back and uploads the restored data to the cloud.
- Clearing the Android app data or uninstalling the app removes the local copy; signing in again
  downloads it from Firestore.
- On the same phone, each Google account has a separate local database key, so switching accounts
  switches the whole hisab. Signing out never deletes that account's local copy.
- Using the app without signing in is only offered while Firebase is unconfigured, and keeps data
  on the device only.

> Firebase charges after the free daily quota. A normal pump station stays well inside the free
> Spark plan; see the Firebase pricing page if the station grows.

## Changing the hosting URL

If the repository is renamed or moved to another account, update `server.url` in
`capacitor.config.json` and the URL in `offline.html`, then push. Build a new APK only if the
native config changes.
