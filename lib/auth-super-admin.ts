// lib/auth-super-admin.ts
import jwt from 'jsonwebtoken'
import { NextApiRequest } from 'next'

export async function getSuperAdminFromToken(req: NextApiRequest) {
  try {
    // Get token from cookies or headers
    const token = req.cookies.superAdminToken || 
                  req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) return null

    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'your-secret-key') as any
    
    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role
    }
  } catch (error) {
    return null
  }
}

// Alternative: Get token from context
export function getSuperAdminFromContext(context: any) {
  try {
    const token = context.req.cookies.superAdminToken || 
                  context.req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) return null

    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'your-secret-key') as any
    
    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role
    }
  } catch (error) {
    return null
  }
}