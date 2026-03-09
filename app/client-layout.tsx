"use client"

import type React from "react"

// import { Analytics } from "@vercel/analytics/next"
import { Providers } from "./providers"
import { Suspense } from "react"

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <Providers>{children}</Providers>
      </Suspense>
      {/* <Analytics /> */}
    </>
  )
}
