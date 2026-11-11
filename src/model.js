export const statuses=['available','sold','not_for_sale'];
export function validateArtwork(raw){
 const title=String(raw.title||'').trim(),description=String(raw.description||'').trim();
 if(!title||title.length>160)throw Error('Enter an artwork title (up to 160 characters).');
 if(description.length>5000)throw Error('Keep the description under 5,000 characters.');
 const year=raw.year===''||raw.year==null?null:Number(raw.year),price=raw.price===''||raw.price==null?null:Number(raw.price);
 if(year!==null&&(!Number.isInteger(year)||year<1900||year>2100))throw Error('Enter a year between 1900 and 2100.');
 if(price!==null&&(!Number.isFinite(price)||price<0||price>1000000000))throw Error('Enter a valid price in naira.');
 if(!statuses.includes(raw.status))throw Error('Select an availability status.');
 if(!['catalogue','featured','series'].includes(raw.category))throw Error('Select a category.');
 return {title,description,year,price,medium:String(raw.medium||'').trim().slice(0,160),dimensions:String(raw.dimensions||'').trim().slice(0,100),status:raw.status,category:raw.category,published:raw.published===true};
}
export function validateFile(file){if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Upload JPG, PNG or WebP images only.');if(file.size>15*1024*1024||file.size===0)throw Error('Each image must be between 1 byte and 15 MB.');}
export async function compressImage(file){validateFile(file);const image=await createImageBitmap(file);try{if(image.width*image.height>60000000)throw Error('Image is too large. Use a photograph below 60 megapixels.');const ratio=Math.min(1,2400/Math.max(image.width,image.height)),canvas=document.createElement('canvas');canvas.width=Math.round(image.width*ratio);canvas.height=Math.round(image.height*ratio);canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);const blob=await new Promise(r=>canvas.toBlob(r,'image/webp',.86));if(!blob||blob.size>6*1024*1024)throw Error('Unable to compress this image. Try a smaller file.');return blob;}finally{image.close()}}
