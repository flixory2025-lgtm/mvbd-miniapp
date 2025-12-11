"use client"

import Image from "next/image"

const exclusiveContent = [
  {
    id: 1,
    title: "Pushpa 2: The Rule - Behind The Scenes",
    storyline:
      "Pushpa Raj এর journey continue হয়েছে এই sequel এ। Smuggling empire বড় করতে গিয়ে সে face করছে আরও বড় challenges। SP Bhanwar Singh Shekhawat এর সাথে তার clash এবারে আরও intense।",
    screenshots: ["/pushpa-2-action-scene.jpg", "/placeholder-s6o33.png", "/pushpa-2-dramatic-scene.jpg"],
  },
  {
    id: 2,
    title: "Moana 2 - Exclusive Preview",
    storyline:
      "Moana তার ancestral call এ respond করে বেরিয়ে পড়েছে আরেকটি adventure এ। এবার সে far seas of Oceania তে travel করবে এবং face করবে dangerous waters।",
    screenshots: ["/moana-2-ocean-scene.jpg", "/moana-2-maui-scene.jpg", "/moana-2-adventure-scene.jpg"],
  },
  {
    id: 3,
    title: "Gladiator II - Epic Moments",
    storyline:
      "Lucius, Maximus এর legacy carry করে Rome এর arena তে return করেছে। Political conspiracy এবং personal revenge এর মধ্যে সে fight করছে survival এবং honor এর জন্য।",
    screenshots: ["/gladiator-2-colosseum-fight.jpg", "/placeholder-issax.png", "/gladiator-2-epic-battle.jpg"],
  },
  {
    id: 4,
    title: "Singham Again - Action Highlights",
    storyline:
      "Bajirao Singham এবার face করছে সবচেয়ে dangerous villain কে। Lady Singham সহ পুরো team মিলে এই epic showdown এ অংশ নিচ্ছে।",
    screenshots: ["/singham-again-action-scene.jpg", "/placeholder-0j9ll.png", "/placeholder.svg?height=200&width=350"],
  },
]

export default function ExclusivePage() {
  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Header with Logo */}
      <div className="sticky top-0 z-40 bg-black border-b border-slate-700 px-4 py-4">
        <div className="flex items-center justify-center">
          <Image src="/mvbd-logo.png" alt="MVBD Logo" width={120} height={120} className="w-24 h-24 object-contain" />
        </div>
      </div>

      {/* Exclusive Content */}
      <div className="px-4 py-6">
        <h2 className="text-2xl font-bold text-white mb-6">Exclusive Content</h2>

        <div className="space-y-8">
          {exclusiveContent.map((content) => (
            <div key={content.id} className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
              {/* Screenshots Carousel */}
              <div className="flex gap-2 p-4 overflow-x-auto scrollbar-hide">
                {content.screenshots.map((screenshot, idx) => (
                  <img
                    key={idx}
                    src={screenshot || "/placeholder.svg"}
                    alt={`${content.title} screenshot ${idx + 1}`}
                    className="w-64 h-36 object-cover rounded-lg flex-shrink-0"
                  />
                ))}
              </div>

              {/* Info */}
              <div className="px-4 pb-4">
                <h3 className="text-white font-bold text-lg mb-2">{content.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{content.storyline}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
