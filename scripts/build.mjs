import {build} from 'esbuild';
import {mkdir,rm,copyFile,cp} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist');
for(const file of ['index.html','style.css','app.js','admin.html','admin.css'])await copyFile(file,'dist/'+file);
await cp('assets','dist/assets',{recursive:true});
const url=process.env.SUPABASE_URL||'',key=process.env.SUPABASE_PUBLISHABLE_KEY||'';
if(Boolean(url)!==Boolean(key))throw Error('Both Supabase public configuration values must be provided.');
if(url&&!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(url))throw Error('Use the Supabase project HTTPS URL.');
if(key&&!key.startsWith('sb_publishable_')){try{if(JSON.parse(Buffer.from(key.split('.')[1],'base64url')).role!=='anon')throw Error();}catch{throw Error('Only a publishable or anon key is allowed in the frontend.');}}
await build({entryPoints:['src/admin.js','src/gallery.js'],bundle:true,format:'esm',outdir:'dist',minify:true,define:{__SUPABASE_URL__:JSON.stringify(url),__SUPABASE_KEY__:JSON.stringify(key)}});
