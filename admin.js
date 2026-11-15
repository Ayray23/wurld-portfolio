import { auth, db, storage } from "./firebase-client.js";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { collection, doc, getDoc, onSnapshot, setDoc, deleteDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";
const $=s=>document.querySelector(s), login=$("#login"), app=$("#app"), setup=$("#setup");
const loginStatus=$("#login-status"), saveStatus=$("#save-status"), editor=$("#editor");
const text=(tag,value,cls)=>{const e=document.createElement(tag);e.textContent=value??"";if(cls)e.className=cls;return e};
let user=null,artworks=[],enquiries=[],stopArt=null,stopEnq=null;
function resetListeners(){stopArt?.();stopEnq?.();stopArt=stopEnq=null}
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
  row.append(actions);list.append(row);
 });
}
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>{
 document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active",t===b));
 $("#artworks-view").hidden=b.dataset.tab!=="artworks";$("#enquiries-view").hidden=b.dataset.tab!=="enquiries";
}));
