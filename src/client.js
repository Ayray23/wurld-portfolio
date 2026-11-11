import {createClient} from '@supabase/supabase-js';
export const client=__SUPABASE_URL__&&__SUPABASE_KEY__?createClient(__SUPABASE_URL__,__SUPABASE_KEY__,{auth:{storageKey:'wurld-admin-session',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
export const bucket='wurld-artworks';
export async function imagesFor(paths){if(!paths.length)return [];const {data,error}=await client.storage.from(bucket).createSignedUrls(paths,300);if(error)throw error;return data.map(x=>{if(x.error)throw Error('An artwork image is unavailable.');return x.signedUrl})}
