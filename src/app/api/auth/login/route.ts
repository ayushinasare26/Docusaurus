import { NextResponse } from 'next/server';
import {
    CognitoIdentityProviderClient,
    InitiateAuthCommand
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
const clientSecret = process.env.COGNITO_CLIENT_SECRET; // PRIVATE secret from .env

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
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
        }

        const secretHash = calculateSecretHash(email);

        const authCommand = new InitiateAuthCommand({
            AuthFlow: "USER_PASSWORD_AUTH",
            ClientId: clientId,
            AuthParameters: {
                USERNAME: email,
                PASSWORD: password,
                ...(secretHash ? { SECRET_HASH: secretHash } : {})
            }
        });

        const response = await client.send(authCommand);

        if (response.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
            return NextResponse.json({
                nextStep: 'NEW_PASSWORD_REQUIRED',
                session: response.Session
            });
        }

        // If successful, set the HttpOnly cookie for middleware and role detection
        const cookieStore = await cookies();
        const idToken = response.AuthenticationResult?.IdToken;

        if (idToken) {
            const maxAge = 60 * 60 * 24; // Fixed 24 hours

            cookieStore.set('pvx_id_token', idToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge
            });
            // Also set a simple flag for middleware to check easily
            cookieStore.set('authenticated', 'true', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge
            });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Login Proxy Error:", error);
        return NextResponse.json({ error: error.message || "Authentication failed" }, { status: 401 });
    }
}
