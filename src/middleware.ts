import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // Create the Supabase client
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    // Get the user from the session
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
        console.error('Middleware: Auth error:', userError.message)
    }

    const isLoginPage = request.nextUrl.pathname.startsWith('/login')

    // 1. If no user and not on login page, redirect to login
    if (!user && !isLoginPage) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // 2. If user exists, check their role in the database
    if (user) {
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('role')
            .eq('auth_user_id', user.id)
            .single()

        if (profileError) {
            console.error('Middleware: Profile fetch error:', profileError.message)
            // If we can't fetch the profile (RLS issue, table missing, etc.),
            // allow authenticated users through — the page-level auth will handle it
            if (isLoginPage) {
                const url = request.nextUrl.clone()
                url.pathname = '/'
                return NextResponse.redirect(url)
            }
            return response
        }

        const isSuperAdmin = profile?.role === 'super_admin'

        // If on login page and is super admin, redirect to home
        if (isLoginPage && isSuperAdmin) {
            const url = request.nextUrl.clone()
            url.pathname = '/'
            return NextResponse.redirect(url)
        }

        // If NOT a super admin and not on login page, sign out and redirect to login
        if (!isSuperAdmin && !isLoginPage) {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            url.searchParams.set('error', 'unauthorized')

            const response = NextResponse.redirect(url)
            response.cookies.delete('sb-access-token')
            response.cookies.delete('sb-refresh-token')
            return response
        }
    }

    return response
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
