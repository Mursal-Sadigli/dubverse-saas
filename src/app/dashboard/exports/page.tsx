"use client";

import { Download, History, HardDrive } from "lucide-react";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ExportsPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Exports
        </h1>
        <p className="text-muted-foreground">Download your completed dubbed videos, subtitles, and audio tracks.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="glass border-none shadow-sm flex flex-col items-center justify-center py-16 text-center">
           <History className="size-12 text-muted-foreground/30 mb-4" />
           <CardTitle className="text-lg">No Export History</CardTitle>
           <CardDescription className="max-w-[200px] mt-2">
              Your recent downloads and exports will appear here.
           </CardDescription>
        </Card>
      </div>

      <Card className="bg-zinc-500/5 border-none p-8 rounded-4xl">
         <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex size-20 shrink-0 items-center justify-center rounded-3xl bg-violet-500/10">
               <HardDrive className="size-10 text-violet-500" />
            </div>
            <div className="flex-1 text-center md:text-left space-y-2">
               <h3 className="text-xl font-bold">Cloud Storage</h3>
               <p className="text-muted-foreground">Your processed videos are stored for 30 days on our high-speed servers. Upgrade to Lifetime Storage for permanent access.</p>
            </div>
            <Button variant="premium" className="h-12 px-8 rounded-xl font-bold">Explore Storage Plans</Button>
         </div>
      </Card>
    </div>
  );
}
