import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { processPipeline } from "@/lib/pipeline";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let projectId: string;
  try {
    const body = await req.json();
    projectId = body.projectId;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Trigger the entire pipeline in the background and return immediately
  // This avoids deadlocks and timeouts in the server
  processPipeline(projectId).catch(err => console.error("[pipeline-trigger]", err));

  return NextResponse.json({ success: true, message: "Pipeline started in background" });
}
