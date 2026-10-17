import { NextRequest, NextResponse } from "next/server";
import * as data1 from "@/lib/movie-data";
import * as data2 from "@/lib/movie-data2";
import * as data3 from "@/lib/movie-data3";
import * as data4 from "@/lib/movie-data4";

export const runtime = "nodejs";
export const maxDuration = 30;

const TOKEN = process.env.BOT_TOKEN || "";
const SECRET = process.env.WEBHOOK_SECRET || "";
const BOT_ID = TOKEN.split(":")[0];
const GROUP_ID = "-1003787014725";
const ADMIN_ID = 6643046428;
const WATCH_LINK = "https://mvbds.xyz";
const TUTORIAL_LINK = "https://youtu.be/fs9yrwNbvZs?si=c6EtydSlFYi-DGHt";

// ---------- শব্দ তালিকা ----------
const KEYWORDS = ["movie", "cinema", "series", "film"];

const FILLER = new Set([
  "ache", "ase", "ki", "kina", "ta", "ti", "ar", "er", "dao", "den", "deo", "dilen", "din",
  "please", "plz", "pls", "request", "chai", "chacchi", "lagbe", "khujchi", "bhai", "vai",
  "bro", "admin", "ekta", "ei", "oi", "eita", "ota", "download", "link", "dekhte", "dekhbo",
  "hobe", "hoy", "nei", "nai", "mini", "app", "me", "upload", "dibe", "pabo",
  "আছে", "কি", "কী", "দেন", "দাও", "চাই", "লাগবে", "ভাই", "প্লিজ",
]);

// এই শব্দ থাকলে বোঝা যায় সদস্য মুভি চাইছে (না থাকলে বট চুপ থাকবে)
const INTENT = new Set([
  "ache", "ase", "kina", "dao", "den", "deo", "dilen", "please", "plz", "pls", "request",
  "chai", "chacchi", "lagbe", "khujchi", "upload", "dibe", "pabo", "download", "link",
  "dekhbo", "dekhte", "admin", "ta", "ti",
  "আছে", "দাও", "দেন", "চাই", "লাগবে", "প্লিজ",
]);

// সাধারণ সমস্যা
const PROBLEM_PHRASES = [
  "problem", "prblm", "somossha", "shomossha", "somosya", "samasya", "error", "bug", "crash",
  "hocche na", "hochhe na", "hoche na", "hoitese na", "hoy na", "hobe na",
  "kaj korche na", "kaj kore na", "kaj kortese na", "cholche na", "chole na", "choltese na",
  "khulche na", "kholche na", "login", "payment", "help", "sahajjo",
  "sound nai", "audio nai", "subtitle nai", "ashche na", "ase na", "asche na",
  "সমস্যা", "প্রবলেম", "হচ্ছে না", "হয় না", "কাজ করছে না", "চলছে না", "খুলছে না",
  "এরর", "সাহায্য",
];

// মুভি দেখতে না পারার সমস্যা → সরাসরি টিউটোরিয়াল
const WATCH_PROBLEM_PHRASES = [
  "dekhte parchi na", "dekhte partechi na", "dekhte partesi na", "dekhte parsi na",
  "dekhte pari na", "dekhte pacchi na", "dekha jacche na", "dekha jay na", "dekha jai na",
  "play hocche na", "play hoy na", "play hochhe na", "load hocche na", "load hoy na",
  "open hocche na", "open hoy na", "buffer", "buffering",
  "দেখতে পারছি না", "দেখা যাচ্ছে না", "দেখা যায় না", "প্লে হচ্ছে না", "লোড হচ্ছে না",
];

// "কীভাবে" ধরনের প্রশ্ন
const HOW_PHRASES = [
  "kivabe", "kibhabe", "kibhave", "kemne", "kemon kore", "how to", "how",
  "কীভাবে", "কিভাবে", "কেমনে", "কেমন করে",
];

// মিনি অ্যাপ/সাইট সংক্রান্ত শব্দ
const APP_PHRASES = [
  "mini app", "miniapp", "mvbd", "mvbds", "app", "site", "website", "watch now",
  "মিনি অ্যাপ", "মিনি এপ", "অ্যাপ", "এপ", "সাইট", "ওয়েবসাইট",
];

// "দেখা" সংক্রান্ত শব্দ
const WATCH_WORDS = [
  "dekhbo", "dekhi", "dekhte", "dekha", "watch", "play",
  "দেখবো", "দেখব", "দেখতে", "দেখা",
];

// টিউটোরিয়াল দেখেও বোঝেনি
const STUCK_PHRASES = [
  "bujhlam na", "bujhi na", "bujhte parchi na", "bujhte partechi na", "bujhini", "bujhi ni",
  "tutorial dekhlam", "tutorial dekhechi", "tutorial dekhe", "video dekhlam", "video dekhechi",
  "বুঝলাম না", "বুঝি না", "বুঝতে পারছি না", "বুঝিনি", "টিউটোরিয়াল দেখলাম", "টিউটোরিয়াল দেখেছি",
];

const PROBLEM_REPLIES = [
  "🙏 আপনার সমস্যাটি আমরা দেখেছি। একটু অপেক্ষা করুন, অ্যাডমিনরা অ্যাক্টিভ হলেই সমাধান করে দেবেন।",
  "😊 আপনার সমস্যাটি অ্যাডমিনদের জানিয়ে দেওয়া হয়েছে। অ্যাক্টিভ হলেই তাঁরা দেখবেন, অনুগ্রহ করে একটু ধৈর্য ধরুন।",
  "⏳ সমস্যাটি নোট করা হয়েছে। অ্যাডমিন অনলাইনে এলেই আপনাকে সাহায্য করবেন। ততক্ষণ অপেক্ষা করার জন্য ধন্যবাদ। 🙏",
];

const TUTORIAL_REPLIES = [
  "📺 MVBD Mini App-এ মুভি দেখতে সমস্যা হচ্ছে? নিচের টিউটোরিয়ালটি দেখুন, ধাপে ধাপে দেখানো আছে। 👇\n\nদেখেও সমস্যা থাকলে এই মেসেজের রিপ্লাইয়ে জানান, অ্যাডমিন অ্যাক্টিভ হলেই সমাধান করে দেবেন।",
  "🎬 চিন্তা নেই! মিনি অ্যাপে কীভাবে মুভি দেখতে হয় তার একটা টিউটোরিয়াল আছে। নিচের বাটনে ক্লিক করে দেখে নিন। 👇\n\nতবুও না পারলে এই মেসেজের রিপ্লাইয়ে জানান, অ্যাডমিন সাহায্য করবেন।",
  "🙌 মিনি অ্যাপ ব্যবহারে সমস্যা হলে আগে এই টিউটোরিয়ালটি দেখে নিন। 👇\n\nএরপরও সমাধান না হলে রিপ্লাই দিয়ে জানান, অ্যাডমিনরা অ্যাক্টিভ হলে দেখবেন।",
];

// "নেই" রিপ্লাইয়ের নিচে যোগ হওয়া অতিরিক্ত বার্তা
const NOT_FOUND_NOTE =
  "\n\n💡 <b>আমার ডেটাবেসে এই নামের মুভি/সিরিজ খুঁজে পাইনি।</b> তবে আমাদের MVBD Mini App-এর সার্চ বারে নামটি লিখলে সাজেস্টেড মুভি লিস্ট দেখতে পাবেন, মুভিটি থাকলে সহজেই পেয়ে যাবেন।\n\n🙏 তাই কষ্ট করে রিকোয়েস্ট করার আগে অবশ্যই একবার MVBD Mini App-এ গিয়ে চেক করে আসবেন।\n\n🔎 আর যদি মুভিটি সত্যিই না থাকে, তাহলে Google থেকে মুভি বা সিরিজের <b>সঠিক নামটি (English)</b> দেখে আমাদের শুধু সেই নামটি লিখে জানান। আমরা আবার চেক করে দেখব।";

// প্রাইভেট চ্যাটে অ্যাডমিনকে দেখানো সাহায্য
const ADMIN_HELP =
  "👋 বস, আমি রেডি!\n\n" +
  "গ্রুপে মেসেজ পাঠাতে লিখুন:\n" +
  "/group আপনার মেসেজ এখানে\n\n" +
  "উদাহরণ:\n" +
  "/group সবাইকে জানানো যাচ্ছে, নতুন মুভি আপলোড হয়েছে! 🎬\n\n" +
  "লাইন ভেঙে লিখলেও সেটা গ্রুপে একই ভাবে যাবে।";

// ---------- মুভি লিস্ট (একবার বানিয়ে ক্যাশ) ----------
function norm(s: string) {
  return s.toLowerCase().replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}

function hasPhrase(n: string, list: string[]) {
  const padded = " " + n + " ";
  return list.some((p) => padded.includes(" " + p + " "));
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

function findMovie(q: string, allowFuzzy: boolean): M | null {
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
  if (allowFuzzy && q.length >= 4) {
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

    // ================= প্রাইভেট চ্যাট: অ্যাডমিনের /group কমান্ড =================
    if (msg.chat.type === "private") {
      // শুধু আপনি (অ্যাডমিন) ব্যবহার করতে পারবেন, অন্য কেউ লিখলে বট চুপ
      if (msg.from.id !== ADMIN_ID) return NextResponse.json({ ok: true });

      const text = String(msg.text);
      const m = text.match(/^\/group(?:@\w+)?(?:\s+([\s\S]+))?$/i);

      if (m) {
        const body = (m[1] || "").trim();
        if (!body) {
          await tg("sendMessage", {
            chat_id: msg.chat.id,
            text: "বস, /group এর পরে মেসেজটা লিখুন।\nযেমন: /group নতুন মুভি আপলোড হয়েছে! 🎬",
          });
        } else {
          const res = await tg("sendMessage", { chat_id: GROUP_ID, text: body });
          if (res?.ok) {
            await tg("sendMessage", { chat_id: msg.chat.id, text: "✅ গ্রুপে পাঠানো হয়েছে।" });
          } else {
            await tg("sendMessage", {
              chat_id: msg.chat.id,
              text:
                "❌ গ্রুপে পাঠানো যায়নি।\nকারণ: " + (res?.description || "অজানা") +
                "\n\nবট গ্রুপে আছে কি না আর মেসেজ পাঠানোর অনুমতি আছে কি না দেখুন।",
            });
          }
        }
      } else if (text.startsWith("/start") || text.startsWith("/help")) {
        await tg("sendMessage", { chat_id: msg.chat.id, text: ADMIN_HELP });
      }
      return NextResponse.json({ ok: true });
    }

    // ================= গ্রুপ =================
    const chatId = msg.chat.id;
    if (String(chatId) !== GROUP_ID) return NextResponse.json({ ok: true });

    // অ্যাডমিন / অ্যানোনিমাস অ্যাডমিন / বট ইগনোর
    if (msg.sender_chat || msg.from.is_bot || msg.from.id === ADMIN_ID) {
      return NextResponse.json({ ok: true });
    }
    const raw = String(msg.text).trim();
    if (raw.startsWith("/")) return NextResponse.json({ ok: true });

    const nraw = norm(raw);
    const words = nraw.split(" ").filter(Boolean);
    if (!words.length) return NextResponse.json({ ok: true });

    // গ্রুপের অন্য অ্যাডমিন/ওনার ইগনোর
    const cm = await tg("getChatMember", { chat_id: chatId, user_id: msg.from.id });
    const status = cm?.result?.status;
    if (status === "administrator" || status === "creator") {
      return NextResponse.json({ ok: true });
    }

    const memberName = msg.from.first_name || "";
    const shortId = String(chatId).replace("-100", "");
    const msgLink = "https://t.me/c/" + shortId + "/" + msg.message_id;

    // ================= সমস্যা/টিউটোরিয়াল চেক =================
    const isExactMovie = MOVIES.some((m) => m.n === nraw);

    if (!isExactMovie) {
      const isProblem = hasPhrase(nraw, PROBLEM_PHRASES);
      const isWatchProblem = hasPhrase(nraw, WATCH_PROBLEM_PHRASES);
      const isHow = hasPhrase(nraw, HOW_PHRASES);
      const hasApp = hasPhrase(nraw, APP_PHRASES);
      const hasWatch = hasPhrase(nraw, WATCH_WORDS);
      const isStuck = hasPhrase(nraw, STUCK_PHRASES);
      const repliedToBot = String(msg.reply_to_message?.from?.id || "") === BOT_ID;

      const relevant =
        isProblem || isWatchProblem || isStuck || (isHow && (hasApp || hasWatch));

      if (relevant) {
        const pick = msg.message_id % 3;

        // টিউটোরিয়াল দেখেও না বুঝলে, বা বটের রিপ্লাইয়ের উত্তরে আবার সমস্যা জানালে → অ্যাডমিনকে জানানো
        const escalate = isStuck || (repliedToBot && (isProblem || isWatchProblem || isHow));
        // মিনি অ্যাপ/মুভি দেখার সমস্যা → টিউটোরিয়াল
        const tutorial =
          isWatchProblem || (hasApp && (isProblem || isHow)) || (isHow && hasWatch);

        if (escalate) {
          await tg("sendMessage", {
            chat_id: chatId,
            text: PROBLEM_REPLIES[pick],
            reply_to_message_id: msg.message_id,
            allow_sending_without_reply: true,
          });
          await tg("sendMessage", {
            chat_id: ADMIN_ID,
            text:
              "🚨 টিউটোরিয়াল দেখেও সমস্যা:\n👤 " + memberName +
              "\n💬 " + raw.slice(0, 300) + "\n🔗 " + msgLink,
          });
        } else if (tutorial) {
          await tg("sendMessage", {
            chat_id: chatId,
            text: TUTORIAL_REPLIES[pick],
            reply_to_message_id: msg.message_id,
            allow_sending_without_reply: true,
            reply_markup: {
              inline_keyboard: [[{ text: "▶️ Tutorial দেখুন", url: TUTORIAL_LINK }]],
            },
          });
        } else {
          await tg("sendMessage", {
            chat_id: chatId,
            text: PROBLEM_REPLIES[pick],
            reply_to_message_id: msg.message_id,
            allow_sending_without_reply: true,
          });
          await tg("sendMessage", {
            chat_id: ADMIN_ID,
            text:
              "⚠️ সদস্যের সমস্যা:\n👤 " + memberName +
              "\n💬 " + raw.slice(0, 300) + "\n🔗 " + msgLink,
          });
        }
        return NextResponse.json({ ok: true });
      }
    }

    // ================= মুভি খোঁজা =================
    const hasKeyword = words.some((w) => KEYWORDS.includes(w));
    const cleaned = words.filter((w) => !KEYWORDS.includes(w) && !FILLER.has(w));
    const query = cleaned.join(" ");
    if (!query) return NextResponse.json({ ok: true });
    if (!hasKeyword && cleaned.length > 6) return NextResponse.json({ ok: true });

    const hasIntent = hasKeyword || words.some((w) => INTENT.has(w));
    const found = findMovie(query, hasIntent || query.length >= 7);

    // মুভি পাওয়া যায়নি আর সদস্য মুভি চাইছেও না → বট চুপ
    if (!found && !hasIntent) return NextResponse.json({ ok: true });

    // Searching...
    const sent = await tg("sendMessage", { chat_id: chatId, text: "Searching... 🔎" });
    const searchId = sent?.result?.message_id;
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
      await tg("sendMessage", {
        chat_id: chatId,
        text: replies[pick] + NOT_FOUND_NOTE,
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: [[{ text: "🌐 Visit Now", url: WATCH_LINK }]] },
      });

      // অ্যাডমিনকে প্রাইভেটে জানানো
      await tg("sendMessage", {
        chat_id: ADMIN_ID,
        text: `📥 নতুন রিকোয়েস্ট:\n🎬 ${titleCase(query)}\n👤 ${memberName}`,
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
