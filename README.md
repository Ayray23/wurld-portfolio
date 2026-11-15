# Wurld — Artist Portfolio & Studio CMS

Live public portfolio: https://wurld-portfolio.vercel.app/

Wurld is an artist portfolio with a secure, private Firebase content-management dashboard. The existing public HTML/CSS design remains unchanged. Artist management is available at `/admin.html` after Firebase is configured.

## Features
- Artist biography, painting process, featured work, series and gallery.
- Artwork lightbox, share links, gallery filters, WhatsApp/email collector enquiries.
- Private dashboard with authenticated artist-only access, artwork CRUD, original gallery import, file uploads, prices, categories, availability, publishing and sorting.
- Editable portfolio introduction, biography, contact details and commission starting price.
- Secure studio enquiry inbox, status management, CSV exports and privacy notice.
- Firestore/Storage security rules, App Check protection on enquiry Cloud Function, rate-limiting and automatic cleanup of replaced/deleted media.
- Static HTML fallback if Firebase environment variables are not configured.

## Frontend and backend
Frontend is vanilla HTML, CSS and JavaScript on Vercel. Backend is Firebase Auth, Firestore, Cloud Storage and Cloud Functions. Production browser configuration is generated at Vercel build time from environment variables.

## Local build and checks
Requires Node.js 22 or newer:
```bash
npm run check
```
This validates JavaScript syntax, runs structural regression tests and builds `dist/`.

Firestore Security Rules are tested in the Firebase Emulator Suite with:
```bash
cd tests/rules
npm install
npm run test:rules
```

## Configuration
Follow **[CMS_SETUP.md](./CMS_SETUP.md)** for Firebase, Vercel environment variables, App Check, approved-artist account creation, deployment and release tests.

Do not commit Firebase service-account secrets, passwords, or `.env` files.

## Release
All CMS changes are developed on `feature/artist-cms-firebase`. Review and test on staging before merging into the `main` branch, since a real Firebase project and artist identity must be configured separately.
