// app/api/cast/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fetchImdbCast } from "@/lib/imdb-cast";
import { fetchMdlCast } from "@/lib/mdl-cast";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title");
  const year = searchParams.get("year");
  const mediaType = searchParams.get("mediaType") || "movie";
  const tmdbId = searchParams.get("tmdbId");
  const imdbId = searchParams.get("imdbId"); // আপনার movie-data.ts-এ এই আইডি থাকলে পাঠাতে হবে
  const mdlId = searchParams.get("mdlId"); // K-Drama-র MyDramaList স্লাগ

  const token = process.env.TMDB_TOKEN;
  const headers = { Authorization: `Bearer ${token}`, accept: "application/json" };

  // --- ধাপ ১: TMDB API (আপনার বর্তমান সিস্টেম) ---
  if (token) {
    try {
      let matchedId = tmdbId ? parseInt(tmdbId) : null;

      if (!matchedId && title) {
        // ... (আপনার আগের TMDB সার্চ করার কোড)
      }

      if (matchedId) {
        const creditsEndpoint = mediaType === "anime" ? `tv/${matchedId}/credits` : `movie/${matchedId}/credits`;
        const creditsRes = await fetch(`https://api.themoviedb.org/3/${creditsEndpoint}?language=en-US`, { headers, next: { revalidate: 86400 } });
        if (creditsRes.ok) {
          const creditsData = await creditsRes.json();
          if (creditsData.cast && creditsData.cast.length > 0) {
            return NextResponse.json({ cast: creditsData.cast.slice(0, 20).map((actor: any) => ({ id: actor.id, name: actor.name, character: actor.character || "", profilePath: actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : null })) });
          }
        }
      }
    } catch (err) {
      console.error("TMDB Cast Fetch Error:", err);
    }
  }

  // --- ধাপ ২: IMDb API (বাংলা মুভি/নাটকের জন্য) ---
  if (imdbId) {
    const imdbCast = await fetchImdbCast(imdbId);
    if (imdbCast && imdbCast.length > 0) {
      return NextResponse.json({ cast: imdbCast.map((actor: any) => ({ id: actor.id, name: actor.name, character: actor.character || "", profilePath: actor.image || null })) });
    }
  }

  // --- ধাপ ৩: MyDramaList API (K-Drama-র জন্য) ---
  if (mdlId) {
    const mdlCast = await fetchMdlCast(mdlId);
    if (mdlCast && mdlCast.length > 0) {
      return NextResponse.json({ cast: mdlCast.map((actor: any) => ({ id: actor.id, name: actor.name, character: actor.character || "", profilePath: actor.image || null })) });
    }
  }

  // কিছু না পেলে খালি অ্যারে
  return NextResponse.json({ cast: [] });
}
