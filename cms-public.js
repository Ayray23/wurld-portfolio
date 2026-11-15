import { db } from "./firebase-client.js";
import { collection, doc, onSnapshot, query, where } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
const gallery=document.querySelector("#collect .gallery");
const count=document.querySelector("#gallery-count");
const originalGallery=gallery.innerHTML;
const fmt=new Intl.NumberFormat("en-NG",{style:"currency",currency:"NGN",maximumFractionDigits:0});
let currentWorks=[],settings={},artworkLoaded=false,dynamic=false;
const el=(tag,name,value)=>{
 const node=document.createElement(tag);
 if(name)node.className=name;
 if(value!=null)node.textContent=String(value);
 return node;
};
function renderGallery(){
 if(!artworkLoaded)return;
 const works=currentWorks;
 const activate=works.length>0||settings.catalogueLive===true;
 if(!activate){
  if(dynamic){gallery.innerHTML=originalGallery;dynamic=false;window.WurldPortfolio?.restoreWorks()}
  return;
 }
 dynamic=true;
 const cards=document.createDocumentFragment();
 for(const w of works){
  if(!w.imageUrl)continue;
  const category=["featured","catalogue","series"].includes(w.category)?w.category:"catalogue";
  const card=el("article","card");card.dataset.category=category;
  const imageBtn=el("button","art-open");imageBtn.type="button";imageBtn.dataset.cmsId=w.id;
  imageBtn.setAttribute("aria-label","View "+w.title);
  const img=el("img");img.src=w.imageUrl;img.alt=w.altText||w.title;img.loading="lazy";
  imageBtn.append(img);
  card.append(imageBtn,el("div","label",category.toUpperCase()),el("h3","art-title",w.title),
   el("p","art-note",[w.year,w.medium,w.price?fmt.format(w.price):"Price on enquiry",w.status==="sold"?"Sold":w.status==="reserved"?"Reserved":null].filter(Boolean).join(" · ")));
  const details=el("button","text-link details-trigger","View artwork & enquire ↗");
  details.type="button";details.dataset.cmsId=w.id;card.append(details);cards.append(card);
 }
 gallery.replaceChildren(cards);
 if(!works.length)gallery.append(el("p","catalogue-empty","No paintings are currently available to view. Contact Wurld for more information."));
 window.WurldPortfolio?.setWorks(works.map(w=>({
  id:w.id,image:w.imageUrl,title:w.title,description:w.description||"",
  facts:[["Year",w.year],["Medium",w.medium],["Size",w.dimensions],["Price",w.price?fmt.format(w.price):"On enquiry"],["Status",w.status||"available"]].filter(([_,v])=>v!=null&&v!=="")
 })));
 const filter=document.querySelector(".filter.active")?.dataset.filter||"all";
 let visible=0;
 gallery.querySelectorAll(".card").forEach(card=>{
  card.hidden=filter!=="all"&&card.dataset.category!==filter;
  if(!card.hidden)visible++;
 });
 count.textContent=visible+" "+(visible===1?"work":"works");
 renderFeatured(works);
}
function renderFeatured(works){
 const featured=works.find(w=>w.category==="featured"&&w.imageUrl);
 if(featured){
  const section=document.querySelector("#work .featured");
  const open=section?.querySelector(".art-open"),img=open?.querySelector("img");
  if(open&&img){open.dataset.image=featured.imageUrl;open.setAttribute("aria-label","View "+featured.title);img.src=featured.imageUrl;img.alt=featured.altText||featured.title}
  const title=section?.querySelector("h2");if(title)title.textContent=featured.title;
  const dl=section?.querySelector("dl");
  if(dl){
   dl.replaceChildren();
   for(const [key,value] of [["Year",featured.year],["Medium",featured.medium],["Size",featured.dimensions],["Price",featured.price?fmt.format(featured.price):"On enquiry"]]){
    if(value==null||value==="")continue;
    const row=el("div"),dt=el("dt",null,key.toUpperCase()),dd=el("dd",null,value);row.append(dt,dd);dl.append(row);
   }
  }
  const paragraph=section?.querySelector("dl + p");if(paragraph)paragraph.textContent=featured.description||"Enquire directly with Wurld for more information.";
  const enquiry=section?.querySelector("a.button");if(enquiry)enquiry.href="https://wa.me/"+(settings.whatsapp||"2349067792950")+"?text="+encodeURIComponent("Hello Wurld, I would like to enquire about "+featured.title+".");
 }
 const series=works.find(w=>w.category==="series"&&w.imageUrl);
 if(series){
  const section=document.querySelector(".series-main");
  const open=section?.querySelector(".art-open"),img=open?.querySelector("img");
  if(open&&img){open.dataset.image=series.imageUrl;img.src=series.imageUrl;img.alt=series.altText||series.title;open.setAttribute("aria-label","View "+series.title)}
  const title=section?.querySelector("h2");if(title)title.textContent=series.title;
  const description=section?.querySelector("p");if(description)description.textContent=series.description||"An original body of work by Wurld.";
 }
}
function renderSettings(){
 const hero=document.querySelector(".hero-copy > p");
 if(hero&&settings.hero)hero.textContent=settings.hero;
 const bio=document.querySelector(".bio .lead");
 if(bio&&settings.bio)bio.textContent=settings.bio;
 const price=document.querySelector(".commission-layout strong");
 if(price&&settings.commissionPrice!=null)price.textContent=fmt.format(settings.commissionPrice);
 const whatsapp=String(settings.whatsapp||"2349067792950").replace(/\D/g,"");
 if(whatsapp){
  window.WurldPortfolio?.setWhatsapp(whatsapp);
  document.querySelectorAll('a[href^="https://wa.me/"]').forEach(anchor=>{
   try{
    const url=new URL(anchor.href);
    anchor.href="https://wa.me/"+whatsapp+url.search;
    if(anchor.classList.contains("big-contact"))anchor.textContent="+"+whatsapp;
   }catch{}
  });
 }
 if(settings.email){
  document.querySelectorAll('a[href^="mailto:"]').forEach(anchor=>{
   const old=anchor.getAttribute("href")||"";
   anchor.href="mailto:"+settings.email+(old.includes("?")?old.slice(old.indexOf("?")):"");
   if(anchor.classList.contains("big-contact"))anchor.textContent=settings.email;
  });
 }
 renderGallery();
}
if(db){
 onSnapshot(doc(db,"settings","site"),snapshot=>{
  settings=snapshot.exists()?snapshot.data():{};
  renderSettings();
 },error=>console.warn("Portfolio settings unavailable:",error));
 onSnapshot(query(collection(db,"artworks"),where("published","==",true)),snapshot=>{
  currentWorks=snapshot.docs.map(d=>({id:d.id,...d.data()}))
    .filter(w=>w.imageUrl&&w.title)
    .sort((a,b)=>(Number(a.sortOrder)||0)-(Number(b.sortOrder)||0));
  artworkLoaded=true;renderGallery();
 },error=>console.warn("Portfolio gallery unavailable; retaining original content:",error));
}
