// lib/imdb-cast.ts
// এই ফাইলটি IMDb API কল করে কাস্ট ডেটা ফেচ করবে।
// আপনি Omkar Cloud বা Apify-র ফ্রি/পেইড প্ল্যান ব্যবহার করতে পারেন।

export async function fetchImdbCast(imdbId: string) {
  const apiKey = process.env.IMDB_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://api.omkar.cloud/v1/imdb/title/cast?titleId=${imdbId}`,
      {
        headers: { "x-api-key": apiKey },
        next: { revalidate: 86400 },
      }
    );
    if (!res.ok) return null;

    const data = await res.json();
    // API রেসপন্স থেকে কাস্ট লিস্ট বের করুন
    return data.cast || [];
  } catch (error) {
    console.error("IMDb Cast Error:", error);
    return null;
  }
}
