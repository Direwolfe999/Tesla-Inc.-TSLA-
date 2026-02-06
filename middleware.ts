import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from './supabase/middleware' // Ensure this path matches your folder structure

export async function middleware(req: NextRequest) {
    // 1. Initialize Supabase and capture the response object
    const { supabase, response } = createClient(req)

    // 2. Get User (getUser is more secure than getSession in middleware)
    const { data: { user } } = await supabase.auth.getUser()

    const url = req.nextUrl.clone()
    const pathname = url.pathname

    // ---------------- PROTECT DASHBOARD ----------------
    if (pathname.startsWith('/dashboard')) {
        // Condition A: No user found
        if (!user) {
            url.pathname = '/auth/signin'
            url.searchParams.set('error', 'unauthorized')
            return NextResponse.redirect(url)
        }

        // Condition B: User exists, but must pass the manual security handshake
        const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_complete')
            .eq('id', user.id)
            .single()

        // If profile is missing or handshake isn't finished
        if (!profile || profile.onboarding_complete === false) {
            url.pathname = '/auth/signin'
            url.searchParams.set('status', 'verify_required')
            url.searchParams.set('reason', 'security_handshake_incomplete')
            return NextResponse.redirect(url)
        }
    }

    // ---------------- BLOCK AUTH PAGES IF ALREADY VERIFIED ----------------
    if (pathname.startsWith('/auth')) {
        // If no user, let them stay on the auth pages
        if (!user) return response

        const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_complete')
            .eq('id', user.id)
            .single()

        // If they are logged in AND have finished the handshake, send to dashboard
        if (profile?.onboarding_complete) {
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }
    }

    // Return the response object (crucial for cookie sync)
    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this to include more paths.
         */
        '/dashboard/:path*', 
        '/auth/:path*'
    ],
}