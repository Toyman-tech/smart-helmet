import { AlertTriangle, BellRing, Flame } from "lucide-react";

interface AlertBannerProps {
    alertType: "CRASH" | "INTOXICATION" | null;
}

export function AlertBanner({ alertType }: AlertBannerProps) {
    if (!alertType) return null;

    const isCrash = alertType === "CRASH";

    return (
        <div className={`${isCrash ? 'bg-red-600' : 'bg-orange-500'} animate-pulse text-white p-4 md:p-6 mb-6 rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.6)] flex items-center justify-between z-50 relative overflow-hidden`}>
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10"></div>

            <div className="flex items-center gap-4 md:gap-6 relative z-10 w-full md:w-auto">
                <div className="bg-white/20 p-3 rounded-full hidden md:block">
                    {isCrash ? <BellRing className="h-8 w-8 animate-bounce" /> : <Flame className="h-8 w-8 animate-pulse" />}
                </div>
                <div>
                    <h2 className="text-2xl md:text-3xl font-black uppercase tracking-widest leading-none">
                        {isCrash ? "Emergency Alert" : "Intoxication Alert"}
                    </h2>
                    <p className="opacity-90 font-mono mt-1 text-sm md:text-base">
                        {isCrash ? "CRITICAL INCIDENT DETECTED - HELMET #01" : "ELEVATED ALCOHOL DETECTED - HELMET #01"}
                    </p>
                </div>
            </div>

            <div className="items-center gap-4 relative z-10 hidden md:flex">
                <div className="text-right">
                    <div className="text-xs font-bold bg-white/20 px-2 py-1 rounded inline-block mb-1">
                        {isCrash ? "PRIORITY 1" : "PRIORITY 2"}
                    </div>
                    <div className="text-xs opacity-75">
                        {isCrash ? "Dispatch required immediately" : "Monitor rider capability"}
                    </div>
                </div>
            </div>
        </div>
    );
}
