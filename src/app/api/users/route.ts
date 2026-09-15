import { NextRequest, NextResponse } from "next/server";
import {
    CognitoIdentityProviderClient,
    ListUsersCommand,
    AdminEnableUserCommand,
    AdminDisableUserCommand,
    AdminDeleteUserCommand
} from "@aws-sdk/client-cognito-identity-provider";
import { getVerifiedToken, hasGroup } from "@/lib/auth";

const client = new CognitoIdentityProviderClient({
    region: process.env.COGNITO_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
    }
});

const userPoolId = process.env.COGNITO_USER_POOL_ID;

export async function GET(req: NextRequest) {
    try {
        const tokenPayload = await getVerifiedToken();
        if (!tokenPayload) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const command = new ListUsersCommand({
            UserPoolId: userPoolId,
        });

        const response = await client.send(command);
        const users = response.Users || [];

        const processedResults = users
            .map(user => {
                const emailAttr = user.Attributes?.find(attr => attr.Name === 'email');
                const userEmail = emailAttr?.Value || user.Username;
                return {
                    email: userEmail,
                    isActive: user.Enabled ? 1 : 0,
                    status: user.UserStatus,
                    created: user.UserCreateDate,
                    modified: user.UserLastModifiedDate
                };
            })
            .filter(user => user.email && user.email.toUpperCase() !== 'ADMIN');

        return NextResponse.json(processedResults, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching users from Cognito:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch users" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const tokenPayload = await getVerifiedToken();
        if (!tokenPayload || !hasGroup(tokenPayload, 'SuperAdmins')) {
            return NextResponse.json({ error: "Unauthorized. Super Admin access required." }, { status: 401 });
        }

        const body = await req.json();
        const { email, isActive } = body;

        if (!email) {
            return NextResponse.json({ error: "Missing Email" }, { status: 400 });
        }

        if (isActive !== undefined) {
            const command = isActive
                ? new AdminEnableUserCommand({ UserPoolId: userPoolId, Username: email })
                : new AdminDisableUserCommand({ UserPoolId: userPoolId, Username: email });

            await client.send(command);
        }

        return NextResponse.json({ message: "User updated successfully in Cognito" }, { status: 200 });
    } catch (error: any) {
        console.error("Error updating user in Cognito:", error);
        return NextResponse.json({ error: error.message || "Failed to update user" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const tokenPayload = await getVerifiedToken();
        if (!tokenPayload || !hasGroup(tokenPayload, 'SuperAdmins')) {
            return NextResponse.json({ error: "Unauthorized. Super Admin access required." }, { status: 401 });
        }

        const searchParams = req.nextUrl.searchParams;
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json({ error: "Missing email" }, { status: 400 });
        }

        const { AdminListGroupsForUserCommand } = await import("@aws-sdk/client-cognito-identity-provider");
        const groupsResponse = await client.send(new AdminListGroupsForUserCommand({
            UserPoolId: userPoolId,
            Username: email
        }));

        const isSuperAdmin = groupsResponse.Groups?.some(g => g.GroupName === 'SuperAdmins');
        if (isSuperAdmin) {
            return NextResponse.json({ error: "Cannot delete a Super Admin user" }, { status: 403 });
        }

        const command = new AdminDeleteUserCommand({
            UserPoolId: userPoolId,
            Username: email
        });

        await client.send(command);

        return NextResponse.json({ message: "User deleted successfully from Cognito" }, { status: 200 });
    } catch (error: any) {
        console.error("Error deleting user from Cognito:", error);
        return NextResponse.json({ error: error.message || "Failed to delete user" }, { status: 500 });
    }
}
