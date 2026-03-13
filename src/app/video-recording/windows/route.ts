import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// Returns the contents of aidriver-enable-win (same as /video-recording/aidriver-enable-win).
// e.g. curl -s -o ai-driver.cmd "https://compound.chat/video-recording/windows" && ai-driver.cmd

export async function GET() {
  try {
    const filePath = path.join(
      process.cwd(),
      "public",
      "video-recording",
      "aidriver-enable-win"
    );
    const contents = await fs.readFile(filePath, "utf8");
    return new NextResponse(contents, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Failed to read aidriver-enable-win script:", error);
    return new NextResponse("Internal Server Error", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
