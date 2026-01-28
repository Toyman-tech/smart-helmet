import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-24 bg-slate-900 text-white">
      <div className="z-10 max-w-5xl w-full flex flex-col items-center justify-center gap-8 font-mono text-sm">
        <ShieldCheck className="h-24 w-24 text-blue-500 animate-pulse" />
        <h1 className="text-4xl font-bold text-center">Smart Helmet System</h1>
        <p className="text-xl text-slate-300 text-center max-w-xl">
          Real-time monitoring and emergency response system for riders.
        </p>

        <Link
          href="/dashboard"
          className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-full font-bold text-lg transition-all hover:scale-105 shadow-lg shadow-blue-500/30"
        >
          Open Dashboard
        </Link>
      </div>
    </main>
  );
}
