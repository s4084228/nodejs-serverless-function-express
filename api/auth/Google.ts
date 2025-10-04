// api/auth/google.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import * as jwt from 'jsonwebtoken';

// -----------------------------
// CORS (adjust allowed origins)
// -----------------------------
const ALLOWED_ORIGINS = [
    'http://localhost:3000',
    // 'https://your-frontend.vercel.app', // add your deployed frontend here
];

function applyCors(req: VercelRequest, res: VercelResponse) {
    const origin = req.headers.origin as string | undefined;
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return true;
    }
    return false;
}

if (!admin.apps.length) {
    const key = process.env.FIREBASE_ADMIN_KEY;
    if (!key) {
        // Fail fast with a clear message if missing
        console.warn('FIREBASE_ADMIN_KEY is not set');
    } else {
        admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(key)),
        });
    }
}

// ----------------------------------
// Helper: issue your own app JWT
// ----------------------------------
function signAppToken(payload: { userId: string; email?: string | null }) {
    const secret = process.env.JWT_SECRET || 'dev-secret';
    return jwt.sign(
        {
            sub: String(payload.userId),
            email: payload.email ?? undefined,
            userId: payload.userId,
        },
        secret,
        { expiresIn: '24h' }
    );
}

// ----------------------------------
// Serverless handler
// ----------------------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS / preflight
    if (applyCors(req, res)) return;

    if (req.method !== 'POST') {
        res.status(405).json({ success: false, message: 'Method not allowed', statusCode: 405 });
        return;
    }

    try {
        const { idToken } = (req.body || {}) as { idToken?: string };

        if (!idToken) {
            res.status(400).json({ success: false, message: 'idToken required', statusCode: 400 });
            return;
        }

        if (!admin.apps.length) {
            res.status(500).json({ success: false, message: 'Firebase admin not initialized', statusCode: 500 });
            return;
        }

        const decoded = await getAuth().verifyIdToken(idToken);

        // decoded contains uid, email, name, picture.
        const uid = decoded.uid;
        const email = decoded.email ?? null;
        const name = decoded.name ?? '';
        const picture = decoded.picture ?? null;

        const [firstName, ...rest] = name.trim().split(' ').filter(Boolean);
        const lastName = rest.join(' ') || null;

        // 2)  Upsert user in your DB
        //    If you have Supabase/DB helpers, call them here to persist the user.
        //    For now we return a user object based on Google profile.
        const user = {
            userId: uid,              // using Firebase uid as userId
            email,
            username: email ? email.split('@')[0] : uid,
            firstName: firstName || null,
            lastName: lastName || null,
            organisation: null,
            avatarUrl: picture,
            displayName: name || (email ?? uid),
            userRole: 'user',
        };

        const token = signAppToken({ userId: uid, email });

        res.status(200).json({
            success: true,
            message: 'Google login successful',
            data: { user, token },
            statusCode: 200,
        });
    } catch (err: any) {
        console.error('Google auth error:', err);
        const msg = err?.message || 'Invalid token';
        res.status(401).json({ success: false, message: msg, statusCode: 401 });
    }
}