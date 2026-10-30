// scripts/build-ai-knowledge.mjs
// Runs in GitHub Actions on every push. Reads the site's own source files and writes
// the data the MVBD AI Worker reads:
//   ai/movies-index.json  every movie/series/anime (title, year, language, genre, rating, addedAt)
//   ai/site-facts.md      plans, prices, payment number, tabs, links, counts (from the real code)
//   ai/news.md            newly added titles + commits whose message starts with "news:"
// ai/site-guide.md is written by hand (how-to steps) and is NOT touched by this script.
//
// Download links (telegramLink / telegram4kLink) are intentionally NOT exported.

import { execSync } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"

const read = (p) => (existsSync(p) ? readFileSync(p, "utf8") : "")
mkdirSync("ai", { recursive: true })

const today = new Date().toISOString().slice(0, 10)

// ---------------------------------------------------------------- movies
function parseTitles(file, kind) {
  const src = read(file)
  const parts = src.split(/\bid:\s*(\d+)\s*,/)
  const rows = []
  for (let i = 1; i < parts.length; i += 2) {
    const id = Number(parts[i])
    const body = parts[i + 1].slice(0, 2500) // fields sit right after the id
    const pick = (key) => {
      const m = body.match(new RegExp(`\\b${key}:\\s*(["'\`])((?:\\\\.|(?!\\1)[^\\\\])*)\\1`))
      return m ? m[2].replace(/\\(["'`])/g, "$1").trim() : ""
    }
    const title = pick("title")
    if (!title) continue
    rows.push({
      id: `${kind}${id}`,
      title,
      year: pick("year"),
      language: pick("language"),
      genre: pick("genre"),
      rating: pick("rating"),
      type: kind === "a" ? "anime" : "movie/series",
    })
  }
  return rows
}

const rows = [
  ...parseTitles("lib/movie-data.ts", "m"),
  ...parseTitles("lib/movie-data2.ts", "m"),
  ...parseTitles("lib/movie-data3.ts", "m"),
  ...parseTitles("lib/movie-data4.ts", "m"),
  ...parseTitles("lib/anime-data.ts", "a"),
]

// keep addedAt from the previous run, stamp today's date on titles that are new
let previous = []
try {
  previous = JSON.parse(read("ai/movies-index.json") || "[]")
} catch {}
const prevMap = new Map(previous.map((r) => [r.id, r]))
const firstRun = previous.length === 0
const movies = rows.map((r) => ({
  ...r,
  addedAt: prevMap.get(r.id)?.addedAt ?? (firstRun ? "" : today),
}))
writeFileSync("ai/movies-index.json", JSON.stringify(movies))

const newlyAdded = firstRun ? [] : movies.filter((m) => !prevMap.has(m.id))

// ---------------------------------------------------------------- plans
const plansSrc = read("lib/subscription-plans.ts")
const payNumber = (plansSrc.match(/PAYMENT_NUMBER\s*=\s*"([^"]+)"/) || [])[1] || ""
const planBlocks = plansSrc.split(/\{\s*\n\s*planId:/).slice(1)
const plans = planBlocks.map((b) => {
  const g = (k) => (b.match(new RegExp(`${k}:\\s*"([^"]*)"`)) || [])[1] || ""
  const n = (k) => (b.match(new RegExp(`${k}:\\s*(\\d+)`)) || [])[1] || ""
  const features = [...b.matchAll(/text:\s*"([^"]+)"/g)].map((m) => m[1])
  return {
    id: (b.match(/^\s*"([^"]+)"/) || [])[1] || "",
    name: g("planName"),
    price: g("price"),
    days: n("durationDays"),
    quality: g("videoQuality"),
    description: g("description"),
    save: g("save"),
    features,
  }
}).filter((p) => p.name && p.price)

// ---------------------------------------------------------------- tabs + links
const nav = read("components/bottom-navigation.tsx")
const tabs = [...nav.matchAll(/id:\s*"([^"]+)"[^}]{0,80}?label:\s*"([^"]+)"/g)].map((m) => `${m[2]} (${m[1]})`)

const linkSrc = ["components/footer.tsx", "components/genre-categories.tsx", "components/contact-us-page.tsx", "lib/subscription-plans.ts"]
  .map(read)
  .join("\n")
const links = [
  ...new Set(
    [...linkSrc.matchAll(/https?:\/\/(?:t\.me|www\.facebook\.com|wa\.me|www\.instagram\.com|www\.tiktok\.com|youtube\.com\/@)[^"'`\s)<>]*/g)]
      .map((m) => m[0])
      .filter((u) => !u.includes("${")),
  ),
]

const genresMatch = read("lib/movie-data.ts").match(/export const genres\s*=\s*\[([\s\S]*?)\]/)
const genres = genresMatch ? [...genresMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]) : []

const byLang = {}
for (const m of movies) {
  const k = (m.language || "unknown").toLowerCase()
  byLang[k] = (byLang[k] || 0) + 1
}

const facts = `# MVBD SITE FACTS (auto-generated ${today} from the site code — do not edit by hand)

## Library size
- Total titles in the database: ${movies.length} (movies, series and anime)
- Main languages (approx. counts, raw labels): ${Object.entries(byLang)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 6)
  .map(([k, v]) => `${k} ${v}`)
  .join(", ")}
- Genres/categories on the site: ${genres.filter((g) => g !== "All").join(", ")}

## Plans and prices (from the code)
${plans
  .map(
    (p) =>
      `### ${p.name}${p.id ? ` (${p.id})` : ""}\n- Price: ${p.price}${p.days ? ` for ${p.days} days` : ""}${p.save ? ` (${p.save})` : ""}\n- Video quality: ${p.quality}\n- ${p.description}\n- Includes: ${p.features.join("; ")}`,
  )
  .join("\n\n")}

## Payment
- Premium payment number shown in the app: ${payNumber}
- A new account gets a 7-day free trial automatically.

## Main tabs in the app
${tabs.map((t) => `- ${t}`).join("\n")}

## Official links found in the app
${links.map((l) => `- ${l}`).join("\n")}
`
writeFileSync("ai/site-facts.md", facts)

// ---------------------------------------------------------------- news
let commitNews = []
try {
  const log = execSync('git log --since="90 days ago" --pretty=format:"%ad|%s" --date=short', { encoding: "utf8" })
  commitNews = log
    .split("\n")
    .map((l) => l.split("|"))
    .filter(([, s]) => /^(news|update)\s*:/i.test(s || ""))
    .map(([d, ...s]) => `- ${d}: ${s.join("|").replace(/^(news|update)\s*:\s*/i, "").trim()}`)
} catch {}

// remember newly added titles across runs (kept in ai/news-added.json)
let addedLog = []
try {
  addedLog = JSON.parse(read("ai/news-added.json") || "[]")
} catch {}
if (newlyAdded.length) addedLog.unshift({ date: today, titles: newlyAdded.map((m) => m.title) })
addedLog = addedLog.slice(0, 60)
writeFileSync("ai/news-added.json", JSON.stringify(addedLog, null, 1))

const news = `# MVBD LATEST UPDATES (auto-generated ${today})

## Announcements and changes
${commitNews.length ? commitNews.join("\n") : "- No announcements recorded yet."}

## Recently added movies, series and anime
${
  addedLog.length
    ? addedLog.map((e) => `### ${e.date}\n${e.titles.slice(0, 40).map((t) => `- ${t}`).join("\n")}${e.titles.length > 40 ? `\n- ...and ${e.titles.length - 40} more` : ""}`).join("\n\n")
    : "- Tracking starts from today; new titles added after this point will be listed here."
}
`
writeFileSync("ai/news.md", news)

console.log(`ai data built: ${movies.length} titles, ${plans.length} plans, ${tabs.length} tabs, ${links.length} links, ${newlyAdded.length} new`)
