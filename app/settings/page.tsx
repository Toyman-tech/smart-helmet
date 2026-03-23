"use client";

import { useState, useEffect } from "react";
import { ref, onValue, set } from "firebase/database";
import { db } from "@/lib/firebase";
import DispatcherLayout from "@/components/DispatcherLayout";
import { Save, UserCircle } from "lucide-react";

interface Contact {
    name: string;
    relation: string;
    phone: string;
}

export default function SettingsPage() {
    const [contacts, setContacts] = useState<Contact[]>([
        { name: "", relation: "", phone: "" },
        { name: "", relation: "", phone: "" }
    ]);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<"IDLE" | "SUCCESS" | "ERROR">("IDLE");

    useEffect(() => {
        if (!db) return;
        const contactsRef = ref(db, "helmet/contacts");
        const unsub = onValue(contactsRef, (snap) => {
            if (snap.exists() && Array.isArray(snap.val())) {
                const fetched = snap.val();
                // Ensure we always have 2 editable contacts
                setContacts([
                    fetched[0] || { name: "", relation: "", phone: "" },
                    fetched[1] || { name: "", relation: "", phone: "" }
                ]);
            }
        });
        return () => unsub();
    }, []);

    const handleUpdate = (index: number, field: keyof Contact, value: string) => {
        const newContacts = [...contacts];
        newContacts[index] = { ...newContacts[index], [field]: value };
        setContacts(newContacts);
        setSaveStatus("IDLE");
    };

    const handleSave = async () => {
        if (!db) return;
        setIsSaving(true);
        try {
            await set(ref(db, "helmet/contacts"), contacts);
            setSaveStatus("SUCCESS");
            setTimeout(() => setSaveStatus("IDLE"), 3000);
        } catch (error) {
            console.error("Save failed", error);
            setSaveStatus("ERROR");
        }
        setIsSaving(false);
    };

    return (
        <DispatcherLayout>
            <div className="p-4 md:p-8 max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-black uppercase tracking-wider mb-2">Emergency Settings</h1>
                    <p className="text-slate-500">Configure rider emergency contacts and system preferences.</p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                    <div className="bg-gray-50 dark:bg-slate-900/50 p-6 border-b border-gray-200 dark:border-slate-700">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <UserCircle className="h-5 w-5 text-blue-500" />
                            Rider Emergency Contacts (Helmet #01)
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">These contacts will be displayed to the dispatcher during an emergency.</p>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {contacts.map((contact, i) => (
                            <div key={i} className="space-y-4">
                                <h3 className="font-bold text-gray-400 text-xs uppercase tracking-widest border-b border-gray-100 dark:border-slate-700 pb-2">Primary Contact {i + 1}</h3>
                                <div>
                                    <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Full Name</label>
                                    <input 
                                        type="text" 
                                        value={contact.name}
                                        onChange={(e) => handleUpdate(i, "name", e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" 
                                        placeholder="E.g. Sarah Doe"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Relation</label>
                                        <input 
                                            type="text" 
                                            value={contact.relation}
                                            onChange={(e) => handleUpdate(i, "relation", e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" 
                                            placeholder="E.g. Wife" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Phone</label>
                                        <input 
                                            type="tel" 
                                            value={contact.phone}
                                            onChange={(e) => handleUpdate(i, "phone", e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" 
                                            placeholder="+1 234..." 
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-6 bg-gray-50 dark:bg-slate-900/30 border-t border-gray-200 dark:border-slate-700 flex justify-end items-center gap-4">
                        {saveStatus === "SUCCESS" && <span className="text-green-500 text-sm font-bold">Saved Successfully!</span>}
                        {saveStatus === "ERROR" && <span className="text-red-500 text-sm font-bold">Failed to Save.</span>}
                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-blue-500/30 transition flex items-center gap-2"
                        >
                            <Save className={`h-4 w-4 ${isSaving ? 'animate-pulse' : ''}`} />
                            {isSaving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </div>
            </div>
        </DispatcherLayout>
    );
}
