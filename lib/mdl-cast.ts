/**
 * MyDramaList (MDL) Cast Fetcher
 *
 * K-Drama, J-Drama, C-Drama-র জন্য নির্ভরযোগ্য সোর্স।
 * TMDB-তে K-Drama-র cast কম থাকলে এটা কাজে লাগবে।
 *
 * ব্যবহৃত হয়: kuryana.vercel.app (unofficial scraper API)
 */

export type MdlCastMember = {
  id: string
  name: string
  character: string
  profilePath: string | null
}

/**
 * MyDramaList-এ টাইটেল দিয়ে search করে slug বের করে আনে।
 */
export async function searchMdlSlug(
  title: string
): Promise<string | null> {
  if (!title) return null

  try {
    const res = await fetch(
      `https://kuryana.vercel.app/search/${encodeURIComponent(title)}`,
      {
        next: { revalidate: 86400 },
      }
    )

    if (!res.ok) return null

    const data = await res.json()

    // Response structure ভিন্ন হতে পারে — সব সম্ভাব্য key চেক করি
    const results =
      data.results ||
      data.data ||
      data.items ||
      (Array.isArray(data) ? data : [])

    if (!Array.isArray(results) || results.length === 0) return null

    const best = results[0]
    return best.slug || best.id || best.url || null
  } catch (error) {
    console.error("MDL slug search failed:", error)
    return null
  }
}

/**
 * একটা slug দিয়ে MDL থেকে কাস্ট আনে।
 */
export async function fetchMdlCast(
  mdlSlug: string
): Promise<MdlCastMember[] | null> {
  if (!mdlSlug) return null

  try {
    const res = await fetch(
      `https://kuryana.vercel.app/id/${encodeURIComponent(mdlSlug)}/cast`,
      {
        next: { revalidate: 86400 },
      }
    )

    if (!res.ok) {
      console.warn(`MDL API error: ${res.status}`)
      return null
    }

    const data = await res.json()

    const castArray =
      data.cast ||
      data.data ||
      data.items ||
      (Array.isArray(data) ? data : [])

    if (!Array.isArray(castArray) || castArray.length === 0) return null

    return castArray.slice(0, 20).map((actor: any, index: number) => ({
      id: String(actor.id || `mdl-${index}`),
      name: actor.name || actor.actorName || "Unknown",
      character:
        actor.role || actor.character || actor.characterName || "",
      profilePath:
        actor.image || actor.imageUrl || actor.profilePath || null,
    }))
  } catch (error) {
    console.error("MDL cast fetch failed:", error)
    return null
  }
}

/**
 * একটা টাইটেল দিয়ে সরাসরি MDL কাস্ট আনার হাইব্রিড ফাংশন।
 * এটাই API route থেকে call হয়।
 */
export async function fetchMdlCastByTitle(
  title: string
): Promise<MdlCastMember[] | null> {
  const slug = await searchMdlSlug(title)
  if (!slug) return null
  return await fetchMdlCast(slug)
}
