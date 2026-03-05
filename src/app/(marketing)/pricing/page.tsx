"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function PricingPage() {
  const { isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      const userEmail = user?.emailAddresses?.[0]?.emailAddress;
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/billing/checkout`, {
        method: "POST",
        headers: {
           Authorization: `Bearer ${token}`,
           "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          email: userEmail,
          returnUrl: `${window.location.origin}` 
        })
      });
      
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
         console.error("No checkout url returned", data);
         alert(`Xəta: ${data.error || "Ödəniş linki yaradıla bilmədi"}`);
      }
    } catch (err: any) {
      console.error("Upgrade failed:", err);
      alert(`Sistem xətası: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center py-20 px-4">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 font-outfit">
          Simple, Transparent Pricing
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Choose the plan that fits your needs. Upgrade anytime to unlock unlimited AI dubbing power.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl w-full">
        {/* Free Plan */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col">
          <h3 className="text-2xl font-bold mb-2">Free Starter</h3>
          <div className="text-4xl font-bold mb-6">$0<span className="text-lg text-gray-400 font-normal">/mo</span></div>
          <p className="text-gray-400 mb-8 flex-grow">
            Perfect for trying out Dubverse and doing small personal projects.
          </p>
          <ul className="space-y-4 mb-8">
            <li className="flex items-center gap-3"><Check className="text-blue-500 w-5 h-5"/> 20 minutes monthly limit</li>
            <li className="flex items-center gap-3"><Check className="text-blue-500 w-5 h-5"/> Standard processing speed</li>
            <li className="flex items-center gap-3"><Check className="text-blue-500 w-5 h-5"/> 720p Video Exports</li>
          </ul>
          <button 
            disabled
            className="w-full py-4 rounded-xl font-bold bg-white/10 text-white/50 cursor-not-allowed transition-all"
          >
            Current Plan
          </button>
        </div>

        {/* Pro Plan */}
        <div className="bg-gradient-to-b from-blue-900/40 to-black border border-blue-500/50 rounded-2xl p-8 flex flex-col relative overflow-hidden shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)]">
          <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
            Most Popular
          </div>
          <h3 className="text-2xl font-bold mb-2">Dubverse Pro</h3>
          <div className="text-4xl font-bold mb-6">$29<span className="text-lg text-gray-400 font-normal">/mo</span></div>
          <p className="text-gray-400 mb-8 flex-grow">
            For creators and businesses who need high-volume, professional dubbing.
          </p>
          <ul className="space-y-4 mb-8">
            <li className="flex items-center gap-3"><Check className="text-blue-500 w-5 h-5"/> 120 minutes monthly limit</li>
            <li className="flex items-center gap-3"><Check className="text-blue-500 w-5 h-5"/> Priority queue processing</li>
            <li className="flex items-center gap-3"><Check className="text-blue-500 w-5 h-5"/> 4K Video Exports</li>
            <li className="flex items-center gap-3"><Check className="text-blue-500 w-5 h-5"/> Premium HD Voices</li>
          </ul>
          <button 
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full py-4 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all transform hover:scale-[1.02] shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
          >
            {loading ? "Redirecting..." : "Upgrade to Pro"}
          </button>
        </div>
      </div>
    </div>
  );
}
