import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isAuthenticated = request.cookies.has('authenticated');
    const cronSecret = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : "";
    const isCronSyncRequest = pathname === '/api/sync-daily-cdrs';
    const hasCronAuth = isCronSyncRequest && cronSecret && request.headers.get('authorization') === cronSecret;

    const isPublicPath = pathname === '/signin' ||
        pathname.startsWith('/_next/') ||
        pathname.includes('.') ||
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/api/myaccounts/invoice-data') ||
        pathname.startsWith('/api/myaccounts/customer') ||
        pathname.startsWith('/api/invoice/pdf-html') ||
        pathname.startsWith('/api/invoice/pdf-download') ||
        pathname === '/api/gocardless/webhook';

    if (!isAuthenticated && !isPublicPath && !hasCronAuth) {
        if (pathname.startsWith('/api')) {
            return new NextResponse(
                JSON.stringify({ error: 'Authentication required' }),
                { status: 401, headers: { 'content-type': 'application/json' } }
            );
        }
        return NextResponse.redirect(new URL('/signin', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
