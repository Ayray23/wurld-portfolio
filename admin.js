import { auth, db, storage } from "./firebase-client.js";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { collection, doc, getDoc, onSnapshot, setDoc, deleteDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";
const $=s=>document.querySelector(s), login=$("#login"), app=$("#app"), setup=$("#setup");
const loginStatus=$("#login-status"), saveStatus=$("#save-status"), editor=$("#editor");
const text=(tag,value,cls)=>{const e=document.createElement(tag);e.textContent=value??"";if(cls)e.className=cls;return e};
let user=null,artworks=[],enquiries=[],stopArt=null,stopEnq=null,stopSettings=null;
let currentSettings={};
function resetListeners(){stopArt?.();stopEnq?.();stopSettings?.();stopArt=stopEnq=stopSettings=null}
function errorMessage(e){return (e?.message||String(e)).replace(/^Firebase:\s*/,"")}
if(!auth||!db||!storage){setup.hidden=false;login.hidden=true}
else {
 onAuthStateChanged(auth,async u=>{
  resetListeners();user=null;app.hidden=true;login.hidden=false;$("#logout").hidden=true;
  if(!u)return;
  try {
   const admin=await getDoc(doc(db,"admins",u.uid));
   if(!admin.exists()){loginStatus.textContent="This account is not approved for studio access.";await signOut(auth);return}
   user=u;login.hidden=true;app.hidden=false;$("#logout").hidden=false;loginStatus.textContent="";
   stopArt=onSnapshot(collection(db,"artworks"),snap=>{
     artworks=snap.docs.map(d=>({id:d.id,...d.data()}));
     artworks.sort((a,b)=>(Number(a.sortOrder)||0)-(Number(b.sortOrder)||0));
     renderArtworks();
   },e=>{$("#artwork-list").textContent="Unable to load artworks: "+errorMessage(e)});
   stopSettings=onSnapshot(doc(db,"settings","site"),snap=>{
    currentSettings=snap.exists()?snap.data():{};
    $("#setting-hero").value=currentSettings.hero||"";
    $("#setting-bio").value=currentSettings.bio||"";
    $("#setting-commission").value=currentSettings.commissionPrice??200000;
    $("#setting-whatsapp").value=currentSettings.whatsapp||"2349067792950";
    $("#setting-email").value=currentSettings.email||"adeniyiw123@gmail.com";
    $("#setting-catalogue-live").checked=Boolean(currentSettings.catalogueLive);
   },e=>{$("#settings-status").textContent="Unable to load website settings: "+errorMessage(e)});
   stopEnq=onSnapshot(collection(db,"enquiries"),snap=>{
    enquiries=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));renderEnquiries();
   },e=>{$("#enquiry-list").textContent="Unable to load enquiries: "+errorMessage(e)});
  }catch(e){loginStatus.textContent="Access verification failed: "+errorMessage(e);await signOut(auth)}
 });
 $("#login-form").addEventListener("submit",async e=>{
   e.preventDefault();loginStatus.textContent="Signing in...";
   try{await signInWithEmailAndPassword(auth,$("#email").value.trim(),$("#password").value)}
   catch(err){loginStatus.textContent=errorMessage(err)}
 });
 $("#logout").addEventListener("click",()=>signOut(auth));
}
function renderArtworks(){
 $("#total").textContent=artworks.length;$("#published").textContent=artworks.filter(x=>x.published).length;
 $("#available").textContent=artworks.filter(x=>x.status==="available").length;
 const needle=$("#search").value.toLowerCase().trim(), status=$("#status-filter").value;
 const shown=artworks.filter(w=>(!status||w.status===status)&&(!needle||(w.title||"").toLowerCase().includes(needle)));
 const list=$("#artwork-list");list.replaceChildren();
 if(!shown.length){list.append(text("p","No artworks match. Add a painting to get started."));return}
 shown.forEach(w=>{
  const item=text("article","","item");
  if(w.imageUrl){const img=document.createElement("img");img.src=w.imageUrl;img.alt=w.altText||w.title;img.loading="lazy";item.append(img)}
  const info=text("div","","info");info.append(text("h3",w.title),text("p",[w.category,w.status,w.published?"Published":"Draft",w.price!=null?"₦"+Number(w.price).toLocaleString("en-NG"):""].filter(Boolean).join(" · ")));item.append(info);
  const actions=text("div","","buttons");
  const edit=text("button","Edit");edit.addEventListener("click",()=>openEditor(w));actions.append(edit);
  const publish=text("button",w.published?"Unpublish":"Publish");publish.addEventListener("click",async()=>{
   publish.disabled=true;
   try{await updateDoc(doc(db,"artworks",w.id),{published:!w.published,updatedAt:serverTimestamp()})}
   catch(e){alert("Couldn't change visibility: "+errorMessage(e))}
   finally{publish.disabled=false}
  });actions.append(publish);
  const del=text("button","Delete","danger");del.addEventListener("click",async()=>{
   if(!confirm("Permanently delete the artwork record for "+w.title+"? Uploaded images are not deleted."))return;
   del.disabled=true;try{await deleteDoc(doc(db,"artworks",w.id))}catch(e){alert(errorMessage(e));del.disabled=false}
  });actions.append(del);item.append(actions);list.append(item);
 });
}
$("#search").addEventListener("input",renderArtworks);$("#status-filter").addEventListener("change",renderArtworks);
function openEditor(w){
 $("#artwork-form").reset();saveStatus.textContent="";$("#art-id").value=w?.id||"";
 $("#editor-title").textContent=w?"Edit artwork":"Add artwork";
 const fields={title:"title",year:"year",medium:"medium",dimensions:"dimensions",price:"price",status:"status",category:"category",order:"sortOrder",description:"description",alt:"altText",image:"imageUrl"};
 for(const [id,key] of Object.entries(fields)){const node=$("#art-"+id);if(w&&w[key]!=null)node.value=w[key]}
 $("#art-published").checked=Boolean(w?.published);
 editor.showModal();
}
$("#new").addEventListener("click",()=>openEditor(null));
$("#close-editor").addEventListener("click",()=>editor.close());
$("#cancel").addEventListener("click",()=>editor.close());
$("#artwork-form").addEventListener("submit",async e=>{
 e.preventDefault();if(!user)return;
 const button=$("#save");button.disabled=true;saveStatus.textContent="Saving...";
 try{
  const id=$("#art-id").value||crypto.randomUUID();
  const file=$("#art-file").files[0];let imageUrl=$("#art-image").value.trim(),imagePath=artworks.find(w=>w.id===id)?.imagePath||"";
  if(file){
   if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>10*1024*1024)throw new Error("Use a JPEG, PNG or WebP image under 10 MB.");
   const ext={"image/jpeg":"jpg","image/png":"png","image/webp":"webp"}[file.type];
   imagePath="artworks/"+user.uid+"/"+crypto.randomUUID()+"."+ext;
   saveStatus.textContent="Uploading image...";
   const destination=ref(storage,imagePath);
   await uploadBytes(destination,file,{contentType:file.type});
   imageUrl=await getDownloadURL(destination);
  }
  if(!imageUrl)throw new Error("Upload an artwork image or provide its URL.");
  if(!/^https:\/\//i.test(imageUrl)&&!imageUrl.startsWith("assets/"))throw new Error("Use an HTTPS image URL or an existing assets/ path.");
  const existing=artworks.find(w=>w.id===id);
  const data={
   title:$("#art-title").value.trim(),year:Number($("#art-year").value)||null,
   medium:$("#art-medium").value.trim(),dimensions:$("#art-dimensions").value.trim(),
   price:Number($("#art-price").value)||0,status:$("#art-status").value,
   category:$("#art-category").value,sortOrder:Number($("#art-order").value)||0,
   description:$("#art-description").value.trim(),altText:$("#art-alt").value.trim(),
   published:$("#art-published").checked,imageUrl,imagePath,
   updatedAt:serverTimestamp()
  };
  if(!existing)data.createdAt=serverTimestamp();
  await setDoc(doc(db,"artworks",id),data,{merge:true});
  editor.close();
 }catch(err){saveStatus.textContent=errorMessage(err)}
 finally{button.disabled=false}
});
function renderEnquiries(){
 $("#leads").textContent=enquiries.length;
 const list=$("#enquiry-list");list.replaceChildren();
 if(!enquiries.length){list.append(text("p","No saved enquiries yet. WhatsApp and email messages are handled in their own apps."));return}
 enquiries.forEach(q=>{
  const row=text("article","","item"),info=text("div","","info");
  info.append(text("h3",q.name||"Unknown"),text("p",(q.email||"")+" · "+(q.interest||"")+" · "+(q.status||"new")),text("p",q.message||""));
  row.append(info);
  const actions=text("div","","buttons");
  const statuses=["new","contacted","closed"];
  for(const status of statuses){const button=text("button",status);button.disabled=q.status===status;button.addEventListener("click",async()=>{
   try{await updateDoc(doc(db,"enquiries",q.id),{status})}catch(e){alert(errorMessage(e))}
  });actions.append(button)}
  const reply=text("a","Reply by email");reply.href="mailto:"+encodeURIComponent(q.email||"")+"?subject="+encodeURIComponent("Re: Wurld portfolio enquiry");reply.target="_blank";reply.rel="noopener";actions.append(reply);
  const del=text("button","Delete","danger");del.addEventListener("click",async()=>{if(!confirm("Delete this enquiry permanently?"))return;try{await deleteDoc(doc(db,"enquiries",q.id))}catch(e){alert(errorMessage(e))}});actions.append(del);
  row.append(actions);list.append(row);
 });
}
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>{
 document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active",t===b));
 $("#artworks-view").hidden=b.dataset.tab!=="artworks";$("#enquiries-view").hidden=b.dataset.tab!=="enquiries";$("#settings-view").hidden=b.dataset.tab!=="settings";
}));

const originalCatalogue=[
 {id:"legacy-series",imageUrl:"assets/image-74.webp",title:"Last Song of the Night",description:"A reflection on Wurld's journey, imagination and the beauty of life.",category:"series",sortOrder:0,year:2026,medium:"",dimensions:"",price:0},
 {id:"legacy-fashion",imageUrl:"assets/image-5.webp",title:"The Fashion",description:"An exploration of fashion, confidence and personal identity.",category:"featured",sortOrder:1,year:2026,medium:"Oil on canvas",dimensions:"20 × 30 in",price:500000},
 {id:"legacy-02",imageUrl:"assets/image-86.webp",title:"Artwork 02",description:"Original painting by Wurld.",category:"catalogue",sortOrder:2,year:2026,medium:"",dimensions:"",price:0},
 {id:"legacy-03",imageUrl:"assets/image-90.webp",title:"Artwork 03",description:"Original painting by Wurld.",category:"catalogue",sortOrder:3,year:2026,medium:"",dimensions:"",price:0},
 {id:"legacy-04",imageUrl:"assets/image-94.webp",title:"Artwork 04",description:"Original painting by Wurld.",category:"catalogue",sortOrder:4,year:2026,medium:"",dimensions:"",price:0}
];
$("#import-original").addEventListener("click",async()=>{
 if(!user||!confirm("Import the five existing portfolio works? Existing imported records will be skipped."))return;
 const button=$("#import-original");button.disabled=true;button.textContent="Importing...";
 try{
  for(const w of originalCatalogue){
   const reference=doc(db,"artworks",w.id);
   if((await getDoc(reference)).exists())continue;
   await setDoc(reference,{...w,altText:w.title,imagePath:"",status:"available",published:true,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
  }
  await setDoc(doc(db,"settings","site"),{...currentSettings,hero:currentSettings.hero||"",bio:currentSettings.bio||"",commissionPrice:currentSettings.commissionPrice??200000,whatsapp:currentSettings.whatsapp||"2349067792950",email:currentSettings.email||"adeniyiw123@gmail.com",catalogueLive:true,updatedAt:serverTimestamp()});
  alert("Original artwork gallery imported and CMS catalogue activated.");
 }catch(e){alert("Migration stopped: "+errorMessage(e))}
 finally{button.disabled=false;button.textContent="Import original gallery"}
});

$("#settings-form").addEventListener("submit",async event=>{
 event.preventDefault();if(!user)return;
 const status=$("#settings-status"),whatsapp=$("#setting-whatsapp").value.replace(/\D/g,""),email=$("#setting-email").value.trim();
 if(!/^\d{9,16}$/.test(whatsapp)){status.textContent="Enter a valid international WhatsApp number (digits only).";return}
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){status.textContent="Enter a valid contact email.";return}
 const button=event.submitter;button.disabled=true;status.textContent="Saving site settings...";
 try{
  await setDoc(doc(db,"settings","site"),{
   hero:$("#setting-hero").value.trim(),bio:$("#setting-bio").value.trim(),
   commissionPrice:Number($("#setting-commission").value)||0,whatsapp,email,
   catalogueLive:$("#setting-catalogue-live").checked,
   updatedAt:serverTimestamp()
  });
  status.textContent="Website settings saved and published.";
 }catch(e){status.textContent=errorMessage(e)}
 finally{button.disabled=false}
});

function csvExport(filename,columns,items){
 const escape=value=>'"'+String(value??"").replaceAll('"','""').replace(/\r?\n/g," ")+'"';
 const rows=[columns.map(escape).join(","),...items.map(row=>columns.map(key=>escape(row[key])).join(","))];
 const file=new Blob(["\uFEFF"+rows.join("\r\n")],{type:"text/csv;charset=utf-8"});
 const url=URL.createObjectURL(file),link=document.createElement("a");
 link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$("#export-artworks").addEventListener("click",()=>csvExport("wurld-artworks.csv",
 ["id","title","year","medium","dimensions","price","category","status","published","sortOrder","imageUrl","description"],artworks));
$("#export-enquiries").addEventListener("click",()=>csvExport("wurld-enquiries.csv",
 ["id","name","email","interest","message","artworkId","status"],
 enquiries.map(({createdAt,...rest})=>rest)));
