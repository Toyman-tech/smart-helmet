import { Phone, MessageSquare } from "lucide-react";

export function ContactPanel() {
    // Mock Data
    const contacts = [
        { name: "Sarah Doe", relation: "Wife", phone: "+1234567890" },
        { name: "John Smith", relation: "Brother", phone: "+0987654321" }
    ];

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="bg-gray-50 dark:bg-slate-900/50 p-3 border-b border-gray-200 dark:border-slate-700">
                <h3 className="font-semibold text-sm uppercase text-gray-500">Emergency Contacts</h3>
            </div>
            <div>
                {contacts.map((contact, i) => (
                    <div key={i} className="p-4 border-b border-gray-100 dark:border-slate-700/50 last:border-0 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                        <div>
                            <div className="font-bold text-slate-700 dark:text-slate-200">{contact.name}</div>
                            <div className="text-xs text-gray-500">{contact.relation} • {contact.phone}</div>
                        </div>
                        <div className="flex gap-2">
                            <a href={`tel:${contact.phone}`} className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition">
                                <Phone className="h-4 w-4" />
                            </a>
                            <button className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition">
                                <MessageSquare className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
