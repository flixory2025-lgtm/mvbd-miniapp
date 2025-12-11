"use client"

import Image from "next/image"

const exclusiveContent = [
  {
    id: 1,
    title: "《All of Us Are Dead (2022)》",
    storyline:
      "একটি হাইস্কুলে ছড়িয়ে পড়ে ভয়ংকর ভাইরাস, যা ছাত্রদের জম্বিতে রূপান্তরিত করে। বেঁচে থাকা ক’জন শিক্ষার্থী স্কুলের ভেতর আটকে গিয়ে জীবন-মরণের লড়াই শুরু করে।",
    screenshots: ["/AllofUsAreDead1.jpg", "/AllofUsAreDead2.jpg", "/AllofUsAreDead3.jpg"],
  },
  {
    id: 2,
    title: "《Grave Torture (2024)》",
    storyline:
      "একদল কিশোর মজা করে পুরনো কবরস্থান ঘুরে ভিডিও বানাতে গিয়ে ভুল করে এক অপদেবতাকে জাগিয়ে তোলে, যার অভিশাপ তাদের মানসিক ও শারীরিকভাবে ধ্বংস করতে শুরু করে।",
    screenshots: ["/Grave1.jpg", "/Grave2.jpg", "/Grave3.jpg"],
  },
  {
    id: 3,
    title: "《Kutukan Cakar Monyet (2023)》",
    storyline:
      "এক বনাঞ্চলে পাওয়া রহস্যময় বানরের নখের অভিশাপ যাকে ছোঁয়, তার জীবন ট্র্যাজেডিতে ভরে ওঠে। অভিশাপ থামাতে নায়িকাকে খুঁজে বের করতে হয় এর অন্ধকার উৎস।",
    screenshots: ["/Kutukan1.jpg", "/Kutukan2.jpg", "/Kutukan3.jpg", "/Kutukan4.jpg"],
  },
  {
    id: 4,
    title: "《Satan’s Slaves 2: Communion (2022)》",
    storyline:
      "প্রথম ঘটনার পর পরিবারের সদস্যরা একটি অ্যাপার্টমেন্টে উঠে শান্তির আশা করে, কিন্তু এখানে উপস্থিত শয়তানি শক্তি আগের চেয়েও বেশি শক্তিশালী। বৃষ্টিভেজা রাতে শুরু হয় মৃত্যু ও দুঃস্বপ্নের নতুন অধ্যায়।",
    screenshots: ["/Satan1.jpg", "/Satan2.jpg", "/Satan3.jpg"],
  },
  {
    id: 5,
    title: "《Khanzab (2023)》",
    storyline:
      "এক ভুতুড়ে গ্রামে এক কিশোরী তার বাবার হত্যার ট্রমা নিয়ে বাঁচতে চেষ্টা করে, কিন্তু রাত বাড়লেই তাকে তাড়া করে ‘খানজাব’ নামের একটি দানব—যা মানুষের ভয়কে শক্তি হিসেবে খায়।",
    screenshots: ["/Khanzab1.jpg", "/Khanzab2.jpg", "/Khanzab3.jpg", "/Khanzab4.jpg"],
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
