import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Cloudinary } from "@/lib/cloudinary"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: (await params).id },
    })
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 })
    return NextResponse.json(product)
  } catch (error) {
    console.error("Error fetching product:", error)
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const formData = await request.formData()
    const name = formData.get("name") as string
    const category = formData.get("category") as string
    const description = formData.get("description") as string
    const price = formData.get("price") as string
    const currency = formData.get("currency") as string

    const imageFiles = formData.getAll("images") as File[]
    const brochureFiles = formData.getAll("brochure") as File[]

    const uploadToCloudinary = async (file: File) => {
      const buffer = Buffer.from(await file.arrayBuffer())
      const base64 = `data:${file.type};base64,${buffer.toString("base64")}`
      const result = await Cloudinary.uploader.upload(base64, {
        folder: "products",
      })
      return result.secure_url
    }

    const imageUrls = await Promise.all(imageFiles.map(uploadToCloudinary))
    const brochureUrls = await Promise.all(brochureFiles.map(uploadToCloudinary))

    const updatedProduct = await prisma.product.update({
      where: { id:(await params).id },
      data: {
        name,
        category,
        description,
       price: parseFloat(price),
        currency,
        images: imageUrls,
        brochure: brochureUrls,
      },
    })

    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await prisma.product.delete({
      where: { id: (await params).id },
    })
    return NextResponse.json({ message: "Product deleted successfully" })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}
