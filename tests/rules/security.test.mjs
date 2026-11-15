import test,{before,after} from "node:test";
import {readFileSync} from "node:fs";
import {initializeTestEnvironment,assertSucceeds,assertFails} from "@firebase/rules-unit-testing";
import {doc,setDoc,getDoc,getDocs,updateDoc,collection,query,where} from "firebase/firestore";
import {ref,uploadString} from "firebase/storage";
let env;
const projectId="demo-wurld";
const art={
 title:"The Fashion",description:"Portrait",year:2026,medium:"Oil",
 dimensions:"20 x 30 in",price:500000,category:"featured",status:"available",
 published:true,sortOrder:0,imageUrl:"assets/image-5.webp",imagePath:"",
 altText:"Fashion portrait",createdAt:0,updatedAt:0
};
before(async()=>{
 env=await initializeTestEnvironment({
  projectId,
  firestore:{rules:readFileSync(new URL("../../firestore.rules",import.meta.url),"utf8")},
  storage:{rules:readFileSync(new URL("../../storage.rules",import.meta.url),"utf8")}
 });
 await env.withSecurityRulesDisabled(async ctx=>{
  const db=ctx.firestore();
  await setDoc(doc(db,"admins","artist-uid"),{role:"artist"});
  await setDoc(doc(db,"artworks","published"),art);
  await setDoc(doc(db,"artworks","draft"),{...art,published:false,title:"Secret painting"});
  await setDoc(doc(db,"settings","site"),{
   hero:"Hope",bio:"Wurld",commissionPrice:200000,whatsapp:"2349067792950",
   email:"artist@example.com",catalogueLive:true
  });
  await setDoc(doc(db,"enquiries","one"),{name:"Collector",message:"Interested in art",status:"new"});
 });
});
after(async()=>{await env?.cleanup()});
test("anonymous visitor sees published works and can query published gallery",async()=>{
 const db=env.unauthenticatedContext().firestore();
 await assertSucceeds(getDoc(doc(db,"artworks","published")));
 await assertFails(getDoc(doc(db,"artworks","draft")));
 await assertSucceeds(getDocs(query(collection(db,"artworks"),where("published","==",true))));
 await assertFails(getDocs(collection(db,"artworks")));
});
test("unapproved user cannot manage artworks or read private data",async()=>{
 const db=env.authenticatedContext("visitor").firestore();
 await assertFails(getDoc(doc(db,"artworks","draft")));
 await assertFails(updateDoc(doc(db,"artworks","published"),{title:"Changed"}));
 await assertFails(getDoc(doc(db,"enquiries","one")));
 await assertFails(setDoc(doc(db,"admins","visitor"),{role:"artist"}));
});
test("approved artist can manage artworks and enquiries, but cannot add admins",async()=>{
 const db=env.authenticatedContext("artist-uid").firestore();
 await assertSucceeds(getDoc(doc(db,"artworks","draft")));
 await assertSucceeds(updateDoc(doc(db,"artworks","draft"),{title:"Updated title"}));
 await assertSucceeds(getDoc(doc(db,"enquiries","one")));
 await assertSucceeds(updateDoc(doc(db,"enquiries","one"),{status:"contacted"}));
 await assertFails(setDoc(doc(db,"admins","other-uid"),{role:"artist"}));
});
test("site settings are public but only the artist can edit",async()=>{
 const guest=env.unauthenticatedContext().firestore(),artist=env.authenticatedContext("artist-uid").firestore();
 await assertSucceeds(getDoc(doc(guest,"settings","site")));
 await assertFails(updateDoc(doc(guest,"settings","site"),{hero:"Fake"}));
 await assertSucceeds(updateDoc(doc(artist,"settings","site"),{hero:"New introduction"}));
});
test("website enquiries are created on trusted backend only",async()=>{
 const guest=env.unauthenticatedContext().firestore();
 await assertFails(setDoc(doc(guest,"enquiries","spam"),{
  name:"Spammer",email:"x@example.com",interest:"Art",message:"Buy all art now",artworkId:"",status:"new"
 }));
});

test("storage uploads require artist approval and permitted image type",async()=>{
 const artistStorage=env.authenticatedContext("artist-uid").storage();
 const visitorStorage=env.authenticatedContext("visitor").storage();
 const publicStorage=env.unauthenticatedContext().storage();
 const name="artworks/artist-uid/test-123.webp";
 await assertSucceeds(uploadString(ref(artistStorage,name),"test image","raw",{contentType:"image/webp"}));
 await assertFails(uploadString(ref(visitorStorage,"artworks/visitor/test.jpg"),"test image","raw",{contentType:"image/jpeg"}));
 await assertFails(uploadString(ref(artistStorage,"artworks/artist-uid/unsafe.svg"),"<svg/>","raw",{contentType:"image/svg+xml"}));
 await assertFails(uploadString(ref(publicStorage,"artworks/artist-uid/anonymous.jpg"),"test image","raw",{contentType:"image/jpeg"}));
});
