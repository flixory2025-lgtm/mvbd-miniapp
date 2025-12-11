"use client"

import Image from "next/image"

const updates = [
  {
    id: 1,
    title: "Pushpa 2: The Rule",
    description: "Pushpa 2 এখন আমাদের collection এ যোগ হয়েছে! Hindi Dubbed এবং Original Telugu দুটোই available।",
    poster: "/placeholder-bn3pp.png",
    date: "১০ ডিসেম্বর ২০২৫",
  },
  {
    id: 2,
    title: "Moana 2",
    description: "Disney এর জনপ্রিয় animated movie Moana 2 এখন Bengali Dubbed সহ available।",
    poster: "/moana-2-disney-movie-poster.jpg",
    date: "৯ ডিসেম্বর ২০২৫",
  },
  {
    id: 3,
    title: "Gladiator II",
    description: "Ridley Scott এর epic sequel Gladiator II HD quality তে upload হয়েছে।",
    poster: "/gladiator-2-movie-poster.png",
    date: "৮ ডিসেম্বর ২০২৫",
  },
  {
    id: 4,
    title: "Venom: The Last Dance",
    description: "Venom trilogy এর final chapter এখন available! 4K quality তে দেখুন।",
    poster: "/venom-last-dance-movie-poster.jpg",
    date: "৭ ডিসেম্বর ২০২৫",
  },
  {
    id: 5,
    title: "Singham Again",
    description: "Ajay Devgn এর blockbuster action movie Singham Again এখন upload হয়েছে।",
    poster: "/placeholder-7cvtq.png",
    date: "৬ ডিসেম্বর ২০২৫",
  },
]

export default function UpdatesPage() {
  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Header with Logo */}
      <div className="sticky top-0 z-40 bg-black border-b border-slate-700 px-4 py-4">
        <div className="flex items-center justify-center">
          <Image src="/mvbd-logo.png" alt="MVBD Logo" width={120} height={120} className="w-24 h-24 object-contain" />
        </div>
      </div>

      {/* Updates List */}
      <div className="px-4 py-6">
        <h2 className="text-2xl font-bold text-white mb-6">সাম্প্রতিক Updates</h2>

        <div className="space-y-4">
          {updates.map((update) => (
            <div key={update.id} className="bg-slate-900 rounded-xl p-4 border border-slate-800 flex gap-4">
              <img
                src={update.poster || "/placeholder.svg"}
                alt={update.title}
                className="w-20 h-28 object-cover rounded-lg flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-lg mb-1">{update.title}</h3>
                <p className="text-slate-400 text-sm mb-2 line-clamp-3">{update.description}</p>
                <p className="text-green-500 text-xs font-medium">{update.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
