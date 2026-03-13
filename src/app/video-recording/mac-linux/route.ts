import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// Returns the contents of aidriver-enable (Mac/Linux script).
// e.g. curl -fsSL -o ai-driver.sh https://compound.chat/video-recording/mac-linux && chmod +x ai-driver.sh && ./ai-driver.sh

export async function GET() {
  try {
    const filePath = path.join(
      process.cwd(),
      "public",
      "video-recording",
      "aidriver-enable"
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
    console.error("Failed to read aidriver-enable script:", error);
    return new NextResponse("Internal Server Error", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
