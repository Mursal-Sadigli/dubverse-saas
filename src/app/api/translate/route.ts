import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getProject, updateProject } from "@/lib/store";
import grok from "@/lib/grok";

const LANG_NAMES: Record<string, string> = {
  az: "Azerbaijani", tr: "Turkish", en: "English", ru: "Russian",
  de: "German", fr: "French", es: "Spanish", ar: "Arabic",
  zh: "Chinese", ja: "Japanese", ko: "Korean", pt: "Portuguese",
  it: "Italian", hi: "Hindi",
};

export async function POST(req: NextRequest) {
  // Logic moved to src/lib/pipeline.ts (processPipeline)
  // This route is now just a placeholder for frontend compatibility
  return NextResponse.json({ success: true, message: "Handled by background pipeline" });
}
