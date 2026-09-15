import { NextResponse } from 'next/server';
import {
    CognitoIdentityProviderClient,
    AdminCreateUserCommand
} from "@aws-sdk/client-cognito-identity-provider";
import { getVerifiedToken, hasGroup } from '@/lib/auth';

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
        // Authenticate and authorize
        const tokenPayload = await getVerifiedToken();
        if (!tokenPayload || !hasGroup(tokenPayload, 'SuperAdmins')) {
            return NextResponse.json({ error: "Unauthorized. Super Admin access required." }, { status: 401 });
        }

        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "email is required" }, { status: 400 });
        }

        const tempPassword = Math.random().toString(36).slice(-10) + "T1!";

        // Create user in Cognito
        const createCommand = new AdminCreateUserCommand({
            UserPoolId: userPoolId,
            Username: email,
            UserAttributes: [
                { Name: "email", Value: email },
                { Name: "email_verified", Value: "true" }
            ],
            TemporaryPassword: tempPassword,
            MessageAction: "SUPPRESS"
        });

        await client.send(createCommand);

        return NextResponse.json({
            message: "User created successfully",
            tempPassword: tempPassword
        }, { status: 201 });

    } catch (error: any) {
        console.error("Cognito Error:", error);
        return NextResponse.json({ error: error.message || "Failed to create user in Cognito" }, { status: 500 });
    }
}
