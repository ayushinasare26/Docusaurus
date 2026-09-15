import { CognitoJwtVerifier } from "aws-jwt-verify";
import { cookies } from "next/headers";

// Lazy-initialize JWT Verifier for AWS Cognito
let verifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null;

function getVerifier() {
    if (!verifier) {
        verifier = CognitoJwtVerifier.create({
            userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
            tokenUse: "id",
            clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
        });
    }
    return verifier;
}

/**
 * Verifies a Cognito ID Token and returns the decoded payload.
 * Throws an error if verification fails.
 */
export async function verifyToken(token: string) {
    try {
        const payload = await getVerifier().verify(token);
        return payload;
    } catch (error) {
        if (!isTokenExpiredError(error)) {
            console.error("JWT Verification failed:", error);
        }
        throw error;
    }
}

export function isTokenExpiredError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return message.toLowerCase().includes("token expired");
}

/**
 * Helper to get and verify the token from cookies in API routes.
 */
export async function getVerifiedToken() {
    const cookieStore = await cookies();
    const token = cookieStore.get("pvx_id_token")?.value;
    if (!token) return null;

    try {
        return await verifyToken(token);
    } catch (err) {
        return null;
    }
}

/**
 * Checks if a user belongs to a specific group.
 */
export function hasGroup(payload: any, groupName: string): boolean {
    const groups = payload["cognito:groups"] || [];
    return groups.includes(groupName);
}
