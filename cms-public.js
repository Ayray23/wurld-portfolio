import { db } from "./firebase-client.js";
import { collection, onSnapshot, query, where } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
// The original static gallery remains visible until a published CMS catalogue exists.
if (db) {
  const gallery = document.querySelector("#collect .gallery");
  const count = document.querySelector("#gallery-count");
  const fmt = new Intl.NumberFormat("en-NG", {style:"currency",currency:"NGN",maximumFractionDigits:0});
  const el = (tag, name, value) => {
    const node=document.createElement(tag);if(name)node.className=name;if(value!=null)node.textContent=value;return node;
  };
  onSnapshot(query(collection(db,"artworks"),where("published","==",true)), snapshot => {
    if(snapshot.empty) return; // preserve original gallery until artworks have been published
    const works=snapshot.docs.map(d=>({id:d.id,...d.data()})).filter(w=>w.imageUrl)
      .sort((a,b)=>(Number(a.sortOrder)||0)-(Number(b.sortOrder)||0));
    if(!works.length)return;
    const cards=document.createDocumentFragment();
    for(const w of works){
      const card=el("article","card");card.dataset.category=["featured","catalogue","series"].includes(w.category)?w.category:"catalogue";
      const imageBtn=el("button","art-open");imageBtn.type="button";imageBtn.dataset.cmsId=w.id;imageBtn.setAttribute("aria-label","View "+w.title);
      const img=el("img");img.src=w.imageUrl;img.alt=w.altText||w.title;img.loading="lazy";imageBtn.append(img);
      card.append(imageBtn,el("div","label",card.dataset.category.toUpperCase()),el("h3","art-title",w.title),
        el("p","art-note",[w.year,w.medium,w.price?fmt.format(w.price):"Price on enquiry",w.status==="sold"?"Sold":null].filter(Boolean).join(" · ")));
      const details=el("button","text-link details-trigger","View artwork & enquire ↗");details.type="button";details.dataset.cmsId=w.id;card.append(details);cards.append(card);
    }
    gallery.replaceChildren(cards);
    window.WurldPortfolio?.setWorks(works.map(w=>({
      id:w.id,image:w.imageUrl,title:w.title,description:w.description||"",
      facts:[["Year",w.year],["Medium",w.medium],["Size",w.dimensions],["Price",w.price?fmt.format(w.price):"On enquiry"],["Status",w.status||"available"]].filter(x=>x[1])
    })));
    const selected=document.querySelector(".filter.active")?.dataset.filter||"all";
    let visible=0;gallery.querySelectorAll(".card").forEach(c=>{c.hidden=selected!=="all"&&c.dataset.category!==selected;if(!c.hidden)visible++});
    count.textContent=visible+" "+(visible===1?"work":"works");
  }, error=>{console.error("Artwork catalogue unavailable:",error)});
}
