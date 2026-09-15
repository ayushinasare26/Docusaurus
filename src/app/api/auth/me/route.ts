import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, hasGroup, isTokenExpiredError } from '@/lib/auth';

function unauthenticatedResponse(reason: 'missing_token' | 'session_expired' | 'invalid_token') {
    const response = NextResponse.json({ authenticated: false, reason }, { status: 401 });
    response.cookies.delete('authenticated');
    response.cookies.delete('pvx_id_token');
    return response;
}

export async function GET() {
    try {
        const cookieStore = await cookies();
        const idToken = cookieStore.get('pvx_id_token')?.value;

        if (!idToken) {
            return unauthenticatedResponse('missing_token');
        }

        // Cryptographically verify the token
        const payload = await verifyToken(idToken);

        // Roles check
        const isSuperAdmin = hasGroup(payload, 'SuperAdmins');
        const email = payload.email || payload['preferred_username'] || 'User';

        return NextResponse.json({
            authenticated: true,
            user: {
                username: email,
                email: email,
                groups: payload['cognito:groups'] || []
            },
            isSuperAdmin
        });

    } catch (error) {
        if (isTokenExpiredError(error)) {
            return unauthenticatedResponse('session_expired');
        }

        console.error('Session Verification Error:', error);
        return unauthenticatedResponse('invalid_token');
    }
}
