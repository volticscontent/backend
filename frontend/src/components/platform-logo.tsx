"use client"

import { Globe } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface PlatformLogoProps {
  platform: string
  className?: string
}

export function PlatformLogo({ platform, className }: PlatformLogoProps) {
  // Map of platforms to their specific asset paths
  const assets: Record<string, string> = {
    'META': '/logos/meta.png',
    'TIKTOK': '/logos/tiktok.svg',
    'GOOGLE_ADS': '/logos/google_ads.png',
    'STRIPE': '/logos/stripe.png',
    'SHOPIFY': '/logos/shopify.png',
    'HOTMART': '/logos/hotmart.jpg',
  }

  const [error, setError] = useState(false)

  // Ensure case-insensitive matching
  const key = platform?.trim().toUpperCase()
  const src = assets[key]

  if (src && !error) {
      // Using standard img tag temporarily to debug Next.js Image issues and ensure visibility
      return (
        <div className={cn("relative flex items-center justify-center overflow-hidden", className)}>
           <img 
              src={src} 
              alt={platform} 
              className="h-full w-full object-contain"
              onError={() => setError(true)}
           />
        </div>
      )
    }

  if (key === 'CUSTOM') {
    // SVG for "Outro em plataforma de vendas" (Custom Sales Platform)
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 8.25h-3.75V6c0-2.485-2.015-4.5-4.5-4.5S8.25 3.515 8.25 6v2.25H4.5C3.672 8.25 3 8.922 3 9.75v10.5c0 .828.672 1.5 1.5 1.5h15c.828 0 1.5-.672 1.5-1.5V9.75c0-.828-.672-1.5-1.5-1.5zM10.5 6c0-1.24.935-2.25 2.25-2.25s2.25 1.01 2.25 2.25v2.25h-4.5V6zM5.25 20.25V10.5h13.5v9.75H5.25zm8.25-6.75a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" fill="currentColor"/>
      </svg>
    )
  }

  return <Globe className={className} />
}
