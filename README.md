# Ghufran Khalil Petroleum Pump

A complete, offline-first fuel station hisab app for **Ghufran Khalil Petroleum Pump**.
It runs as a normal web page, installs as an Android APK, and updates itself from GitHub
without reinstalling the APK.

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

The app is served from GitHub Pages. The first online launch installs the offline cache.
After that, the last downloaded version opens without internet.

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
index.html                    The entire app (UI, data, calculations)
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

Open `index.html` directly in a browser. No build needed for normal development.

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

- Data is stored in the browser/WebView `localStorage` on the phone.
- Use **Settings → Download backup (JSON)** regularly and keep a copy on WhatsApp or Drive.
- **Settings → Restore backup** brings everything back.
- Clearing the Android app data or uninstalling the app removes the local data.

## Changing the hosting URL

If the repository is renamed or moved to another account, update `server.url` in
`capacitor.config.json` and the URL in `offline.html`, then push. Build a new APK only if the
native config changes.
