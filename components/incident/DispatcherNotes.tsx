"use client";

import { Save, CheckCircle } from "lucide-react";
import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";

export function DispatcherNotes() {
    const [note, setNote] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSaveLog = async () => {
        if (!note.trim() || !firestore) return;
        setIsSaving(true);
        try {
            await addDoc(collection(firestore, "dispatcher_logs"), {
                note: note.trim(),
                timestamp: new Date().toISOString()
            });
            setNote("");
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error("Failed to save log:", error);
        }
        setIsSaving(false);
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 flex flex-col h-full relative overflow-hidden">
            <div className="bg-gray-50 dark:bg-slate-900/50 p-3 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
                <h3 className="font-semibold text-sm uppercase text-gray-500 flex items-center gap-2">
                    Dispatcher Log
                    {saved && <span className="text-green-500 flex items-center gap-1 text-[10px] animate-pulse"><CheckCircle className="h-3 w-3"/> Saved</span>}
                </h3>
                <button 
                    onClick={handleSaveLog} 
                    disabled={isSaving || !note.trim()}
                    className="text-xs flex items-center gap-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900 disabled:opacity-50 transition"
                >
                    <Save className="h-3 w-3" /> {isSaving ? "Saving..." : "Save Log"}
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
