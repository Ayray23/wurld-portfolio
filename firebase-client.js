import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";
import { firebaseConfig, firebaseConfigured, appCheckSiteKey } from "./firebase-config.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app-check.js";
import { getFunctions } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-functions.js";
export const app = firebaseConfigured ? (getApps()[0] || initializeApp(firebaseConfig)) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;

if (app && appCheckSiteKey) initializeAppCheck(app,{
 provider:new ReCaptchaV3Provider(appCheckSiteKey),isTokenAutoRefreshEnabled:true
});
export const functions = app && appCheckSiteKey ? getFunctions(app,"europe-west1") : null;
