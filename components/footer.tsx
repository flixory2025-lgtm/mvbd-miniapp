export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-700 py-8 px-4 mt-12">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-white font-bold mb-4">আমাদের সম্পর্কে</h3>
            <p className="text-slate-400 text-sm">
              MoviesVerse হল বাংলাদেশের সেরা মুভি স্ট্রিমিং প্ল্যাটফর্ম যেখানে আপনি সর্বশেষ এবং ক্লাসিক মুভি উপভোগ করতে পারেন।
            </p>
          </div>
          <div>
            <h3 className="text-white font-bold mb-4">যোগাযোগ করুন</h3>
            <div className="space-y-2 text-slate-400 text-sm">
              <p>📧 Email: info@moviesverse.com</p>
              <p>📱 Telegram: @moviesversebdreq</p>
            </div>
          </div>
          <div>
            <h3 className="text-white font-bold mb-4">অনুসরণ করুন</h3>
            <div className="flex gap-4">
              <a
                href="https://www.facebook.com/groups/733950559669339/?ref=share&mibextid=NSMWBT"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition"
              >
                Facebook
              </a>
              <a
                href="https://t.me/moviesversebdreq"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400 hover:text-sky-300 transition"
              >
                Telegram
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-700 pt-8 text-center text-slate-400 text-sm">
          <p>&copy; 2025 MoviesVerse. সর্বাধিকার সংরক্ষিত।</p>
        </div>
      </div>
    </footer>
  )
}
