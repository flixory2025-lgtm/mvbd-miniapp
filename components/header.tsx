"use client"

import type React from "react"

import { useState } from "react"
import { Search } from "lucide-react"

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
      <div className="px-4 py-3 flex items-center gap-4">
        <div className="flex-shrink-0">
          <img
            src="https://i.postimg.cc/0yqFXMFW/photo-2025-12-11-09-45-29-removebg-preview.png"
            alt="MVBD Logo"
            className="h-10 w-auto object-contain"
          />
        </div>

        <div className="flex-1 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="মুভি খুঁজুন..."
              value={searchInput}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 bg-black border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
            />
          </div>
        </div>
      </div>
    </header>
  )
}
