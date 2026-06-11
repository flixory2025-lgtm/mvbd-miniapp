"use client"

import { useState } from "react"
import { Search, X } from "lucide-react"

// ডেমো সার্চ ডাটা
const DEMO_SEARCH_DATA = {
  football: [
    { id: "1", name: "Manchester City vs Liverpool", type: "match", league: "Premier League" },
    { id: "2", name: "Real Madrid vs Barcelona", type: "match", league: "La Liga" },
    { id: "3", name: "Bayern Munich vs Dortmund", type: "match", league: "Bundesliga" },
    { id: "4", name: "PSG vs Marseille", type: "match", league: "Ligue 1" },
  ],
  cricket: [
    { id: "101", name: "India vs Australia", type: "match", series: "Border-Gavaskar Trophy" },
    { id: "102", name: "England vs South Africa", type: "match", series: "Test Series" },
    { id: "103", name: "Pakistan vs New Zealand", type: "match", series: "ODI Series" },
  ],
}

export default function SearchPanel({ sport }: { sport: "football" | "cricket" }) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery)
    if (searchQuery.length < 2) {
      setResults([])
      return
    }

    const filtered = DEMO_SEARCH_DATA[sport].filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.league && item.league.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.series && item.series.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    setResults(filtered)
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={`Search ${sport} matches, teams, or leagues...`}
          className="h-10 w-full rounded-lg border border-white/10 bg-white/[0.04] pl-9 pr-8 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        {query && (
          <button onClick={() => handleSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="h-4 w-4 text-slate-400" />
          </button>
        )}
      </div>

      {/* Results */}
      {query.length >= 2 && (
        <div className="space-y-2">
          {results.length === 0 ? (
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-8 text-center">
              <p className="text-sm text-slate-400">No results found for "{query}"</p>
            </div>
          ) : (
            results.map((result) => (
              <div
                key={result.id}
                className="rounded-lg border border-white/10 bg-white/[0.04] p-3 transition hover:bg-white/[0.08]"
              >
                <p className="font-medium">{result.name}</p>
                <p className="text-xs text-slate-400">{result.league || result.series}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Initial State */}
      {query.length < 2 && (
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-8 text-center">
          <Search className="mx-auto h-8 w-8 text-slate-500" />
          <p className="mt-2 text-sm text-slate-400">Type at least 2 characters to search</p>
        </div>
      )}
    </div>
  )
}
