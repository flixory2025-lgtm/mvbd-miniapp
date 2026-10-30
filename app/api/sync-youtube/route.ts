// app/api/sync-youtube/route.ts
// Checks every enabled channel in Firestore "youtubeChannels" and posts new
// Shorts / videos into the "posts" collection (shown in MeBook feed).
//
// ENV (Vercel → Settings → Environment Variables):
//   FIREBASE_SERVICE_ACCOUNT  = full service-account JSON (one line)
//   SYNC_SECRET               = any long random string
import { NextRequest, NextResponse } from "next/server"
import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
const YT_HEADERS = {
  "User-Agent": UA,
  "Accept-Language": "en-US,en;q=0.9",
  Cookie: "CONSENT=YES+1; SOCS=CAI",
}
const MAX_NEW_PER_CHANNEL = 10

function getDb() {
  if (!getApps().length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT
    if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT env var missing")
    let json: any
    try {
      json = JSON.parse(raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8"))
    } catch {
      throw new Error("FIREBASE_SERVICE_ACCOUNT is not valid JSON")
    }
    if (json.private_key) json.private_key = json.private_key.replace(/\\n/g, "\n")
    initializeApp({ credential: cert(json) })
  }
  return getFirestore()
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "x-sync-key, content-type",
}

function decodeXml(s: string) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, "&")
}

function tag(block: string, name: string) {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`))
  return m ? decodeXml(m[1]).trim() : ""
}

type Entry = { videoId: string; title: string; description: string; published: Date; duration?: number }

// ---------- YouTube Data API (optional, recommended: works from servers) ----------
function parseIsoDuration(d: string) {
  const m = d.match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/)
  if (!m) return 0
  return (Number(m[1]) || 0) * 86400 + (Number(m[2]) || 0) * 3600 + (Number(m[3]) || 0) * 60 + (Number(m[4]) || 0)
}

async function ytApi(path: string, params: Record<string, string>) {
  const qs = new URLSearchParams({ ...params, key: process.env.YOUTUBE_API_KEY || "" })
  const r = await fetch(`https://www.googleapis.com/youtube/v3/${path}?${qs}`, { cache: "no-store" })
  const j: any = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(`YouTube API: ${j?.error?.message || r.status}`)
  return j
}

async function resolveViaApi(url: string) {
  const path = decodeURIComponent(new URL(url).pathname)
  let params: Record<string, string> | null = null
  const ch = path.match(/\/channel\/(UC[\w-]{22})/)
  const handle = path.match(/\/(@[\w.\-]+)/)
  const user = path.match(/^\/user\/([^/]+)/)
  if (ch) params = { id: ch[1] }
  else if (handle) params = { forHandle: handle[1] }
  else if (user) params = { forUsername: user[1] }
  if (!params) return null
  const j = await ytApi("channels", { part: "snippet", ...params })
  const it = j.items?.[0]
  if (!it) throw new Error("Channel not found on YouTube")
  const th = it.snippet?.thumbnails
  return {
    channelId: it.id as string,
    name: (it.snippet?.title || "") as string,
    avatar: (th?.high?.url || th?.medium?.url || th?.default?.url || "") as string,
  }
}

async function fetchEntriesApi(channelId: string): Promise<Entry[]> {
  const pl = await ytApi("playlistItems", {
    part: "contentDetails",
    playlistId: "UU" + channelId.slice(2),
    maxResults: "15",
  })
  const ids: string[] = (pl.items || []).map((i: any) => i.contentDetails?.videoId).filter(Boolean)
  if (!ids.length) return []
  const vd = await ytApi("videos", { part: "snippet,contentDetails", id: ids.join(","), maxResults: "15" })
  const entries: Entry[] = (vd.items || [])
    .filter((v: any) => v.snippet?.liveBroadcastContent !== "upcoming")
    .map((v: any) => ({
      videoId: v.id,
      title: v.snippet?.title || "",
      description: v.snippet?.description || "",
      published: new Date(v.snippet?.publishedAt || Date.now()),
      duration: parseIsoDuration(v.contentDetails?.duration || ""),
    }))
  entries.sort((a, b) => b.published.getTime() - a.published.getTime())
  return entries
}

function parseFeed(xml: string): { channelName: string; entries: Entry[] } {
  const head = xml.split("<entry>")[0]
  const channelName = tag(head, "title")
  const entries: Entry[] = []
  const re = /<entry>([\s\S]*?)<\/entry>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(xml))) {
    const b = m[1]
    const videoId = tag(b, "yt:videoId")
    if (!videoId) continue
    entries.push({
      videoId,
      title: tag(b, "media:title") || tag(b, "title"),
      description: tag(b, "media:description"),
      published: new Date(tag(b, "published") || Date.now()),
    })
  }
  entries.sort((a, b) => b.published.getTime() - a.published.getTime())
  return { channelName, entries }
}

async function resolveChannel(url: string) {
  const res = await fetch(url, { headers: YT_HEADERS, redirect: "follow" })
  if (!res.ok) throw new Error(`Channel page returned ${res.status}`)
  const html = await res.text()
  const id =
    html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[\w-]{22})"/)?.[1] ||
    html.match(/"channelId":"(UC[\w-]{22})"/)?.[1] ||
    html.match(/"externalId":"(UC[\w-]{22})"/)?.[1] ||
    html.match(/channel_id=(UC[\w-]{22})/)?.[1]
  if (!id) throw new Error("Could not find channel ID. Paste the /channel/UC... link instead.")
  const name = decodeXml(html.match(/<meta property="og:title" content="([^"]*)"/)?.[1] || "")
  const avatar = decodeXml(html.match(/<meta property="og:image" content="([^"]*)"/)?.[1] || "")
  return { channelId: id, name, avatar }
}

// A Short URL (/shorts/ID) returns 200; for normal videos YouTube redirects away.
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// YouTube sometimes answers 404 from cloud servers, so retry and fall back to the uploads playlist feed.
async function fetchFeed(channelId: string) {
  const urls = [
    `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
    `https://www.youtube.com/feeds/videos.xml?playlist_id=UU${channelId.slice(2)}`,
  ]
  let lastStatus = 0
  for (let attempt = 0; attempt < 3; attempt++) {
    for (const u of urls) {
      try {
        const r = await fetch(u, { headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" }, cache: "no-store" })
        if (r.ok) return await r.text()
        lastStatus = r.status
      } catch {
        lastStatus = 0
      }
    }
    await sleep(700)
  }
  throw new Error(`YouTube feed returned ${lastStatus || "no response"} for channel ${channelId}. If the feed opens in your browser, YouTube is blocking the server: add YOUTUBE_API_KEY in Vercel.`)
}

async function isShort(videoId: string, duration?: number) {
  try {
    const res = await fetch(`https://www.youtube.com/shorts/${videoId}`, {
      headers: YT_HEADERS,
      redirect: "manual",
    })
    if (res.status === 200) return true
    if ([301, 302, 303, 307, 308].includes(res.status)) return false
  } catch {}
  // could not tell from the URL (blocked?) -> use duration
  return typeof duration === "number" && duration > 0 && duration <= 60
}

function buildCaption(title: string, description: string) {
  const desc = description.trim().slice(0, 1800)
  return [title.trim(), desc].filter(Boolean).join("\n\n")
}

async function syncChannel(db: FirebaseFirestore.Firestore, doc: FirebaseFirestore.QueryDocumentSnapshot) {
  const ch: any = doc.data()
  const update: any = {}
  let imported = 0

  try {
    let channelId: string = ch.channelId || ""
    let name: string = ch.name || ""
    let avatar: string = ch.avatar || ""

    const hasKey = !!process.env.YOUTUBE_API_KEY
    if (!channelId) {
      let r: { channelId: string; name: string; avatar: string } | null = null
      if (hasKey) {
        try { r = await resolveViaApi(ch.url) } catch {}
      }
      if (!r) r = await resolveChannel(ch.url)
      channelId = r.channelId
      name = r.name || name
      avatar = r.avatar || avatar
    } else if (!avatar || !name) {
      try {
        const url = `https://www.youtube.com/channel/${channelId}`
        const r = (hasKey ? await resolveViaApi(url).catch(() => null) : null) || (await resolveChannel(url))
        name = name || r.name
        avatar = avatar || r.avatar
      } catch {}
    }

    let entries: Entry[] = []
    let channelName = ""
    let apiError = ""
    let loaded = false
    if (hasKey) {
      try {
        entries = await fetchEntriesApi(channelId)
        loaded = true
      } catch (e: any) {
        apiError = String(e?.message || e)
      }
    }
    if (!loaded) {
      try {
        const parsed = parseFeed(await fetchFeed(channelId))
        entries = parsed.entries
        channelName = parsed.channelName
      } catch (e: any) {
        throw new Error(apiError ? `${apiError} | ${e.message}` : e.message)
      }
    }
    update.channelId = channelId   // save the ID only after the feed worked
    name = name || channelName || "YouTube"
    if (!avatar) {
      avatar = `https://ui-avatars.com/api/?background=ef4444&color=fff&name=${encodeURIComponent(name)}`
    }
    update.name = name
    update.avatar = avatar

    // which videos are already known?
    const refs = entries.map((e) => db.collection("youtubeVideos").doc(e.videoId))
    const seenSnaps = refs.length ? await db.getAll(...refs) : []
    const unseen = entries.filter((_, i) => !seenSnaps[i].exists)

    const firstSync = !ch.lastSyncAt
    let toImport: Entry[] = []
    let toMarkOnly: Entry[] = []
    if (firstSync) {
      const n = Number(ch.initialImport) || 0
      toImport = unseen.slice(0, n)
      toMarkOnly = unseen.slice(n)
    } else {
      toImport = unseen.slice(0, MAX_NEW_PER_CHANNEL)
      toMarkOnly = unseen.slice(MAX_NEW_PER_CHANNEL)
    }

    // oldest first so feed order stays natural
    for (const e of [...toImport].reverse()) {
      const short = await isShort(e.videoId, e.duration)
      const postRef = db.collection("posts").doc(`yt_${e.videoId}`)
      await postRef.set({
        authorId: "admin",
        authorName: name,
        authorAvatar: avatar,
        verified: true,
        isOfficial: false,
        type: "youtube",
        source: "youtube",
        caption: buildCaption(e.title, e.description),
        movie: "",
        image: `https://i.ytimg.com/vi/${e.videoId}/hqdefault.jpg`,
        youtube: {
          videoId: e.videoId,
          channelId,
          isShort: short,
          title: e.title,
          url: short
            ? `https://www.youtube.com/shorts/${e.videoId}`
            : `https://www.youtube.com/watch?v=${e.videoId}`,
        },
        likes: [],
        reactions: {},
        comments: [],
        shares: 0,
        createdAt: Timestamp.fromDate(isNaN(e.published.getTime()) ? new Date() : e.published),
      })
      await db.collection("youtubeVideos").doc(e.videoId).set({
        channelId,
        postId: postRef.id,
        imported: true,
        at: FieldValue.serverTimestamp(),
      })
      imported++
    }

    for (const e of toMarkOnly) {
      await db.collection("youtubeVideos").doc(e.videoId).set({
        channelId,
        imported: false,
        at: FieldValue.serverTimestamp(),
      })
    }

    update.status = "ok"
    update.error = ""
    update.lastSyncAt = FieldValue.serverTimestamp()
    update.importedCount = (Number(ch.importedCount) || 0) + imported
  } catch (err: any) {
    update.status = "error"
    update.error = String(err?.message || err).slice(0, 300)
  }

  await doc.ref.update(update)
  return { id: doc.id, imported, status: update.status, error: update.error || undefined }
}

async function handle(req: NextRequest) {
  const secret = process.env.SYNC_SECRET
  const key =
    req.headers.get("x-sync-key") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    req.nextUrl.searchParams.get("key")
  if (!secret || key !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS })
  }

  try {
    const db = getDb()
    const snap = await db.collection("youtubeChannels").get()
    const docs = snap.docs.filter((d) => d.data().enabled !== false)

    const results = []
    for (const d of docs) results.push(await syncChannel(db, d))

    const imported = results.reduce((n, r) => n + r.imported, 0)
    return NextResponse.json({ ok: true, channels: results.length, imported, results }, { headers: CORS })
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500, headers: CORS })
  }
}

export const GET = handle
export const POST = handle
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}
