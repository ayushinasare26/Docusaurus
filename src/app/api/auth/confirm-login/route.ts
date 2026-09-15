import { NextResponse } from 'next/server';
import {
    CognitoIdentityProviderClient,
    RespondToAuthChallengeCommand
} from "@aws-sdk/client-cognito-identity-provider";
import crypto from 'crypto';
import { cookies } from 'next/headers';

const client = new CognitoIdentityProviderClient({
    region: process.env.COGNITO_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
    }
});

const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!;
const clientSecret = process.env.COGNITO_CLIENT_SECRET;

// Helper to calculate Cognito Secret Hash
function calculateSecretHash(username: string): string {
    if (!clientSecret) return '';
    return crypto
        .createHmac('sha256', clientSecret)
        .update(username + clientId)
        .digest('base64');
}

export async function POST(req: Request) {
    try {
        const { username, session, newPassword } = await req.json();

        if (!session || !newPassword || !username) {
            return NextResponse.json({ error: "Username, Session and new password are required" }, { status: 400 });
        }

        const secretHash = calculateSecretHash(username);

        const challengeCommand = new RespondToAuthChallengeCommand({
            ChallengeName: "NEW_PASSWORD_REQUIRED",
            ClientId: clientId,
            Session: session,
            ChallengeResponses: {
                USERNAME: username,
                NEW_PASSWORD: newPassword,
                ...(secretHash ? { SECRET_HASH: secretHash } : {})
            }
        });

        const response = await client.send(challengeCommand);

        // If successful, set the HttpOnly cookie for middleware and role detection
        const cookieStore = await cookies();
        const idToken = response.AuthenticationResult?.IdToken;

        if (idToken) {
            cookieStore.set('pvx_id_token', idToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24 // 24 hours
            });
            // Also set a simple flag for middleware to check easily
            cookieStore.set('authenticated', 'true', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24
            });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Confirm Login Proxy Error:", error);
        return NextResponse.json({ error: error.message || "Failed to confirm password" }, { status: 401 });
    }
}
