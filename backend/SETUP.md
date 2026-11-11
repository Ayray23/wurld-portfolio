# Artwork studio activation

Backend has not been provisioned. Choose the intended Supabase account and project before applying schema.sql. Never reuse an unrelated project's authentication configuration without review.

1. Inspect tables, then apply backend/schema.sql to the selected project. Run security advisors.
2. Configure Auth Site URL to https://wurld-portfolio.vercel.app and allow https://wurld-portfolio.vercel.app/admin as a redirect. Configure email delivery, disable open signup, and create/invite the painter's Auth account. The owner must authorise the verified Auth UUID by inserting into wurld_admins; there is no client-side membership enrolment. Do not commit passwords or service keys.
3. Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in the Vercel project and redeploy. The build only accepts a publishable key or legacy anon key, never a service key.
4. Verify anon reads only published, non-archived rows and images; ordinary authenticated users cannot write or grant membership; authorised admins can draft, publish, edit, mark sold, unpublish, archive and sign out. Test password recovery end to end with the painter.
5. Upload a test draft with multiple photos, verify anonymous access is denied, publish, verify in a separate logged-out browser, unpublish, verify it disappears. Private signed image URLs expire after five minutes; already downloaded images cannot be recalled. Public gallery refreshes every minute while visible and when returning to the tab.

The original PDF portfolio remains a static curated collection. Dashboard manages newly uploaded works. Original images are already public GitHub assets. Failed/unreferenced uploads stay private and can be cleaned later after confirming that no artwork references them. Archive is reversible by the database owner; no destructive client delete is provided.

No database access or upload success is claimed until live RLS and end-to-end checks pass.
