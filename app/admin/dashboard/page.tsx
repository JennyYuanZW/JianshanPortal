"use client"

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { dbService, DBApplication } from "@/lib/db-service";
import { AdminApplicationTable } from "@/components/admin/application-table";
import { Loader2 } from "lucide-react";

export default function AdminDashboardPage() {
    const { user, loading, isAdmin } = useAuth();
    const router = useRouter();
    const [applications, setApplications] = useState<DBApplication[]>([]);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        if (!loading && !isAdmin) {
            // Not authorized
            router.push('/');
        }
    }, [loading, isAdmin, router]);

    useEffect(() => {
        async function fetchApps() {
            if (isAdmin) {
                try {
                    const data = await dbService.getAllApplications();
                    setApplications(data);
                } catch (e) {
                    console.error("Failed to fetch applications", e);
                } finally {
                    setFetching(false);
                }
            }
        }

        if (isAdmin) {
            fetchApps();
        }
    }, [isAdmin]);

    if (loading || (isAdmin && fetching)) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAdmin) return null;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b py-8 px-4 md:px-8">
                <div className="container mx-auto max-w-7xl">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Admin Dashboard</h1>
                    <p className="text-muted-foreground mt-2">Manage applications and view student status.</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto max-w-7xl px-4 md:px-8 py-8">
                <AdminApplicationTable applications={applications} />
            </div>
        </div>
    );
}
