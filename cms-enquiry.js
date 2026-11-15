import { functions } from "./firebase-client.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-functions.js";
const form=document.querySelector("#enquiry-form");
const status=document.querySelector("#form-status");
const studioButton=document.querySelector("#submit-studio");
if(!functions){studioButton.hidden=true}
else {
 form.addEventListener("submit",async event=>{
  if(event.submitter?.value!=="studio")return;
  event.preventDefault();
  if(!form.reportValidity())return;
  const email=form.querySelector('[name="email"]').value.trim();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
   status.textContent="Enter a valid email so the artist can reply to your enquiry.";return;
  }
  const data=new FormData(form);studioButton.disabled=true;
  status.textContent="Sending your enquiry securely...";
  try{
   await httpsCallable(functions,"submitEnquiry")({
    name:String(data.get("name")||"").trim(),email,
    interest:String(data.get("interest")||""),
    message:String(data.get("message")||"").trim(),
    artworkId:"",website:String(data.get("website")||"")
   });
   status.textContent="Your enquiry was received by Wurld Studio. You can expect a reply using the email provided.";
   form.reset();
  }catch(error){
   status.textContent="The studio inbox could not receive your message. Please use the WhatsApp or email buttons instead. ("+(error.code||"Unavailable")+")";
  }finally{studioButton.disabled=false}
 });
}
