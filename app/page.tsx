import Link from 'next/link';
import { ShieldCheck, Zap, MessageSquare, ArrowRight, Sparkles } from 'lucide-react';
import SponsorBanner from '@/components/SponsorBanner';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-purple-500 selection:text-white">
      
      {/* Navigation Bar */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center">
            <img 
              src="/logo.png" 
              alt="UNIZIK Logo" 
              className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(147,51,234,0.3)]"
            />
          </div>
          <span className="font-black text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            UNIZIK PARTY HUB
          </span>
        </div>

        <Link
          href="/admin"
          className="text-xs font-bold px-4 py-2 rounded-full border border-purple-800/60 bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 hover:text-white transition-all flex items-center gap-1.5 shadow-md"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
          ADMIN PORTAL
        </Link>
      </nav>

      {/* Hero / CTA Section */}
      <section className="max-w-5xl mx-auto px-6 py-16 text-center flex flex-col items-center justify-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-900/30 text-purple-300 text-xs font-semibold mb-8 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          Official Nnamdi Azikiwe University Event Ticketing & Verification
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight">
          Secure Your Vibe. <br />
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
            Skip The Long Queues.
          </span>
        </h1>

        <p className="text-slate-400 text-sm md:text-lg max-w-2xl mb-10 leading-relaxed">
          The official digital gateway for all Nnamdi Azikiwe University student events, parties, and campus raves. Browse available events, submit your proof of payment, and get verified instantly.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link
            href="/events"
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm shadow-xl shadow-purple-600/30 transition-all flex items-center justify-center gap-2 group"
          >
            <span>Browse Available Party Tickets</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Feature Section */}
      <section className="max-w-6xl mx-auto px-6 py-12 w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl backdrop-blur-md">
          <div className="w-10 h-10 bg-purple-950 border border-purple-800/50 rounded-2xl flex items-center justify-center mb-4 text-purple-400">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-white mb-1">Fast & Seamless</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Pick your event, make a quick bank transfer with your name as the narration, and submit your proof in seconds.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl backdrop-blur-md">
          <div className="w-10 h-10 bg-purple-950 border border-purple-800/50 rounded-2xl flex items-center justify-center mb-4 text-pink-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-white mb-1">Verified Security</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Every receipt is manually reviewed by verification executives to eliminate fake alerts and secure your legitimate spot.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl backdrop-blur-md">
          <div className="w-10 h-10 bg-purple-950 border border-purple-800/50 rounded-2xl flex items-center justify-center mb-4 text-amber-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-white mb-1">Direct WhatsApp Sync</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Once approved, administrators connect with you directly via WhatsApp to coordinate your ticket collection time and venue.
          </p>
        </div>
      </section>
      
      {/* Sponsor / Ad Placement Section */}
      <section className="max-w-6xl mx-auto px-6 w-full pb-12">
        <SponsorBanner />
      </section>

      {/* Page Footer */}
      <footer className="w-full border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>© 2026 UNIZIK Party Hub. Powered by Hephaestus tech.</p>
      </footer>
    </main>
  );
}