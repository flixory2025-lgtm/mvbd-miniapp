"use client"

import type React from "react"

import { useState } from "react"
import { Search } from "lucide-react"
import Image from "next/image"

interface HeaderProps {
  onSearch: (query: string) => void
}

export default function Header({ onSearch }: HeaderProps) {
  const [searchInput, setSearchInput] = useState("")

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchInput(value)
    onSearch(value)
  }

  return (
    <header className="sticky top-0 z-40 bg-black border-b border-slate-700 shadow-lg">
      <div className="px-4 py-4 flex items-center gap-4">
        <div className="flex-shrink-0">
          <Image src="/mvbd-logo.png" alt="MVBD Logo" width={50} height={50} className="w-12 h-12" />
        </div>

        <div className="hidden sm:block">
          <h1 className="text-white font-bold text-lg">MVBD miniapp</h1>
        </div>

        {/* Search Bar */}
        <div className="flex-1 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="মুভি খুঁজুন..."
              value={searchInput}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
            />
          </div>
        </div>
      </div>
    </header>
  )
}
