"use client"

import { useEffect, useState, Suspense } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import { dbService, DBApplication } from "@/lib/db-service";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { NotesSection } from "@/components/admin/notes-section";
import { DecisionCard } from "@/components/admin/decision-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

function AdminApplicationDetailContent() {
    const { user, loading: authLoading, isAdmin } = useAuth();
    const router = useRouter();
    const [application, setApplication] = useState<DBApplication | null>(null);
    const [loading, setLoading] = useState(true);

    const searchParams = useSearchParams();
    const applicationId = searchParams.get('id');

    const fetchApplication = async () => {
        if (!applicationId) return;
        try {
            const allApps = await dbService.getAllApplications();
            const found = allApps.find(a => a.userId === applicationId);
            if (found) {
                setApplication(found);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && !isAdmin) {
            router.push('/');
            return;
        }
        if (isAdmin && applicationId) {
            fetchApplication();
        } else if (isAdmin && !applicationId) {
            setLoading(false); // No ID provided
        }
    }, [authLoading, isAdmin, applicationId]);

    if (authLoading || (isAdmin && loading)) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!application) {
        return (
            <div className="p-8">
                <p>Application not found or no ID provided.</p>
                <Link href="/admin/dashboard"><Button variant="link">Back to Dashboard</Button></Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20 pt-8">
            <div className="container mx-auto max-w-6xl px-4">

                <div className="mb-6">
                    <Link href="/admin/dashboard" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
                        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                    </Link>
                    <div className="flex justify-between items-start mt-4">
                        <div>
                            <h1 className="text-3xl font-bold">{application.personalInfo?.firstName} {application.personalInfo?.lastName}</h1>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="text-muted-foreground">{application.personalInfo?.school}</span>
                                <StatusBadge status={application.status} />
                            </div>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                            <p>ID: {application.userId}</p>
                            <p>Phone: {application.personalInfo?.phone}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Application Data */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Personal Information</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-muted-foreground block">WeChat ID</label>
                                    <p className="font-medium">{application.personalInfo?.wechatId || "-"}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground block">Grade</label>
                                    <p className="font-medium">{application.personalInfo?.grade || "-"}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground block">Phone</label>
                                    <p className="font-medium">{application.personalInfo?.phone || "-"}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground block">Registered At</label>
                                    <p className="font-medium">{new Date(application.timeline?.registeredAt || "").toLocaleDateString()}</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Essays</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <label className="text-sm font-semibold text-primary block mb-2">Question 1</label>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap bg-gray-50 p-4 rounded border">
                                        {application.essays?.question1 || "No answer provided."}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-primary block mb-2">Question 2</label>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap bg-gray-50 p-4 rounded border">
                                        {application.essays?.question2 || "No answer provided."}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Admin Tools */}
                    <div className="space-y-6">

                        <DecisionCard
                            applicationId={application.userId}
                            currentInternalDecision={application.adminData?.internalDecision}
                            currentPublicStatus={application.status}
                            onUpdate={fetchApplication}
                        />

                        <NotesSection
                            applicationId={application.userId}
                            notes={application.adminData?.notes || []}
                            onNoteAdded={fetchApplication}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
}

export default function AdminApplicationDetailPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <AdminApplicationDetailContent />
        </Suspense>
    );
}
