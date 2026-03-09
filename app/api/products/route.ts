import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Cloudinary } from "@/lib/cloudinary"

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: { exhibitor: { select: { firstName: true, lastName: true } } },
      orderBy: { id: "desc" },
    })
    return NextResponse.json(products)
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()

    const name = formData.get("name") as string
    const category = formData.get("category") as string
    const description = formData.get("description") as string
    const price = formData.get("price") as string
    const currency = formData.get("currency") as string
    const exhibitorId = formData.get("exhibitorId") as string

    const imageFiles = formData.getAll("images") as File[]
    const brochureFiles = formData.getAll("brochure") as File[]

    // Upload images to Cloudinary
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

    const product = await prisma.product.create({
      data: {
        name,
        category,
        description,
        price: parseFloat(price),
        currency,
        exhibitorId,
        images: imageUrls,
        brochure: brochureUrls,
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error("Error adding product:", error)
    return NextResponse.json({ error: "Failed to add product" }, { status: 500 })
  }
}
