# Wurld Studio Firebase setup

The public portfolio is intentionally unchanged until the first CMS artwork is published. Existing static artwork remains a fallback if Firebase is not configured or the collection is empty.

## Firebase setup

1. Create a Firebase project, register a Web app, and copy its **web configuration** values to `firebase-config.js`. Do not paste service account credentials, admin SDK private keys, or passwords into the repository.
2. Enable **Authentication → Email/Password**, **Firestore Database**, and **Storage**. Select a supported paid plan if required for Cloud Storage in your region.
3. Paste `firestore.rules` into Firestore Rules and `storage.rules` into Storage Rules, then publish both.
4. In Authentication create the artist account. Copy its **UID**.
5. In Firestore create the document `admins/<ARTIST_UID>` with a field `role` = `artist` (string). Do this in the Firebase Console with project-owner privileges. Do not add a public admin-registration page.
6. Deploy the repository. Open `/admin.html`, sign in with the artist account and upload a painting. Check the public gallery. Note: changes on this branch must be merged and deployed before visiting the dashboard.

## Data model

`artworks/{id}`: title, description, year, medium, dimensions, price (NGN number), category (catalogue / featured / series), status (available / reserved / sold), published (boolean), sortOrder, imageUrl, imagePath, altText, createdAt, updatedAt.

`admins/{uid}`: created manually by the project owner, cannot be modified by web clients.

`enquiries/{id}`: incoming contact details, interest, message, linked artwork, status, createdAt. The public website currently retains its WhatsApp/email handoff; no visitor enquiries are written automatically to Firestore. The inbox is ready for a future opt-in submission flow with anti-spam measures.

## Security and operations

- Public clients may only read published artwork. Unpublished records require authenticated admin membership.
- Image uploads require an authenticated, allowlisted artist and supported image MIME types, max 10 MB.
- **Before production:** enable Firebase App Check, configure rate-limited enquiry submission through a trusted endpoint, review Firebase Storage billing, configure Firebase project budget alerts, validate rules in Firebase Emulator Suite, and back up Firestore and Storage.
- Avoid deleting images directly without checking references; deleting a record does not currently delete its uploaded image. Clean orphan uploads in the Firebase Storage Console when appropriate.
- Gallery migration: Add the existing artworks through the dashboard with their original titles and image paths. Once the first artwork is published, the CMS gallery replaces the static catalogue. To avoid a partial catalogue, publish all migrated artworks together.
