"use client";

import { ThemeProvider } from "next-themes";
import { Sheet } from "lucide-react"; // Start of scaffolding
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { ShieldAlert, Users, Settings, Activity, Menu } from "lucide-react";
import { useState } from "react";

export default function DispatcherLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
            <div className="flex h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300 text-slate-900 dark:text-slate-100 overflow-hidden">

                {/* Sidebar */}
                <aside className={`absolute z-20 md:relative w-64 h-full bg-white dark:bg-slate-950 border-r border-gray-200 dark:border-slate-800 flex flex-col transition-transform duration-300 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
                    <div className="p-6 border-b border-gray-200 dark:border-slate-800 flex items-center gap-3">
                        <ShieldAlert className="h-8 w-8 text-blue-600 dark:text-blue-500" />
                        <div>
                            <h1 className="font-bold text-lg leading-tight uppercase tracking-wider">Agency<br />Command</h1>
                        </div>
                    </div>

                    <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                        <div className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-4">Live Monitoring</div>

                        {/* Mock Active Helmets List */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                                    <span className="font-medium text-sm">Helmet #01</span>
                                </div>
                                <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 px-2 py-0.5 rounded">Active</span>
                            </div>
                            {/* Example Offline Helmet */}
                            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer opacity-60">
                                <div className="flex items-center gap-3">
                                    <span className="h-2 w-2 rounded-full bg-gray-400"></span>
                                    <span className="font-medium text-sm">Helmet #02</span>
                                </div>
                                <span className="text-xs bg-gray-100 dark:bg-slate-800 text-gray-500 px-2 py-0.5 rounded">Offline</span>
                            </div>
                        </div>

                        <div className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-widest mt-8 mb-4">Operations</div>
                        <Link href="#" className="flex items-center gap-3 p-3 rounded-lg text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                            <Users className="h-5 w-5" /> Riders List
                        </Link>
                        <Link href="#" className="flex items-center gap-3 p-3 rounded-lg text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                            <Activity className="h-5 w-5" /> Analytics
                        </Link>
                        <Link href="#" className="flex items-center gap-3 p-3 rounded-lg text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                            <Settings className="h-5 w-5" /> Settings
                        </Link>
                    </nav>

                    <div className="p-4 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500"></div>
                            <div className="text-xs">
                                <div className="font-bold">Dispatcher User</div>
                                <div className="text-gray-500 dark:text-slate-400">ID: #8822</div>
                            </div>
                        </div>
                        <ThemeToggle />
                    </div>
                </aside>

                {/* content overlay for mobile sidebar */}
                {sidebarOpen && (
                    <div className="fixed inset-0 bg-black/50 z-10 md:hidden" onClick={() => setSidebarOpen(false)}></div>
                )}

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                    {/* Mobile Header */}
                    <header className="md:hidden bg-white dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800 p-4 flex justify-between items-center z-10">
                        <button onClick={() => setSidebarOpen(true)}>
                            <Menu className="h-6 w-6" />
                        </button>
                        <h1 className="font-bold uppercase tracking-wider text-sm">Agency Command</h1>
                        <div className="w-6"></div> {/* Spacer */}
                    </header>

                    <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-900/50">
                        {children}
                    </div>
                </main>

            </div>
        </ThemeProvider>
    );
}
