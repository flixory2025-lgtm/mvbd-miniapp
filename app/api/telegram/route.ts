import { NextRequest, NextResponse } from "next/server";
import * as data1 from "@/lib/movie-data";
import * as data2 from "@/lib/movie-data2";
import * as data3 from "@/lib/movie-data3";
import * as data4 from "@/lib/movie-data4";

export const runtime = "nodejs";
export const maxDuration = 30;

const TOKEN = process.env.BOT_TOKEN || "";
const SECRET = process.env.WEBHOOK_SECRET || "";
const GROUP_ID = "-1003787014725";
const ADMIN_ID = 6643046428;
const WATCH_LINK = "https://mvbds.xyz";

const KEYWORDS = ["movie", "cinema", "series", "film"];
const FILLER = new Set([
  "ache", "ase", "ki", "kina", "ta", "ti", "ar", "er", "dao", "den", "deo", "dilen", "din",
  "please", "plz", "pls", "request", "chai", "chacchi", "lagbe", "khujchi", "bhai", "vai",
  "bro", "admin", "ekta", "ei", "oi", "eita", "ota", "download", "link", "dekhte", "dekhbo",
  "hobe", "hoy", "nei", "nai", "mini", "app", "me",
  "আছে", "কি", "কী", "দেন", "দাও", "চাই", "লাগবে", "ভাই", "প্লিজ",
]);

// ---------- মুভি লিস্ট (একবার বানিয়ে ক্যাশ) ----------
function norm(s: string) {
  return s.toLowerCase().replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}

function collect(node: any, out: string[], depth = 0) {
  if (!node || depth > 3) return;
  if (Array.isArray(node)) {
    for (const item of node) {
      if (item && typeof item === "object") {
        const t = item.title ?? item.name;
        if (typeof t === "string" && t.trim()) out.push(t.trim());
      }
    }
  } else if (typeof node === "object") {
    for (const v of Object.values(node)) {
      if (v && typeof v === "object") {
        if (!Array.isArray(v) && ((v as any).title || (v as any).name)) {
          const t = (v as any).title ?? (v as any).name;
          if (typeof t === "string" && t.trim()) out.push(t.trim());
        } else {
          collect(v, out, depth + 1);
        }
      }
    }
  }
}

type M = { title: string; n: string; words: Set<string> };
const MOVIES: M[] = (() => {
  const raw: string[] = [];
  for (const mod of [data1, data2, data3, data4]) {
    for (const exp of Object.values(mod as Record<string, unknown>)) collect(exp, raw);
  }
  const seen = new Set<string>();
  const list: M[] = [];
  for (const title of raw) {
    const n = norm(title);
    if (!n || seen.has(n)) continue;
    seen.add(n);
    list.push({ title, n, words: new Set(n.split(" ")) });
  }
  return list;
})();

function lev(a: string, b: string, max: number) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (cur[j] < rowMin) rowMin = cur[j];
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

function findMovie(q: string): M | null {
  const padded = " " + q + " ";
  const qWords = q.split(" ");

  // ১. হুবহু মিল
  for (const m of MOVIES) if (m.n === q) return m;

  // ২. মেসেজের ভেতরে পুরো টাইটেল আছে (সবচেয়ে লম্বাটা)
  let best: M | null = null;
  for (const m of MOVIES) {
    if (m.n.length >= 3 && padded.includes(" " + m.n + " ")) {
      if (!best || m.n.length > best.n.length) best = m;
    }
  }
  if (best) return best;

  // ৩. সব শব্দ কোনো টাইটেলের ভেতরে আছে (সবচেয়ে ছোটটা)
  for (const m of MOVIES) {
    if (qWords.every((w) => m.words.has(w))) {
      if (!best || m.n.length < best.n.length) best = m;
    }
  }
  if (best) return best;

  // ৪. বানান ভুল সহ্য করা
  if (q.length >= 4) {
    const max = q.length <= 8 ? 1 : 2;
    let bestD = max + 1;
    for (const m of MOVIES) {
      const d = lev(q, m.n, max);
      if (d < bestD) { bestD = d; best = m; }
    }
    if (best) return best;
  }
  return null;
}

// ---------- Telegram helper ----------
async function tg(method: string, body: any) {
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.json();
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const titleCase = (s: string) => s.replace(/\b\p{L}/gu, (c) => c.toUpperCase());

// ---------- Webhook ----------
export async function POST(req: NextRequest) {
  try {
    if (SECRET && req.headers.get("x-telegram-bot-api-secret-token") !== SECRET) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    const update = await req.json();
    const msg = update.message;
    if (!msg || !msg.text || !msg.from) return NextResponse.json({ ok: true });

    const chatId = msg.chat.id;
    if (String(chatId) !== GROUP_ID) return NextResponse.json({ ok: true });

    // অ্যাডমিন / অ্যানোনিমাস অ্যাডমিন / বট ইগনোর
    if (msg.sender_chat || msg.from.is_bot || msg.from.id === ADMIN_ID) {
      return NextResponse.json({ ok: true });
    }
    const cm = await tg("getChatMember", { chat_id: chatId, user_id: msg.from.id });
    const status = cm?.result?.status;
    if (status === "administrator" || status === "creator") {
      return NextResponse.json({ ok: true });
    }

    const raw = String(msg.text).trim();
    if (raw.startsWith("/")) return NextResponse.json({ ok: true });

    // নাম বের করা
    const words = norm(raw).split(" ").filter(Boolean);
    const hasKeyword = words.some((w) => KEYWORDS.includes(w));
    const cleaned = words.filter((w) => !KEYWORDS.includes(w) && !FILLER.has(w));
    const query = cleaned.join(" ");
    if (!query || !(hasKeyword || cleaned.length <= 6)) return NextResponse.json({ ok: true });

    // Searching...
    const sent = await tg("sendMessage", { chat_id: chatId, text: "Searching... 🔎" });
    const searchId = sent?.result?.message_id;

    const found = findMovie(query);

    if (searchId) await tg("deleteMessage", { chat_id: chatId, message_id: searchId });

    const pick = msg.message_id % 4;

    if (found) {
      const t = esc(titleCase(found.title));
      const replies = [
        `🎬 সুখবর! <b>${t}</b> আমাদের কালেকশনে আছে।\n\n📲 MVBD Mini App-এ গিয়ে এই নামটি সার্চ করলেই পেয়ে যাবেন।`,
        `✅ <b>${t}</b> পাওয়া গেছে! 🍿\n\nআমাদের MVBD Mini App ওপেন করে নামটি লিখে সার্চ দিন, সাথে সাথেই দেখতে পাবেন।`,
        `🎉 দারুণ খবর! <b>${t}</b> আমাদের কাছে রেডি।\n\nMVBD Mini App-এ সার্চ বক্সে নামটি দিলেই পেয়ে যাবেন। Enjoy! 😍`,
        `🔥 <b>${t}</b> আমাদের লাইব্রেরিতে আছে!\n\nMVBD Mini App-এ গিয়ে নামটি সার্চ করুন আর এখনই দেখা শুরু করুন। 🎥`,
      ];
      await tg("sendMessage", {
        chat_id: chatId,
        text: replies[pick],
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: [[{ text: "🔥Watch Now🔥", url: WATCH_LINK }]] },
      });
    } else {
      const t = esc(titleCase(query));
      const replies = [
        `😔 দুঃখিত, <b>${t}</b> আপাতত আমাদের কাছে নেই।\n\nতবে সঠিক নামটি (English) লিখে রাখুন, available থাকলে আমরা খুব দ্রুতই Mini App-এ আপলোড করে দেব!`,
        `🙁 <b>${t}</b> এই মুহূর্তে আমাদের কালেকশনে পাইনি।\n\nচিন্তা করবেন না, নামটি রেখে দিলাম। পাওয়া গেলে খুব তাড়াতাড়ি Mini App-এ যোগ করা হবে। 🎞️`,
        `😕 দুঃখিত, <b>${t}</b> এখনো আমাদের ডেটাবেসে নেই।\n\nসঠিক ইংরেজি নামটি দিয়ে রিকোয়েস্ট করে রাখুন, পেলেই আমরা আপলোড করে দেব! 🚀`,
        `📭 <b>${t}</b> আপাতত আমাদের কাছে নেই।\n\nআপনার রিকোয়েস্ট নোট করা হয়েছে। মুভিটি জোগাড় হলে দ্রুত MVBD Mini App-এ পেয়ে যাবেন। 🙏`,
      ];
      await tg("sendMessage", { chat_id: chatId, text: replies[pick], parse_mode: "HTML" });

      // অ্যাডমিনকে প্রাইভেটে জানানো
      await tg("sendMessage", {
        chat_id: ADMIN_ID,
        text: `📥 নতুন রিকোয়েস্ট:\n🎬 ${titleCase(query)}\n👤 ${msg.from.first_name || ""}`,
      });
    }
  } catch (e) {
    console.error("bot error", e);
  }
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true, movies: MOVIES.length });
}
