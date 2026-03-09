import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - Fetch single email campaign
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const campaign = await prisma.emailCampaign.findUnique({
      where: { id },
      include: {
        recipients: {
          take: 100, // Limit recipients for performance
          orderBy: { sentAt: "desc" },
        },
      },
    })

    if (!campaign) {
      return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 })
    }

    // Format response
    const formattedCampaign = {
      id: campaign.id,
      title: campaign.title,
      subject: campaign.subject,
      content: campaign.content,
      htmlContent: campaign.htmlContent,
      status: campaign.status,
      priority: campaign.priority,
      targetAudiences: campaign.targetAudiences,
      scheduledAt: campaign.scheduledAt?.toISOString(),
      sentAt: campaign.sentAt?.toISOString(),
      createdAt: campaign.createdAt.toISOString(),
      updatedAt: campaign.updatedAt.toISOString(),
      stats: {
        totalRecipients: campaign.totalRecipients,
        sent: campaign.sent,
        delivered: campaign.delivered,
        opened: campaign.opened,
        clicked: campaign.clicked,
        bounced: campaign.bounced,
        unsubscribed: campaign.unsubscribed,
      },
      engagement: {
        openRate: campaign.openRate,
        clickRate: campaign.clickRate,
        deliveryRate: campaign.deliveryRate,
        bounceRate: campaign.bounceRate,
        unsubscribeRate: campaign.unsubscribeRate,
      },
      recipients: campaign.recipients.map((r) => ({
        id: r.id,
        email: r.recipientEmail,
        name: r.recipientName,
        status: r.status,
        sentAt: r.sentAt?.toISOString(),
        deliveredAt: r.deliveredAt?.toISOString(),
        openedAt: r.openedAt?.toISOString(),
        clickedAt: r.clickedAt?.toISOString(),
      })),
    }

    return NextResponse.json({ success: true, data: formattedCampaign })
  } catch (error) {
    console.error("[v0] Error fetching email campaign:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch email campaign" }, { status: 500 })
  }
}

// PUT - Update email campaign
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await request.json()

    const updatedCampaign = await prisma.emailCampaign.update({
      where: { id },
      data: {
        title: body.title,
        subject: body.subject,
        content: body.content,
        htmlContent: body.htmlContent,
        status: body.status,
        priority: body.priority,
        targetAudiences: body.targetAudiences,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedCampaign,
      message: "Campaign updated successfully",
    })
  } catch (error) {
    console.error("[v0] Error updating email campaign:", error)
    return NextResponse.json({ success: false, error: "Failed to update email campaign" }, { status: 500 })
  }
}

// DELETE - Delete email campaign
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    await prisma.emailCampaign.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: "Campaign deleted successfully",
    })
  } catch (error) {
    console.error("[v0] Error deleting email campaign:", error)
    return NextResponse.json({ success: false, error: "Failed to delete email campaign" }, { status: 500 })
  }
}
