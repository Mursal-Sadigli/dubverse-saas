import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getProject } from "@/lib/store";
import { existsSync, statSync, createReadStream } from "fs";
import { join } from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const resolvedParams = await params;
  const id = resolvedParams.id;
  const project = getProject(id);

  if (!project || project.userId !== userId) {
    return new NextResponse("Not found", { status: 404 });
  }

  const videoPath = project.finalVideoPath;
  if (!videoPath || !existsSync(videoPath)) {
    return new NextResponse("Video not found", { status: 404 });
  }

  const stats = statSync(videoPath);
  const fileSize = stats.size;
  const range = req.headers.get("range");

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const stream = createReadStream(videoPath, { start, end });

    return new NextResponse(stream as any, {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize.toString(),
        "Content-Type": "video/mp4",
      },
    });
  } else {
    const stream = createReadStream(videoPath);
    return new NextResponse(stream as any, {
      headers: {
        "Content-Length": fileSize.toString(),
        "Content-Type": "video/mp4",
      },
    });
  }
}
