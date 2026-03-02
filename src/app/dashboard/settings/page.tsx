"use client";

import { Settings, User, CreditCard, Bell, Shield, Palette } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const SECTIONS = [
    { title: "Profile", desc: "Manage your personal information and email.", icon: User },
    { title: "Subscription", desc: "View your plan and billing history.", icon: CreditCard },
    { title: "Notifications", desc: "Configure how you receive alerts.", icon: Bell },
    { title: "Security", desc: "Update your password and 2FA settings.", icon: Shield },
    { title: "Appearance", desc: "Customize the theme and interface.", icon: Palette },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-muted-foreground">Manage your account preferences and platform settings.</p>
      </div>

      <div className="grid gap-4">
        {SECTIONS.map((section) => (
          <Card key={section.title} className="glass border-none shadow-sm hover:bg-zinc-500/5 transition-colors cursor-pointer group rounded-2xl">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="p-3 rounded-xl bg-violet-500/10 group-hover:bg-violet-500/20 transition-colors">
                    <section.icon className="size-5 text-violet-500" />
                 </div>
                 <div>
                    <h3 className="font-bold">{section.title}</h3>
                    <p className="text-sm text-muted-foreground">{section.desc}</p>
                 </div>
              </div>
              <Button variant="ghost" size="sm" className="rounded-lg h-9">Configure</Button>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="pt-4">
        <Button variant="destructive" className="rounded-xl h-12 px-8 font-bold">
           Delete Account
        </Button>
      </div>
    </div>
  );
}
