// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

export function middleware(request: NextRequest) {
  // Check if the request is for the admin dashboard
  if (request.nextUrl.pathname.startsWith('/admin-dashboard')) {
    const token = request.cookies.get('superAdminToken')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.redirect(new URL('/signup', request.url))
    }

    try {
      // Proper JWT verification
      const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'your-secret-key') as any
      
      // Check if user has super admin role
      if (decoded.role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/signup', request.url))
      }
    } catch (error) {
      console.error('Token verification failed:', error)
      return NextResponse.redirect(new URL('/signup', request.url))
    }
  }

  return NextResponse.next()
}