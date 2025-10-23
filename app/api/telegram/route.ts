import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { movieId, movieTitle, userId } = body

    // Log the request (in production, you'd send this to your Telegram bot)
    console.log("Movie request received:", {
      movieId,
      movieTitle,
      userId,
      timestamp: new Date().toISOString(),
    })

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Request sent to Telegram group",
        telegramUrl: "https://t.me/moviesversebdreq",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error processing request:", error)
    return NextResponse.json({ success: false, error: "Failed to process request" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    status: "Telegram integration API is running",
    endpoint: "/api/telegram",
    methods: ["POST"],
  })
}
