import { Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

interface ConnectionStatusProps {
    lastHeartbeatTime: number; // timestamp in ms
}

export function SafetyStatus({ lastHeartbeatTime }: ConnectionStatusProps) {
    const [isOnline, setIsOnline] = useState(false);

    useEffect(() => {
        const checkStatus = () => {
            // Heartbeat happens every 10s, so allow 15s before calling it offline
            const now = Date.now();
            setIsOnline(now - lastHeartbeatTime < 15000);
        };
        
        checkStatus();
        const interval = setInterval(checkStatus, 2000);
        return () => clearInterval(interval);
    }, [lastHeartbeatTime]);

    return (
        <div className={`p-4 rounded-xl border flex flex-col justify-center ${isOnline ? 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700' : 'bg-gray-100 dark:bg-slate-800/50 border-transparent'}`}>
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider">Connection Status</h3>
                {isOnline ? (
                    <Wifi className="h-5 w-5 text-green-500" />
                ) : (
                    <WifiOff className="h-5 w-5 text-gray-400" />
                )}
            </div>

            <div className="mt-2">
                <div className={`text-xl font-bold ${isOnline ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                    {isOnline ? "ONLINE" : "OFFLINE"}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                    {isOnline ? "Heartbeat Received" : "Lost contact with device"}
                </div>
            </div>
        </div>
    );
}
