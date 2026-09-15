import { NextResponse } from 'next/server';
import {
    CognitoIdentityProviderClient,
    AdminDeleteUserCommand
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

export async function DELETE(req: Request) {
    try {
        // Authenticate and authorize
        const tokenPayload = await getVerifiedToken();
        if (!tokenPayload || !hasGroup(tokenPayload, 'SuperAdmins')) {
            return NextResponse.json({ error: "Unauthorized. Super Admin access required." }, { status: 401 });
        }
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json({ error: "email is required" }, { status: 400 });
        }

        const deleteCommand = new AdminDeleteUserCommand({
            UserPoolId: userPoolId,
            Username: email
        });

        await client.send(deleteCommand);

        return NextResponse.json({ message: "User deleted successfully from Cognito" });

    } catch (error: any) {
        console.error("Cognito Error:", error);
        return NextResponse.json({ error: error.message || "Failed to delete user from Cognito" }, { status: 500 });
    }
}
