"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FDF8F5]/95 backdrop-blur-sm border-b border-[#E8D5C4]/30">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-serif font-medium text-[#2D2926]">
            Lumière
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="#features"
              className="text-[#5C534A] hover:text-[#2D2926] transition-colors text-sm tracking-wide"
            >
              Features
            </Link>
            <Link
              href="#gallery"
              className="text-[#5C534A] hover:text-[#2D2926] transition-colors text-sm tracking-wide"
            >
              Gallery
            </Link>
            <Link
              href="#testimonials"
              className="text-[#5C534A] hover:text-[#2D2926] transition-colors text-sm tracking-wide"
            >
              Testimonials
            </Link>
            <Button className="bg-[#2D2926] hover:bg-[#1a1714] text-[#FDF8F5] rounded-full px-6">Get Started</Button>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden text-[#2D2926]" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pt-4 pb-2 space-y-4">
            <Link href="#features" className="block text-[#5C534A] hover:text-[#2D2926] transition-colors">
              Features
            </Link>
            <Link href="#gallery" className="block text-[#5C534A] hover:text-[#2D2926] transition-colors">
              Gallery
            </Link>
            <Link href="#testimonials" className="block text-[#5C534A] hover:text-[#2D2926] transition-colors">
              Testimonials
            </Link>
            <Button className="w-full bg-[#2D2926] hover:bg-[#1a1714] text-[#FDF8F5] rounded-full">Get Started</Button>
          </div>
        )}
      </div>
    </nav>
  )
}
