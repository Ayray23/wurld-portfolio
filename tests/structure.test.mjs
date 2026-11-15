import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("preserves public portfolio and essential gallery controls",()=>{
 const html=read("index.html");
 for(const section of ['id="artist"','id="practice"','id="work"','id="collect"','id="commission"','id="contact"','id="lightbox"'])assert.ok(html.includes(section),section);
 for(const file of ["app.js","style.css","assets/image-5.webp"])assert.ok(existsSync(new URL("../"+file,import.meta.url)),file);
});
test("dashboard has sign-in, artwork editing and inbox",()=>{
 const html=read("admin.html");
 for(const id of ['id="login-form"','id="artwork-form"','id="artwork-list"','id="enquiry-list"'])assert.ok(html.includes(id),id);
});
test("no admin secrets in Firebase browser configuration",()=>{
 assert.doesNotMatch(read("firebase-config.js"),/-----BEGIN PRIVATE KEY-----/);
 assert.doesNotMatch(read("firebase-client.js"),/serviceAccountKey/);
});
test("security rules default deny unspecified documents",()=>{
 assert.match(read("firestore.rules"),/match \/\{document=\*\*\} \{ allow read,write: if false; \}/);
 assert.match(read("firestore.rules"),/match \/admins\/\{uid\}/);
});
