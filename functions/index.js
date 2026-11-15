import { onCall, HttpsError } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { onDocumentDeleted, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { createHash } from "node:crypto";

initializeApp();
const store=getFirestore();
const isText=(v,min,max)=>typeof v==="string"&&v.trim().length>=min&&v.trim().length<=max;
export const submitEnquiry=onCall({
 region:"europe-west1",enforceAppCheck:true,maxInstances:10,
 memory:"256MiB",timeoutSeconds:15
},async request=>{
 const raw=request.data||{};
 if(raw.website)throw new HttpsError("invalid-argument","Invalid submission");
 if(raw.consent!==true)throw new HttpsError("failed-precondition","Consent is required");
 if(!isText(raw.name,2,100)||!isText(raw.email,5,254)||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.email)||
    !isText(raw.interest,2,120)||!isText(raw.message,10,2000)||
    (raw.artworkId&&!isText(raw.artworkId,1,160)))
   throw new HttpsError("invalid-argument","Complete all required enquiry fields");
 const ip=String(request.rawRequest.ip||"unknown");
 const windowHour=Math.floor(Date.now()/3600000);
 const key=createHash("sha256").update(ip+":"+windowHour).digest("hex");
 const rateDoc=store.collection("enquiryRateLimits").doc(key);
 const contact=store.collection("enquiries").doc();
 await store.runTransaction(async transaction=>{
  const rate=await transaction.get(rateDoc);
  const count=rate.exists?Number(rate.data().count||0):0;
  if(count>=3)throw new HttpsError("resource-exhausted","Too many messages. Please use WhatsApp or try again later.");
  transaction.set(rateDoc,{count:count+1,expiresAt:new Date(Date.now()+7200000)},{merge:true});
  transaction.create(contact,{
    name:raw.name.trim(),email:raw.email.trim().toLowerCase(),
    interest:raw.interest.trim(),message:raw.message.trim(),
    artworkId:String(raw.artworkId||"").trim(),status:"new",consentAt:FieldValue.serverTimestamp(),createdAt:FieldValue.serverTimestamp()
  });
 });
 return {success:true,id:contact.id};
});

async function cleanReplacedImage(path) {
 if(typeof path!=="string"||!/^artworks\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)$/.test(path))return;
 try{await getStorage().bucket().file(path).delete({ignoreNotFound:true})}
 catch(error){console.warn("Artwork image cleanup failed:",path,error.message)}
}
export const deleteArtworkImage=onDocumentDeleted({
 document:"artworks/{artworkId}",region:"europe-west1"
},async event=>{
 const artwork=event.data?.data();
 await cleanReplacedImage(artwork?.imagePath);
});
export const removeOldArtworkImage=onDocumentUpdated({
 document:"artworks/{artworkId}",region:"europe-west1"
},async event=>{
 const before=event.data?.before.data(),after=event.data?.after.data();
 if(before?.imagePath&&before.imagePath!==after?.imagePath)
  await cleanReplacedImage(before.imagePath);
});
