import { NextResponse } from 'next/server';
import {
    CognitoIdentityProviderClient,
    AdminSetUserPasswordCommand
} from "@aws-sdk/client-cognito-identity-provider";
import { getVerifiedToken } from '@/lib/auth';

const client = new CognitoIdentityProviderClient({
    region: process.env.COGNITO_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
    }
});

const userPoolId = process.env.COGNITO_USER_POOL_ID;

export async function POST(req: Request) {
    try {
        // Authenticate
        const tokenPayload = await getVerifiedToken();
        if (!tokenPayload) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "email is required" }, { status: 400 });
        }

        const tempPassword = Math.random().toString(36).slice(-10) + "A!1";

        const setPasswordCommand = new AdminSetUserPasswordCommand({
            UserPoolId: userPoolId,
            Username: email,
            Password: tempPassword,
            Permanent: false
        });

        await client.send(setPasswordCommand);

        return NextResponse.json({
            message: "Temporary password generated successfully",
            tempPassword: tempPassword
        });

    } catch (error: any) {
        console.error("Cognito Error:", error);
        return NextResponse.json({ error: error.message || "Failed to reset password in Cognito" }, { status: 500 });
    }
}
