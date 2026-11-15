// Replace these values with the Web app configuration from Firebase Console.
// Firebase web configuration is public; NEVER put service-account keys here.
export const firebaseConfig = {
  apiKey: "REPLACE_WITH_FIREBASE_API_KEY",
  authDomain: "REPLACE_WITH_PROJECT.firebaseapp.com",
  projectId: "REPLACE_WITH_PROJECT_ID",
  storageBucket: "REPLACE_WITH_PROJECT.firebasestorage.app",
  messagingSenderId: "REPLACE_WITH_MESSAGING_SENDER_ID",
  appId: "REPLACE_WITH_APP_ID"
};
export const firebaseConfigured = !Object.values(firebaseConfig).some(v => String(v).startsWith("REPLACE_WITH"));
