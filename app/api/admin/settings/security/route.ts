import { NextResponse } from "next/server"
import {prisma} from "@/lib/prisma"

export async function GET() {
  try {
    // Fetch active sessions from database
    const dbSessions = await prisma.adminSession.findMany({
      where: {
        expiresAt: { gt: new Date() },
      },
      include: {
        superAdmin: true,
        subAdmin: true,
      },
      orderBy: { createdAt: "desc" },
    })

    // Transform sessions
    const sessions = dbSessions.map((session) => {
      const user = session.superAdmin || session.subAdmin
      return {
        id: session.id,
        userId: session.adminId,
        userName: user?.name || "Unknown",
        userEmail: user?.email || "Unknown",
        userType: session.adminType,
        deviceInfo: session.deviceInfo || "Unknown Device",
        ipAddress: session.ipAddress || "Unknown",
        location: "Unknown Location",
        browser: session.userAgent?.split(" ")[0] || "Unknown Browser",
        os: session.userAgent?.includes("Windows")
          ? "Windows"
          : session.userAgent?.includes("Mac")
            ? "macOS"
            : "Unknown OS",
        lastActivity: session.createdAt.toISOString(),
        createdAt: session.createdAt.toISOString(),
        isCurrent: false,
      }
    })

    // Mock security events (would come from a security_events table)
    const events = [
      {
        id: "1",
        type: "Failed Login Attempt",
        severity: "medium" as const,
        description: "Multiple failed login attempts detected from suspicious IP",
        userId: "user1",
        userName: "john@example.com",
        ipAddress: "192.168.1.100",
        location: "New York, US",
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        resolved: false,
      },
      {
        id: "2",
        type: "Brute Force Attack",
        severity: "critical" as const,
        description: "Detected brute force attack with 50+ login attempts in 5 minutes",
        ipAddress: "45.33.32.156",
        location: "Unknown",
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        resolved: false,
      },
      {
        id: "3",
        type: "Unusual Login Location",
        severity: "high" as const,
        description: "Login from new geographic location detected",
        userId: "user2",
        userName: "admin@company.com",
        ipAddress: "203.0.113.45",
        location: "Beijing, CN",
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        resolved: true,
      },
      {
        id: "4",
        type: "Password Changed",
        severity: "low" as const,
        description: "User successfully changed their password",
        userId: "user3",
        userName: "sarah@example.com",
        ipAddress: "10.0.0.55",
        location: "London, UK",
        timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        resolved: true,
      },
    ]

    // Default security settings
    const settings = {
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        expiryDays: 90,
        preventReuse: 5,
      },
      twoFactor: {
        enabled: true,
        required: false,
        methods: ["authenticator", "sms", "backup_codes"],
        gracePeriod: 7,
      },
      session: {
        maxConcurrent: 5,
        timeout: 30,
        extendOnActivity: true,
        rememberMeDays: 30,
      },
      loginSecurity: {
        maxAttempts: 5,
        lockoutDuration: 15,
        captchaAfterAttempts: 3,
        ipBlocking: true,
        geoBlocking: false,
        blockedCountries: [],
      },
      audit: {
        enabled: true,
        retentionDays: 90,
        logSuccessfulLogins: true,
        logFailedLogins: true,
        logPasswordChanges: true,
        logPermissionChanges: true,
      },
    }

    return NextResponse.json({
      settings,
      sessions,
      events,
    })
  } catch (error) {
    console.error("Error fetching security data:", error)
    return NextResponse.json({ error: "Failed to fetch security data" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const settings = await request.json()

    // In a real app, save settings to database or config store
    // For now, just return success
    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error("Error saving security settings:", error)
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
  }
}
