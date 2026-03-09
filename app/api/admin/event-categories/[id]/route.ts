import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

interface RouteParams {
  params: {
    id: string
  }
}

// GET single category
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const category = await prisma.eventCategory.findUnique({
      where: {
        id: params.id
      }
    })

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      )
    }

    // Get event count for this category
    const eventCount = await prisma.eventsOnCategories.count({
      where: {
        categoryId: params.id
      }
    })

    return NextResponse.json({
      ...category,
      eventCount
    })
  } catch (error) {
    console.error("Error fetching category:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT update category
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, icon, color, isActive } = await request.json()

    // Check if category exists
    const existingCategory = await prisma.eventCategory.findUnique({
      where: { id: params.id }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      )
    }

    // Check for duplicate name (excluding current category)
    if (name && name !== existingCategory.name) {
      const duplicateCategory = await prisma.eventCategory.findFirst({
        where: {
          name: {
            equals: name,
            mode: 'insensitive'
          },
          id: {
            not: params.id
          }
        }
      })

      if (duplicateCategory) {
        return NextResponse.json(
          { error: "Category with this name already exists" },
          { status: 409 }
        )
      }
    }

    const updatedCategory = await prisma.eventCategory.update({
      where: { id: params.id },
      data: {
        name,
        icon,
        color,
        isActive
      }
    })

    // Get updated event count
    const eventCount = await prisma.eventsOnCategories.count({
      where: {
        categoryId: params.id
      }
    })

    return NextResponse.json({
      ...updatedCategory,
      eventCount
    })
  } catch (error) {
    console.error("Error updating category:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE category
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if category exists and has events
    const category = await prisma.eventCategory.findUnique({
      where: { id: params.id }
    })

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      )
    }

    // Check if category has associated events
    const eventCount = await prisma.eventsOnCategories.count({
      where: {
        categoryId: params.id
      }
    })

    if (eventCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete category with associated events" },
        { status: 400 }
      )
    }

    await prisma.eventCategory.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "Category deleted successfully" })
  } catch (error) {
    console.error("Error deleting category:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}