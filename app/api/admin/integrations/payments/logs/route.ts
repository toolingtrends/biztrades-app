import { NextResponse } from "next/server"
import {prisma} from "@/lib/prisma"

export async function GET() {
  try {
    const payments = await prisma.payment.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    const logs = payments.map((payment) => ({
      id: payment.id,
      gatewayId: payment.gateway?.toLowerCase() || "unknown",
      gatewayName: payment.gateway || "Unknown",
      transactionId: payment.gatewayTransactionId || payment.id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status === "COMPLETED" ? "SUCCESS" : payment.status === "FAILED" ? "FAILED" : "PENDING",
      type: payment.refundAmount && payment.refundAmount > 0 ? "REFUND" : "PAYMENT",
      customerEmail: payment.user?.email || "N/A",
      createdAt: payment.createdAt.toISOString(),
    }))

    return NextResponse.json({ logs })
  } catch (error) {
    console.error("Error fetching transaction logs:", error)
    return NextResponse.json({ error: "Failed to fetch transaction logs" }, { status: 500 })
  }
}
