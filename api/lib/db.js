//// Centralized database connection
//import { createClient } from '@supabase/supabase-js';

//const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
//const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

//export const supabase = createClient(supabaseUrl, supabaseKey);

//// File: backend/lib/storage.js
//// Centralized blob storage
//import { put, del } from '@vercel/blob';

//export const storeInBlob = async (key, data) => {
//    try {
//        const { url } = await put(key, JSON.stringify(data, null, 2), {
//            access: 'public',
//            contentType: 'application/json',
//        });
//        return url;
//    } catch (error) {
//        console.error('Blob storage error:', error);
//        throw error;
//    }
//};

//export const deleteFromBlob = async (key) => {
//    try {
//        await del(key);
//    } catch (error) {
//        console.error('Blob deletion error:', error);
//        throw error;
//    }
//};