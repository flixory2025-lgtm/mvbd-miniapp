// lib/mdl-cast.ts
// এই ফাইলটি MyDramaList API কল করে কাস্ট ডেটা ফেচ করবে।

export async function fetchMdlCast(mdlSlug: string) {
  try {
    // MyDramaList-এর আনঅফিসিয়াল স্ক্র্যাপার API
    const res = await fetch(`https://kuryana.vercel.app/id/${mdlSlug}/cast`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;

    const data = await res.json();
    // API রেসপন্স থেকে কাস্ট লিস্ট বের করুন
    return data.cast || [];
  } catch (error) {
    console.error("MDL Cast Error:", error);
    return null;
  }
}
