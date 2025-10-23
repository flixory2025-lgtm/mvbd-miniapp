import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Telegram webhook থেকে message পাবে
    if (body.message) {
      const chatId = body.message.chat.id
      const text = body.message.text

      // যখন user /start command দেবে
      if (text === "/start") {
        // Mini app open করার জন্য inline keyboard পাঠাবে
        const telegramApiUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`

        await fetch(telegramApiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: "🎬 MoviesVerse এ স্বাগতম! নিচের বাটন ক্লিক করে আমাদের মুভি অ্যাপ খুলুন।",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🎥 মুভি অ্যাপ খুলুন",
                    web_app: {
                      url: process.env.NEXT_PUBLIC_APP_URL || "https://telegram-movie-app.vercel.app",
                    },
                  },
                ],
              ],
            },
          }),
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
