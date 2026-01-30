import { AlertTriangle, BellRing } from "lucide-react";

interface AlertBannerProps {
    onDismiss?: () => void;
}

export function AlertBanner({ onDismiss }: AlertBannerProps) {
    return (
        <div className="bg-red-600 animate-pulse text-white p-4 md:p-6 mb-6 rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.6)] flex items-center justify-between z-50 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10"></div>

            <div className="flex items-center gap-6 relative z-10">
                <div className="bg-white/20 p-3 rounded-full">
                    <BellRing className="h-8 w-8 animate-bounce" />
                </div>
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-widest leading-none">Emergency Aleart</h2>
                    <p className="opacity-90 font-mono mt-1">CRITICAL INCIDENT DETECTED - HELMET #01</p>
                </div>
            </div>

            <div className="flex items-center gap-4 relative z-10">
                <div className="text-right hidden md:block">
                    <div className="text-xs font-bold bg-white/20 px-2 py-1 rounded inline-block mb-1">PRIORITY 1</div>
                    <div className="text-xs opacity-75">Dispatch required immediately</div>
                </div>
            </div>
        </div>
    );
}
