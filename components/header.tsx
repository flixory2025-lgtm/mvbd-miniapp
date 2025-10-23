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
    <header className="sticky top-0 z-40 bg-gradient-to-b from-slate-900 to-slate-800 border-b border-slate-700 shadow-lg">
      <div className="px-4 py-4 flex items-center gap-4">
        {/* Logo */}
        <div className="flex-shrink-0">
          <svg viewBox="0 0 200 200" className="w-10 h-10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="40" y="60" width="120" height="100" rx="12" fill="#22c55e" />
            <rect x="60" y="80" width="80" height="60" fill="white" />
            <path d="M 90 100 L 110 110 L 90 120 Z" fill="#22c55e" />
            <circle cx="70" cy="50" r="8" fill="#22c55e" />
            <circle cx="130" cy="50" r="8" fill="#22c55e" />
            <line x1="70" y1="50" x2="90" y2="70" stroke="#22c55e" strokeWidth="4" />
            <line x1="130" y1="50" x2="110" y2="70" stroke="#22c55e" strokeWidth="4" />
          </svg>
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
