# Wurld Studio — deployment and operations

## Included features

- Original responsive portfolio design, lightbox, gallery filters, WhatsApp and email enquiry draft workflows.
- Firebase Authentication with manual approved-artist allowlist.
- Artist dashboard at `/admin.html`: create/edit/delete paintings, image upload, prices, year, category, description, availability, draft/published state, sort order and artwork search.
- One-click migration of the five existing artworks.
- Editable public hero introduction, biography intro, commission starting price, WhatsApp contact, email and live-gallery setting.
- Dynamic published art catalogue, featured painting, and series highlight.
- Collector inbox with request statuses: new, contacted and closed.
- App Check-protected Cloud Function for public website enquiries, with request validation and per-IP hourly rate limit.
- Static fallback if Firebase configuration is missing.
- JavaScript syntax/build tests and Firestore Emulator authorization tests in GitHub Actions.

## 1. Configure Firebase

1. Create a Firebase project, register a Web App.
2. Enable **Authentication → Email/Password**. Add the website's Vercel hostname in Authentication → Settings → Authorized domains.
3. Create **Firestore Database** and **Cloud Storage**. Check that your Firebase plan supports Storage and Cloud Functions before provisioning; paid usage/billing may be required.
4. In **Vercel → Project → Settings → Environment Variables**, enter:
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_STORAGE_BUCKET`
   - `FIREBASE_MESSAGING_SENDER_ID`
   - `FIREBASE_APP_ID`
   All six values are from Firebase Project Settings → Your apps → Web App. These values are not service-account secrets.
5. For secure website inbox, create a Firebase App Check **reCAPTCHA v3** provider for the Web App. Register the deployed domain, obtain its public site key and set `FIREBASE_APPCHECK_SITE_KEY` in Vercel. **Enforce App Check for Cloud Functions**, and consider enforcing it for Firestore and Storage once testing is complete. The studio inbox button is hidden until this key is configured.
6. Redeploy Vercel. Build script `scripts/build.mjs` generates `dist/firebase-config.js` from environment variables. No private key or password goes into the browser bundle.

## 2. Firebase rules & Cloud Function

From a machine with Firebase CLI:
```bash
npm install -g firebase-tools
firebase login
firebase use --add
cd functions && npm install && cd ..
firebase deploy --only firestore:rules,storage,functions
```
The deployment references `firebase.json`, `firestore.rules`, `storage.rules` and `functions/index.js`. **Review and emulator-test the rules first.** Set up Firestore TTL on `enquiryRateLimits.expiresAt` to clean the hourly limit records. If TTL is not enabled the records remain until removed manually.

## 3. Create the approved artist account

1. In Firebase Authentication create an Email/Password user for Wurld.
2. Copy the exact user UID.
3. In Firestore manually create `admins/<UID>` with `role: "artist"` (string).
4. Open `https://YOUR-DOMAIN/admin.html`. Sign in with that account. All other accounts are denied.
5. Use **Import original gallery** once. This brings the current five artworks into Firestore and activates the live catalogue.
6. Replace generic artwork titles and enrich descriptions, image alternatives, dimensions and pricing. Upload new artworks and publish when ready.

**Never** add client-side admin signup or allow the browser to write `admins/{uid}`.

## 4. Public enquiries

The WhatsApp and email buttons work with or without Firebase and let the visitor send a message in their chosen app. With Cloud Functions + App Check configured, the **Send to studio inbox** button stores a new enquiry in Firestore for the artist dashboard.

Only backend Admin SDK can create an enquiry. Firestore rules intentionally deny direct browser creates. Callable function checks name/email/message, hidden honeypot, App Check token and a hashed-IP hourly limit. This is a basic anti-abuse layer, not a substitute for monitoring and more advanced spam protection as traffic grows.

## 5. Test and release

Run locally with Node.js 22:
```bash
npm run check
```
This runs static regression tests and builds `dist/`. For a complete end-to-end release, also test against a staging Firebase project or Firebase emulators:

1. Unapproved signed-in user cannot access `artworks` drafts, admin records, settings writes or uploads.
2. Signed-out visitor can read only published art; unpublished art never appears in the gallery.
3. Approved artist can upload a JPEG, PNG and WebP under 10MB, and rejects other MIME types/oversized files.
4. Gallery filters, lightbox/share deep links, featured artwork and category ordering work on desktop and mobile.
5. Website enquiries create records only with valid App Check tokens; invalid input and spam are rejected.
6. Artist can read and update enquiry status; visitor cannot read enquiries.
7. Unpublish all art after activating live catalogue and verify that static pieces do not reappear.
8. Confirm Vercel build and Firebase permissions before merging to `main`.

## Operational notes

- The `published` switch controls catalogue visibility. If `catalogueLive` is false and there are no published records, the old static gallery is retained.
- Cloud Functions automatically remove storage images when their artwork is deleted or its image is replaced, for files uploaded through this dashboard. Original static assets and manually entered external image URLs are not deleted. Verify the cleanup triggers are deployed with the other functions.
- Set Firebase billing alerts and enable backups / periodic exports. Firebase budget alerts do not automatically cap spending.
- Firebase Web App configuration is safe to expose; service-account keys and private tokens are **not**.
- No Firebase project, privileged artist identity, actual email delivery or hosted production release is generated automatically by these source-code changes.
