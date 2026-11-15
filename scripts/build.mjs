import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
const root=resolve(import.meta.dirname,".."),dist=resolve(root,"dist");
rmSync(dist,{recursive:true,force:true});mkdirSync(dist,{recursive:true});
for(const name of ["index.html","admin.html","style.css","admin.css","app.js","admin.js","cms-public.js","cms-enquiry.js","firebase-client.js"]){
 if(!existsSync(resolve(root,name)))throw new Error("Missing public file: "+name);
 cpSync(resolve(root,name),resolve(dist,name));
}
if(existsSync(resolve(root,"assets")))cpSync(resolve(root,"assets"),resolve(dist,"assets"),{recursive:true});
const names=["FIREBASE_API_KEY","FIREBASE_AUTH_DOMAIN","FIREBASE_PROJECT_ID","FIREBASE_STORAGE_BUCKET","FIREBASE_MESSAGING_SENDER_ID","FIREBASE_APP_ID"];
const config={
 apiKey:process.env.FIREBASE_API_KEY||"",
 authDomain:process.env.FIREBASE_AUTH_DOMAIN||"",
 projectId:process.env.FIREBASE_PROJECT_ID||"",
 storageBucket:process.env.FIREBASE_STORAGE_BUCKET||"",
 messagingSenderId:process.env.FIREBASE_MESSAGING_SENDER_ID||"",
 appId:process.env.FIREBASE_APP_ID||""
};
const complete=names.every(n=>Boolean(process.env[n]));
if(!complete)console.warn("Firebase environment not configured: static public gallery will remain available; admin sign-in will be disabled.");
writeFileSync(resolve(dist,"firebase-config.js"),
 "// Generated from Vercel environment variables. These Firebase Web App values are public.\n"+
 "export const firebaseConfig = "+JSON.stringify(config,null,2)+";\n"+
 "export const firebaseConfigured = "+String(complete)+";\n");
console.log("Built Wurld Portfolio to dist/");
