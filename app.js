const toggle=document.querySelector('#menu-toggle'),menu=document.querySelector('#menu');
function closeMenu(){menu.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.textContent='Explore +'}
toggle.addEventListener('click',()=>{const open=menu.hidden;menu.hidden=!open;toggle.setAttribute('aria-expanded',String(open));toggle.textContent=open?'Close −':'Explore +'});
menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('click',e=>{if(!e.target.closest('nav'))closeMenu()});
const works=[
{id:'01',image:'assets/image-5.webp',title:'The Fashion',description:'A study of how fashion lets people say who they are. Colour, facial detail, clothing and pattern celebrate confidence, individuality and personal style.',facts:[['Year','2026'],['Medium','Oil on canvas'],['Size','20 × 30 in'],['Price','₦500,000']]},
{id:'02',image:'assets/image-86.webp',title:'Artwork 02',description:'An original artwork from Wurld’s catalogue. Contact the artist for its title, medium, dimensions, price and current availability.',facts:[]},
{id:'03',image:'assets/image-90.webp',title:'Artwork 03',description:'An original artwork from Wurld’s catalogue. Contact the artist for its title, medium, dimensions, price and current availability.',facts:[]},
{id:'04',image:'assets/image-94.webp',title:'Artwork 04',description:'An original artwork from Wurld’s catalogue. Contact the artist for its title, medium, dimensions, price and current availability.',facts:[]},
{id:'series',image:'assets/image-74.webp',title:'Last Song of the Night',description:'A reflection of Wurld’s journey, imagination and the way he sees beauty and life around him. Enquire about this series and the works in development.',facts:[['Body of work','Series'],['Availability','Enquire with the artist']]}
];
const dialog=document.querySelector('#lightbox');let active=0,returnFocus=null,previousHash='';
function drawArtwork(){const w=works[active];document.querySelector('#art-image').src=w.image;document.querySelector('#art-image').alt=w.title;document.querySelector('#art-heading').textContent=w.title;document.querySelector('#art-description').textContent=w.description;document.querySelector('#art-facts').replaceChildren();w.facts.forEach(([key,value])=>{const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=key;dd.textContent=value;row.append(dt,dd);document.querySelector('#art-facts').append(row)});document.querySelector('#art-position').textContent=`${active+1} / ${works.length}`;document.querySelector('#art-enquire').href='https://wa.me/2349067792950?text='+encodeURIComponent(`Hello Wurld, I’m interested in ${w.title}. Could you confirm the details and availability?`);document.querySelector('#art-share-status').textContent='';history.replaceState(null,'','#artwork-'+w.id)}
function openArtwork(index){if(index<0)return;active=index;if(!dialog.open){returnFocus=document.activeElement;previousHash=location.hash.startsWith('#artwork-')?'#collect':location.hash;dialog.showModal();document.body.classList.add('modal-open')}drawArtwork()}
document.querySelectorAll('.art-open').forEach(b=>b.addEventListener('click',()=>openArtwork(works.findIndex(w=>w.image===b.dataset.image))));
document.querySelectorAll('.details-trigger').forEach(b=>b.addEventListener('click',()=>openArtwork(works.findIndex(w=>w.id===b.dataset.art))));
document.querySelector('#close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
dialog.addEventListener('close',()=>{document.body.classList.remove('modal-open');history.replaceState(null,'',location.pathname+location.search+previousHash);returnFocus?.focus()});
function step(d){active=(active+d+works.length)%works.length;drawArtwork()}
document.querySelector('#previous-art').addEventListener('click',()=>step(-1));document.querySelector('#next-art').addEventListener('click',()=>step(1));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();if(dialog.open&&e.key==='ArrowLeft')step(-1);if(dialog.open&&e.key==='ArrowRight')step(1)});
function openFromHash(){const id=location.hash.replace('#artwork-','');const i=works.findIndex(w=>w.id===id);if(i>=0)openArtwork(i)}
window.addEventListener('hashchange',()=>{if(location.hash.startsWith('#artwork-'))openFromHash();else if(dialog.open)dialog.close()});openFromHash();
async function copyLink(url,status){try{await Promise.race([navigator.clipboard.writeText(url),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Clipboard unavailable')),1500))]);status.textContent='Link copied. Ready to share.'}catch{status.textContent='Copy this link: '+url}}
document.querySelector('#art-share').addEventListener('click',()=>copyLink(location.href,document.querySelector('#art-share-status')));
document.querySelector('#share-site').addEventListener('click',async()=>{const url=location.origin+location.pathname,status=document.querySelector('#share-status');if(navigator.share){try{await navigator.share({title:'Wurld — Artist Portfolio',text:'Faces. Colour. Hope. Explore paintings by Wurld.',url});status.textContent='Portfolio shared.'}catch(e){if(e.name!=='AbortError')await copyLink(url,status)}}else await copyLink(url,status)});
document.querySelectorAll('.filter').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('.filter').forEach(b=>{const on=b===button;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});let count=0;document.querySelectorAll('#collect .card').forEach(card=>{card.hidden=button.dataset.filter!=='all'&&card.dataset.category!==button.dataset.filter;if(!card.hidden)count++});document.querySelector('#gallery-count').textContent=`${count} ${count===1?'work':'works'}`}));
const form=document.querySelector('#enquiry-form');form.addEventListener('submit',e=>{e.preventDefault();if(!form.reportValidity())return;const data=new FormData(form),name=String(data.get('name')).trim(),message=String(data.get('message')).trim();if(!name||message.length<10){document.querySelector('#form-status').textContent='Please enter your name and at least 10 characters describing your enquiry.';return}const interest=data.get('interest'),body=`Hello Wurld, my name is ${name}.\n\nI’m interested in: ${interest}.\n\n${message}`,email=e.submitter?.value==='email',url=email?'mailto:adeniyiw123@gmail.com?subject='+encodeURIComponent('Portfolio enquiry: '+interest)+'&body='+encodeURIComponent(body):'https://wa.me/2349067792950?text='+encodeURIComponent(body);const status=document.querySelector('#form-status');status.replaceChildren();status.append('Your message is ready. Review it and press Send in '+(email?'your email app. ':'WhatsApp. '));const link=document.createElement('a');link.href=url;link.textContent=email?'Open email draft again ↗':'Open WhatsApp draft again ↗';if(!email){link.target='_blank';link.rel='noopener'}status.append(link);if(email)location.href=url;else window.open(url,'_blank','noopener,noreferrer')});
const links=[...document.querySelectorAll('.desktop-links a')];const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting)links.forEach(a=>{if(a.hash==='#'+entry.target.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')})})},{rootMargin:'-15% 0px -60% 0px'});document.querySelectorAll('main>section[id]').forEach(s=>observer.observe(s));
// Uploaded artworks join the original curated portfolio; all text uses safe DOM APIs.
let photoIndex=0;
const photoNav=document.createElement('div');photoNav.className='viewer-controls';photoNav.setAttribute('aria-label','Artwork photographs');document.querySelector('.viewer-image').append(photoNav);
function artworkPhotos(){const w=works[active],images=w.images?.length?w.images:[w.image];photoIndex=0;photoNav.replaceChildren();if(images.length<2)return;images.forEach((url,i)=>{const b=document.createElement('button');b.textContent='Photo '+(i+1);b.setAttribute('aria-pressed',String(i===0));b.onclick=()=>{photoIndex=i;document.querySelector('#art-image').src=url;photoNav.querySelectorAll('button').forEach((el,j)=>el.setAttribute('aria-pressed',String(i===j)))};photoNav.append(b)})}
const drawOriginal=drawArtwork;drawArtwork=function(){drawOriginal();artworkPhotos()};
window.addEventListener('wurld:artworks',({detail})=>{
 const currentId=dialog.open?works[active]?.id:null;
 for(let i=works.length-1;i>=0;i--)if(works[i].uploaded)works.splice(i,1);
 works.push(...detail);
 document.querySelectorAll('#collect .uploaded-card').forEach(c=>c.remove());
 const gallery=document.querySelector('#collect .gallery');
 for(const w of [...detail].reverse()){
  const card=document.createElement('article');card.className='card uploaded-card';card.dataset.category=w.category;
  const button=document.createElement('button');button.className='art-open';button.setAttribute('aria-label','View '+w.title);button.onclick=()=>openArtwork(works.findIndex(x=>x.id===w.id));
  const img=document.createElement('img');img.src=w.image;img.alt=w.title;img.loading='lazy';button.append(img);
  const title=document.createElement('h3');title.className='art-title';title.textContent=w.title;
  const note=document.createElement('p');note.className='art-note';note.textContent=w.facts.filter(([k])=>['Availability','Price'].includes(k)).map(([,v])=>v).join(' · ');
  const action=document.createElement('button');action.className='text-link';action.textContent='View artwork & enquire ↗';action.onclick=button.onclick;
  card.append(button,title,note,action);gallery.prepend(card);
 }
 document.querySelector('.filter.active')?.click();
 if(currentId){const index=works.findIndex(w=>w.id===currentId);if(index<0)dialog.close();else{active=index;drawArtwork()}}else openFromHash();
});
