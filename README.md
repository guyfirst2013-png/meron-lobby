# Lobby Screen — setup guide

Two web pages, one shared database:

| Page | Who opens it | What it is |
|---|---|---|
| `index.html` | The TV (Samsung 50DU7100 browser) | The display, 1920×1080, Hebrew RTL |
| `control.html` | The client's phone | The control app (installable on the home screen) |

Changes made on the phone appear on the TV within about a second.

---

## Try it now (demo mode, no setup)

While `js/firebase-config.js` still says `PASTE_HERE`, both pages run in **demo mode**: data is kept only in that browser.
Open `control.html` and `index.html` in two tabs of the same browser (Chrome/Edge), edit in one, and watch the other.
*Note: Chrome only shares demo data between tabs when the files are served from the same address. If double-clicking the files doesn't sync, use the hosted version (step 3) or any local server.*

---

## 1. Create the Firebase project (about 5 minutes, free)

1. Go to <https://console.firebase.google.com> → **Add project** → name it (e.g. `lobby-screen`) → you can turn off Google Analytics → **Create**.
2. **Build → Realtime Database → Create database** → location **europe-west1 (Belgium)** → start in **locked mode**.
3. In the database page open the **Rules** tab, paste the contents of `database.rules.json`, and replace `CLIENT_EMAIL_HERE` with the client's login email. To let yourself edit too:
   ```
   ".write": "auth != null && (auth.token.email === 'client@example.com' || auth.token.email === 'you@example.com')"
   ```
   Click **Publish**.
4. **Build → Authentication → Get started → Email/Password → Enable → Save.**
   Then **Users → Add user** and enter the client's email and a password (plus yours if you added it above).
5. **Project settings (gear) → General → Your apps → Web (`</>`)** → register an app (no hosting needed) → copy the `firebaseConfig` values into `js/firebase-config.js` (`apiKey`, `authDomain`, `databaseURL`, `projectId`, `appId`).
   The `databaseURL` is shown at the top of the Realtime Database page.

> The free (Spark) plan covers this comfortably: 1 GB stored and 10 GB/month downloaded. Images are resized on the phone before upload (backgrounds about 250 KB each).

## 2. Put the site online

The TV and phone need an internet address. The simplest free option:

**Netlify Drop:** go to <https://app.netlify.com/drop>, sign up, and drag this whole folder onto the page. You get an address like `https://lobby-xyz.netlify.app`.
After any code change, drag the folder again (Site → Deploys → drag and drop).

Then:
- TV: `https://<your-site>/` (or `/index.html`)
- Phone app: `https://<your-site>/control.html`

You can rename the site in Netlify (Site configuration → Change site name), e.g. `meron-lobby.netlify.app`.

## 3. Install the app on the client's phone

Open `https://<your-site>/control.html` and sign in with the email and password from step 1.4.
- **Android (Chrome):** menu ⋮ → **Add to Home screen / Install app**.
- **iPhone (Safari):** Share → **Add to Home Screen**.

It opens full screen with its own icon, like a normal app.

## 4. Set up the TV (Samsung 50DU7100)

1. Open the **Internet** app → go to `https://<your-site>/` → add it to bookmarks (and set it as the home page in the browser settings).
2. Press any remote button on the page; it tries to switch to full screen. If not, use the browser menu → **Full screen**.
3. Prevent sleep: **Settings → General & Privacy → Power and Energy Saving** → turn off **Auto Power Off** and **Energy saving / Eco** options, and set **Screen saver** off (menu names vary slightly).
4. The page reloads itself every night at 04:00, so it never goes stale.

**Recommended for a lobby:** a consumer Samsung TV can't open a web page automatically after a power cut. For hands-free reliability, plug in an Android TV / Fire TV stick with a kiosk-browser app (e.g. "Fully Kiosk Browser") set to open the site on boot.

---

## What the client can do from the phone

- **Screen tab:** show/hide each element (logo, date/weather panel, main title, messages, corner text), edit the main title and the corner text, and replace or remove the logo (one image, like a profile picture).
- **Messages tab:** add, edit, hide, reorder and delete messages (title + text + icon). When there are too many for one screen, they split into pages that rotate automatically.
- **Backgrounds tab:** choose a fixed background or a rotating one, upload photos from the phone (several at once), delete unwanted ones, set the rotation interval and how much to darken the background.
- **Info tab:** choose which parts of the date panel to show (time, civil date, Hebrew date, weather, holidays and weekly Torah portion), pick the weather city, and adjust overall text size.

Five calm built-in backgrounds (in `backgrounds/`) are always available and can't be deleted.

## Files

```
index.html             TV display
control.html           phone control app
js/firebase-config.js  ← paste your Firebase settings here
js/store.js            data layer (Firebase / demo)
js/info.js             Hebrew date, holidays (Hebcal), weather (Open-Meteo)
js/icons.js            message icons
backgrounds/           built-in backgrounds
database.rules.json    security rules to paste into Firebase
manifest.webmanifest, sw.js, icons/   make the phone app installable
```

External services used (free, no keys): Hebcal.com (Hebrew date, holidays, parasha), Open-Meteo (weather), Google Fonts.
