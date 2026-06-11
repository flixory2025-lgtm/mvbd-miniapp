"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";

// সব চ্যানেলের তালিকা (৭৬+ চ্যানেল)
const ALL_CHANNELS = [
  // 🏏 SPORTS (15 channels)
  { id: 1, name: "TSports HD", url: "https://bit.ly/topembed-m3u1-tsports", logo: "🏏", category: "Sports" },
  { id: 2, name: "Sports 24/7", url: "https://bit.ly/topembed-m3u1-sports24", logo: "⚽", category: "Sports" },
  { id: 3, name: "Cricket Live", url: "https://bit.ly/topembed-m3u1-cricket", logo: "🏏", category: "Sports" },
  { id: 4, name: "Football Zone", url: "https://bit.ly/topembed-m3u1-football", logo: "⚽", category: "Sports" },
  { id: 5, name: "T20 World Live", url: "https://bit.ly/topembed-m3u1-t20", logo: "🏏", category: "Sports" },
  { id: 6, name: "Premier League TV", url: "https://bit.ly/topembed-m3u1-epl", logo: "⚽", category: "Sports" },
  { id: 7, name: "IPL Live", url: "https://bit.ly/topembed-m3u1-ipl", logo: "🏏", category: "Sports" },
  { id: 8, name: "UEFA Champions", url: "https://bit.ly/topembed-m3u1-ucl", logo: "⚽", category: "Sports" },
  { id: 9, name: "ESPN", url: "https://bit.ly/topembed-m3u1-espn", logo: "📺", category: "Sports" },
  { id: 10, name: "Sky Sports", url: "https://bit.ly/topembed-m3u1-skysports", logo: "📺", category: "Sports" },
  { id: 11, name: "BT Sport", url: "https://bit.ly/topembed-m3u1-btsport", logo: "📺", category: "Sports" },
  { id: 12, name: "NBC Sports", url: "https://bit.ly/topembed-m3u1-nbc", logo: "📺", category: "Sports" },
  { id: 13, name: "Fox Sports", url: "https://bit.ly/topembed-m3u1-fox", logo: "📺", category: "Sports" },
  { id: 14, name: "Willow TV", url: "https://bit.ly/topembed-m3u1-willow", logo: "🏏", category: "Sports" },
  { id: 15, name: "Sony Ten", url: "https://bit.ly/topembed-m3u1-sonyten", logo: "📺", category: "Sports" },

  // 🎬 MOVIES (20 channels)
  { id: 16, name: "HBO HD", url: "https://bit.ly/topembed-m3u1-hbo", logo: "🎬", category: "Movies" },
  { id: 17, name: "Netflix Live", url: "https://bit.ly/topembed-m3u1-netflix", logo: "🎬", category: "Movies" },
  { id: 18, name: "Prime Video", url: "https://bit.ly/topembed-m3u1-prime", logo: "🎬", category: "Movies" },
  { id: 19, name: "Disney+", url: "https://bit.ly/topembed-m3u1-disney", logo: "🎬", category: "Movies" },
  { id: 20, name: "Hollywood Hits", url: "https://bit.ly/topembed-m3u1-hollywood", logo: "🇺🇸", category: "Movies" },
  { id: 21, name: "Bollywood HD", url: "https://bit.ly/topembed-m3u1-bollywood", logo: "🇮🇳", category: "Movies" },
  { id: 22, name: "Tollywood", url: "https://bit.ly/topembed-m3u1-tollywood", logo: "🇮🇳", category: "Movies" },
  { id: 23, name: "Korean Drama", url: "https://bit.ly/topembed-m3u1-kdrama", logo: "🇰🇷", category: "Movies" },
  { id: 24, name: "Anime World", url: "https://bit.ly/topembed-m3u1-anime", logo: "🇯🇵", category: "Cartoons" },
  { id: 25, name: "Marvel Universe", url: "https://bit.ly/topembed-m3u1-marvel", logo: "🦸", category: "Movies" },
  { id: 26, name: "DC Comics", url: "https://bit.ly/topembed-m3u1-dc", logo: "🦇", category: "Movies" },
  { id: 27, name: "Star Movies", url: "https://bit.ly/topembed-m3u1-starmovies", logo: "⭐", category: "Movies" },
  { id: 28, name: "Paramount+", url: "https://bit.ly/topembed-m3u1-paramount", logo: "📺", category: "Movies" },
  { id: 29, name: "Peacock TV", url: "https://bit.ly/topembed-m3u1-peacock", logo: "🦚", category: "Movies" },
  { id: 30, name: "MGM HD", url: "https://bit.ly/topembed-m3u1-mgm", logo: "🦁", category: "Movies" },
  { id: 31, name: "Sony Max", url: "https://bit.ly/topembed-m3u1-sonymax", logo: "📺", category: "Movies" },
  { id: 32, name: "Zee Cinema", url: "https://bit.ly/topembed-m3u1-zeecinema", logo: "📺", category: "Movies" },
  { id: 33, name: "Colors TV", url: "https://bit.ly/topembed-m3u1-colors", logo: "📺", category: "Movies" },
  { id: 34, name: "MX Player", url: "https://bit.ly/topembed-m3u1-mxplayer", logo: "📺", category: "Movies" },
  { id: 35, name: "Voot Select", url: "https://bit.ly/topembed-m3u1-voot", logo: "📺", category: "Movies" },

  // 🧸 CARTOONS (10 channels)
  { id: 36, name: "Cartoon Network", url: "https://bit.ly/topembed-m3u1-cartoon", logo: "🧸", category: "Cartoons" },
  { id: 37, name: "Nickelodeon", url: "https://bit.ly/topembed-m3u1-nick", logo: "🧸", category: "Cartoons" },
  { id: 38, name: "Disney Channel", url: "https://bit.ly/topembed-m3u1-disneych", logo: "🐭", category: "Cartoons" },
  { id: 39, name: "Pogo TV", url: "https://bit.ly/topembed-m3u1-pogo", logo: "🧸", category: "Cartoons" },
  { id: 40, name: "Cocomelon", url: "https://bit.ly/topembed-m3u1-cocomelon", logo: "🍉", category: "Cartoons" },
  { id: 41, name: "Peppa Pig", url: "https://bit.ly/topembed-m3u1-peppa", logo: "🐷", category: "Cartoons" },
  { id: 42, name: "Paw Patrol", url: "https://bit.ly/topembed-m3u1-pawpatrol", logo: "🐶", category: "Cartoons" },
  { id: 43, name: "Mickey Mouse", url: "https://bit.ly/topembed-m3u1-mickey", logo: "🐭", category: "Cartoons" },
  { id: 44, name: "SpongeBob", url: "https://bit.ly/topembed-m3u1-spongebob", logo: "🧽", category: "Cartoons" },
  { id: 45, name: "Tom & Jerry", url: "https://bit.ly/topembed-m3u1-tomjerry", logo: "🐱", category: "Cartoons" },

  // 😱 HORROR (8 channels)
  { id: 46, name: "Horror 24/7", url: "https://bit.ly/topembed-m3u1-horror", logo: "🔪", category: "Horror" },
  { id: 47, name: "Scary Movies", url: "https://bit.ly/topembed-m3u1-scary", logo: "👻", category: "Horror" },
  { id: 48, name: "Scream Factory", url: "https://bit.ly/topembed-m3u1-scream", logo: "😱", category: "Horror" },
  { id: 49, name: "Creepy Stories", url: "https://bit.ly/topembed-m3u1-creepy", logo: "🕷️", category: "Horror" },
  { id: 50, name: "Nightmare TV", url: "https://bit.ly/topembed-m3u1-nightmare", logo: "🌙", category: "Horror" },
  { id: 51, name: "Ghost Adventures", url: "https://bit.ly/topembed-m3u1-ghost", logo: "👻", category: "Horror" },
  { id: 52, name: "Zombie World", url: "https://bit.ly/topembed-m3u1-zombie", logo: "🧟", category: "Horror" },
  { id: 53, name: "Vampire Diaries", url: "https://bit.ly/topembed-m3u1-vampire", logo: "🧛", category: "Horror" },

  // 📺 WEB SERIES (12 channels)
  { id: 54, name: "Netflix Originals", url: "https://bit.ly/topembed-m3u1-netorigin", logo: "📺", category: "Web Series" },
  { id: 55, name: "Prime Originals", url: "https://bit.ly/topembed-m3u1-primeorigin", logo: "📺", category: "Web Series" },
  { id: 56, name: "Hotstar Specials", url: "https://bit.ly/topembed-m3u1-hotstar", logo: "📺", category: "Web Series" },
  { id: 57, name: "Sony LIV", url: "https://bit.ly/topembed-m3u1-sonyliv", logo: "📺", category: "Web Series" },
  { id: 58, name: "Zee5 Originals", url: "https://bit.ly/topembed-m3u1-zee5", logo: "📺", category: "Web Series" },
  { id: 59, name: "ALTBalaji", url: "https://bit.ly/topembed-m3u1-altbalaji", logo: "📺", category: "Web Series" },
  { id: 60, name: "MX Originals", url: "https://bit.ly/topembed-m3u1-mxorigin", logo: "📺", category: "Web Series" },
  { id: 61, name: "Web Series Hits", url: "https://bit.ly/topembed-m3u1-webhits", logo: "📺", category: "Web Series" },
  { id: 62, name: "Binge Watch", url: "https://bit.ly/topembed-m3u1-binge", logo: "🍿", category: "Web Series" },
  { id: 63, name: "Crime Series", url: "https://bit.ly/topembed-m3u1-crime", logo: "🔍", category: "Web Series" },
  { id: 64, name: "Comedy Series", url: "https://bit.ly/topembed-m3u1-comedy", logo: "😂", category: "Web Series" },
  { id: 65, name: "Drama Series", url: "https://bit.ly/topembed-m3u1-drama", logo: "🎭", category: "Web Series" },

  // 📺 TV SERIALS (10 channels)
  { id: 66, name: "Star Plus", url: "https://bit.ly/topembed-m3u1-starplus", logo: "⭐", category: "TV Serials" },
  { id: 67, name: "Colors TV", url: "https://bit.ly/topembed-m3u1-colorstv", logo: "🎨", category: "TV Serials" },
  { id: 68, name: "Zee TV", url: "https://bit.ly/topembed-m3u1-zeetv", logo: "📺", category: "TV Serials" },
  { id: 69, name: "Sony SAB", url: "https://bit.ly/topembed-m3u1-sab", logo: "📺", category: "TV Serials" },
  { id: 70, name: "&TV", url: "https://bit.ly/topembed-m3u1-andtv", logo: "📺", category: "TV Serials" },
  { id: 71, name: "Sun TV", url: "https://bit.ly/topembed-m3u1-suntv", logo: "☀️", category: "TV Serials" },
  { id: 72, name: "Star Vijay", url: "https://bit.ly/topembed-m3u1-vijay", logo: "⭐", category: "TV Serials" },
  { id: 73, name: "Asianet", url: "https://bit.ly/topembed-m3u1-asianet", logo: "📺", category: "TV Serials" },
  { id: 74, name: "Kannada TV", url: "https://bit.ly/topembed-m3u1-kannada", logo: "📺", category: "TV Serials" },
  { id: 75, name: "Bangla TV", url: "https://bit.ly/topembed-m3u1-bangla", logo: "🇧🇩", category: "TV Serials" },

  // 🔞 ADULT (18+)
  { id: 76, name: "Mature Content 1", url: "https://bit.ly/topembed-m3u1-adult1", logo: "🔞", category: "Adult", adult: true },
  { id: 77, name: "Mature Content 2", url: "https://bit.ly/topembed-m3u1-adult2", logo: "🔞", category: "Adult", adult: true },
];

const CATEGORIES = [
  { name: "All", icon: "🎯" },
  { name: "Sports", icon: "🏏" },
  { name: "Movies", icon: "🎬" },
  { name: "Cartoons", icon: "🧸" },
  { name: "Horror", icon: "👻" },
  { name: "Web Series", icon: "📺" },
  { name: "TV Serials", icon: "⭐" },
];

interface ChannelListProps {
  onSelectChannel: (channel: any) => void;
  onClose: () => void;
}

export default function ChannelList({ onSelectChannel, onClose }: ChannelListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showAdult, setShowAdult] = useState(false);
  const [ageVerified, setAgeVerified] = useState(false);

  const filteredChannels = ALL_CHANNELS.filter((channel) => {
    if (!showAdult && channel.adult) return false;
    if (selectedCategory !== "All" && channel.category !== selectedCategory) return false;
    if (searchQuery && !channel.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleAdultToggle = () => {
    if (!ageVerified) {
      const confirm = window.confirm("⚠️ Adult Content Warning!\n\nThis content is for 18+ users only. Do you confirm you are above 18?");
      if (confirm) {
        setAgeVerified(true);
        setShowAdult(true);
      }
    } else {
      setShowAdult(!showAdult);
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/95 p-4 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-black/95 py-3">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
              LIVE TV Channels
            </h2>
            <p className="text-sm text-slate-400 mt-1">77+ Channels | Free Streaming</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
                selectedCategory === cat.name
                  ? "bg-emerald-500 text-white"
                  : "bg-white/10 text-slate-300 hover:bg-white/20"
              }`}
            >
              <span className="mr-2">{cat.icon}</span>
              {cat.name}
            </button>
          ))}
          <button
            onClick={handleAdultToggle}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
              showAdult ? "bg-red-600 text-white" : "bg-white/10 text-slate-300 hover:bg-white/20"
            }`}
          >
            🔞 Adult {showAdult ? "✓" : ""}
          </button>
        </div>

        {/* Adult Warning */}
        {!ageVerified && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-center">
            <p className="text-sm text-red-300">🔞 Adult content hidden. Click the "Adult" button above to verify age (18+).</p>
          </div>
        )}

        {/* Channels Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {filteredChannels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => onSelectChannel(channel)}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition text-left group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{channel.logo}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{channel.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20">
                      {channel.category}
                    </span>
                    <span className="text-[10px] text-emerald-400">● LIVE</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* No Results */}
        {filteredChannels.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400">No channels found</p>
          </div>
        )}
      </div>
    </div>
  );
}
