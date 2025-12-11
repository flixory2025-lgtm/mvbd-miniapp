"use client"

import Image from "next/image"

const updates = [
  {
    id: 1,
    title: "Avatar: Fire and Ash",
    description: "জেমস ক্যামেরনের বিশ্ব বিখ্যাত ‘অ্যাভাটার’ সিরিজের তৃতীয় কিস্তি — একটি ভিন্ন উপজাতি গল্প নিয়ে।",
    poster: "/up1.jpg",
    date: "19 ডিসেম্বর 2025",
  },
  {
    id: 2,
    title: "Marty Supreme",
    description: "অ্যাকশন / ড্রামা — একটি নতুন চরিত্রের কেন্দ্রিক গল্প।",
    poster: "/up2.jpg",
    date: "25 ডিসেম্বর 2025",
  },
  {
    id: 3,
    title: "Anaconda (2025)",
    description: "হাস্যরসধর্মী অ্যাডভেঞ্চার — পুরনো অ্যানাকন্ডা থিম থেকে অনুপ্রাণিত গল্প।",
    poster: "/up3.jpg",
    date: "25 ডিসেম্বর 2025",
  },
  {
    id: 4,
    title: "The Raja Saab",
    description: "প্রভাস অভিনীত হিন্দি সিনেমা, দক্ষিণ-পূর্ব ভাবনার সাথে পারিবারিক গল্প।",
    poster: "/up4.jpg",
    date: "9 জানুয়ারি ২০২৬",
  },
  {
    id: 5,
    title: "Border 2",
    description: "সানি দেওল ও বরুণ ধাওয়ান অভিনীত অ্যাকশন/থ্রিলার সিক্যুয়াল (বলিউড)",
    poster: "/up5.jpg",
    date: "23 জানুয়ারি ২০২৬",
  },
   {
    id: 6,
    title: "Return to Silent Hill",
    description: "বিখ্যাত ভিডিও গেম সিরিজ ভিত্তিক হরর — মনস্তাত্ত্বিক থ্রিল।",
    poster: "/up6.jpg",
    date: "23 জানুয়ারি ২০২৬",
  },
  {
    id: 7,
    title: "Scream 7",
    description: "জনপ্রিয় ‘স্ক্রিম’ হরর থ্রিলার সিরিজের সপ্তম কিস্তি।",
    poster: "/up7.jpg",
    date: "27 ফেব্রুয়ারি ২০২৬",
  },
  {
    id: 8,
    title: "Mitin: Ekti Khunir Sandhaney",
    description: "অ্যাকশন-থ্রিলার; জনপ্রিয় বাঙালি গোয়েন্দা মিটিন মাস্টার সিরিজের তৃতীয় এন্টারটেইনিং এন্ট্রি।",
    poster: "/up8.jpg",
    date: "25 ডিসেম্বর ২০২৫",
  },
  {
    id: 9,
    title: "Vijaynagar’er Hirey",
    description: "বিখ্যাত উপন্যাস অবলম্বনে অ্যাকশন-অ্যাডভেঞ্চার; জনকাবু চরিত্রে প্রসেনজিৎ চ্যাটার্জি।",
    poster: "/up9.jpg",
    date: "23 জানুয়ারি ২০২৬",
  },
  {
    id: 10,
    title: "ভানুপ্রিয়া ভূতের হোটেল",
    description: "ফ্যান্টাসি-কমেডি গল্প; টলিউড-এর বড় নির্মাতাদের নতুন ছবি।",
    poster: "/up10.jpg",
    date: "23 জানুয়ারি ২০২৬",
  },
  {
    id: 11,
    title: "হোক কলরব",
    description: "বাংলা মুভি-র লিস্টে পূর্ব ক্যালেন্ডারের অংশ হিসেবে বিজ্ঞপ্তি পাওয়া গেছে।",
    poster: "/up11.jpg",
    date: "23 জানুয়ারি ২০২৬",
  },
  {
    id: 12,
    title: "নারী চরিত্র বেজায় জটিল",
    description: "কলকাতা-ভিত্তিক বাংলা ছবি (তালিকাতে ঘোষণা)।",
    poster: "/up12.jpg",
    date: "২৩ জানুয়ারি ২০২৬",
  },
  {
    id: 13,
    title: "কর্পূর",
    description: "নতুন বছরের ফেভারিট ছবি হিসেবে তালিকাভুক্ত।",
    poster: "/up13.jpg",
    date: "7 ফেব্রুয়ারি ২০২৬",
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
