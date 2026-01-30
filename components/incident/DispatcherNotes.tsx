"use client";

import { Save } from "lucide-react";
import { useState } from "react";

export function DispatcherNotes() {
    const [note, setNote] = useState("");

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 flex flex-col h-full">
            <div className="bg-gray-50 dark:bg-slate-900/50 p-3 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
                <h3 className="font-semibold text-sm uppercase text-gray-500">Dispatcher Log</h3>
                <button className="text-xs flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium hover:underline">
                    <Save className="h-3 w-3" /> Save Log
                </button>
            </div>
            <textarea
                className="flex-1 w-full bg-transparent p-4 text-sm resize-none focus:outline-none dark:text-slate-300 placeholder:text-gray-400"
                placeholder="Record actions taken (e.g., 'Ambulance dispatched at 14:00', 'Tried calling wife')..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
            ></textarea>
        </div>
    );
}
