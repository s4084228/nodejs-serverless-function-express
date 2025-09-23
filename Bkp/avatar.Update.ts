export {};
//// api/user/uploadAvatar.ts
//import type { VercelRequest, VercelResponse } from '@vercel/node';
//import multer from 'multer';
//import { createClient } from '@supabase/supabase-js';
//import { findUserByEmail, updateUserDetails } from '../../services/utils/Supabase';

//// Supabase client for storage
//const supabase = createClient(
//    process.env.NEXT_PUBLIC_SUPABASE_URL!,
//    process.env.SUPABASE_SERVICE_ROLE_KEY!
//);

//// Configure multer for memory storage
//const upload = multer({
//    storage: multer.memoryStorage(),
//    limits: {
//        fileSize: 5 * 1024 * 1024, // 5MB limit
//    },
//    fileFilter: (req, file, cb) => {
//        if (file.mimetype.startsWith('image/')) {
//            cb(null, true);
//        } else {
//            cb(new Error('Only image files are allowed'));
//        }
//    },
//});

//export default async function handler(req: VercelRequest, res: VercelResponse) {
//    if (req.method !== 'POST') {
//        return res.status(405).json({ error: 'Method not allowed' });
//    }

//    try {
//        // Use multer middleware
//        const uploadSingle = upload.single('avatar');

//        await new Promise<void>((resolve, reject) => {
//            uploadSingle(req as any, res as any, (err) => {
//                if (err) reject(err);
//                else resolve();
//            });
//        });

//        const file = (req as any).file;
//        const { email } = req.body;

//        if (!file) {
//            return res.status(400).json({ error: 'No image file provided' });
//        }

//        if (!email || !isValidEmail(email)) {
//            return res.status(400).json({ error: 'Valid email is required' });
//        }

//        // Check if user exists
//        const user = await findUserByEmail(email);
//        if (!user) {
//            return res.status(404).json({ error: 'User not found' });
//        }

//        // Generate unique filename
//        const fileExt = file.originalname.split('.').pop();
//        const fileName = `${user.user_id}-${Date.now()}.${fileExt}`;
//        const filePath = `avatars/${fileName}`;

//        // Upload to Supabase Storage
//        const { data: uploadData, error: uploadError } = await supabase.storage
//            .from('user-avatars')
//            .upload(filePath, file.buffer, {
//                contentType: file.mimetype,
//                upsert: true
//            });

//        if (uploadError) {
//            throw uploadError;
//        }

//        // Get public URL
//        const { data: urlData } = supabase.storage
//            .from('user-avatars')
//            .getPublicUrl(filePath);

//        const avatarURL = urlData.publicUrl;

//        // Update user profile with new avatar URL
//        await updateUserDetails(user.email, {}, { avatar_url: avatarURL });

//        return res.status(200).json({
//            success: true,
//            message: 'Avatar uploaded successfully',
//            avatarURL
//        });

//    } catch (error) {
//        console.error('Avatar upload error:', error);
//        return res.status(500).json({
//            error: 'Failed to upload avatar',
//            details: error instanceof Error ? error.message : 'Unknown error'
//        });
//    }
//}

//// Export configuration for Next.js
//export const config = {
//    api: {
//        bodyParser: false, // Required for multer
//    },
//};

//// Utility functions
//function isValidEmail(email: string): boolean {
//    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//    return emailRegex.test(email);
//}

//function isValidUsername(username: string): boolean {
//    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
//    return usernameRegex.test(username);
//}