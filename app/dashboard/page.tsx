import DashboardClient from "@/components/DashboardClient";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Smart Helmet Dashboard",
    description: "Real-time monitoring for rider safety",
};

export default function DashboardPage() {
    return <DashboardClient />;
}
