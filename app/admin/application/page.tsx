"use client"

import { useEffect, useState, Suspense } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import { dbService, DBApplication } from "@/lib/db-service";
import Link from "next/link";
import { ArrowLeft, Star, Save, Info, User, Mail, Phone, Calendar, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";

function AdminApplicationDetailContent() {
    const { user, loading: authLoading, isAdmin } = useAuth();
    const router = useRouter();
    const [application, setApplication] = useState<DBApplication | null>(null);
    const [loading, setLoading] = useState(true);

    // Review Form State
    const [reviewScore, setReviewScore] = useState(0);
    const [internalDecision, setInternalDecision] = useState<string>("");
    const [reviewNote, setReviewNote] = useState("");
    const [saving, setSaving] = useState(false);

    const searchParams = useSearchParams();
    const applicationId = searchParams.get('id');

    const fetchApplication = async () => {
        if (!applicationId) return;
        try {
            const allApps = await dbService.getAllApplications();
            const found = allApps.find(a => a.userId === applicationId);
            if (found) {
                setApplication(found);
                // Init form state
                setReviewScore(found.adminData?.reviewScore || 0);
                setInternalDecision(found.adminData?.internalDecision || "");
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
            setLoading(false);
        }
    }, [authLoading, isAdmin, applicationId]);

    const handleSaveReview = async () => {
        if (!application || !user?.email) return;
        setSaving(true);
        try {
            await dbService.updateAdminReview(application.userId, {
                reviewScore: reviewScore,
                internalDecision: internalDecision as any,
                note: reviewNote, // Only if not empty
                author: user.email
            });
            setReviewNote(""); // Clear note input after save
            await fetchApplication(); // Refresh data
            alert("Review saved successfully.");
        } catch (e) {
            console.error("Failed to save review", e);
            alert("Failed to save review.");
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || (isAdmin && loading)) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            </div>
        );
    }

    if (!application) {
        return (
            <div className="p-8">
                <p>Application not found or no ID provided.</p>
                <Link href="/admin/dashboard" className="text-blue-600 hover:underline">Back to Dashboard</Link>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 dark:bg-slate-900 min-h-screen flex flex-col font-sans text-slate-700 dark:text-slate-200">
            {/* Header */}
            <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 py-4 px-8 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-800 text-white p-1.5 rounded flex items-center justify-center">
                            <span className="font-bold text-lg">AP</span>
                        </div>
                        <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Admin Portal</h1>
                    </div>
                </div>
            </header>

            <main className="flex-grow p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Breadcrumb & Title */}
                    <div className="space-y-4">
                        <Link href="/admin/dashboard" className="inline-flex items-center text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors">
                            <ArrowLeft size={16} className="mr-1" />
                            Back to Dashboard
                        </Link>
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Review Application: {application.personalInfo.firstName} {application.personalInfo.lastName}</h2>
                                <div className="flex items-center gap-3">
                                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800 uppercase">
                                        {application.status.replace('_', ' ')}
                                    </span>
                                    <span className="text-sm text-slate-500 dark:text-slate-400">ID: {application.userId}</span>
                                </div>
                            </div>
                            <div className="text-right md:text-right text-sm text-slate-500 dark:text-slate-400">
                                <p>Registered: <span className="font-medium text-gray-900 dark:text-white">{new Date(application.timeline?.registeredAt || "").toLocaleDateString()}</span></p>
                                <p>Phone: <span className="font-medium text-gray-900 dark:text-white">{application.personalInfo.phone || "N/A"}</span></p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content: Info & Essays */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Personal Info */}
                            <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">Personal Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Full Name</p>
                                        <p className="text-base text-gray-900 dark:text-white font-medium">{application.personalInfo.firstName} {application.personalInfo.lastName}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">WeChat ID</p>
                                        <p className="text-base text-gray-900 dark:text-white font-medium">{application.personalInfo.wechatId || "-"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Current School</p>
                                        <p className="text-base text-gray-900 dark:text-white font-medium">{application.personalInfo.school || "-"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Current Grade</p>
                                        <p className="text-base text-gray-900 dark:text-white font-medium">{application.personalInfo.grade || "-"}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Interested Subject</p>
                                        <p className="text-base text-gray-900 dark:text-white font-medium">{application.academicInfo?.subjectGroup || "Not specified"}</p>
                                    </div>
                                </div>
                            </section>

                            {/* Essays */}
                            <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 border-b border-slate-200 dark:border-slate-700 pb-2">Application Essays</h3>
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-800 dark:text-blue-400 mb-2">Question 1: Explain your interest in the camp.</h4>
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                                            <p className="whitespace-pre-wrap">{application.essays?.question1 || "No answer provided."}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-800 dark:text-blue-400 mb-2">Question 2: Medical / Dietary Needs.</h4>
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                                            <p className="whitespace-pre-wrap">{application.essays?.question2 || "No answer provided."}</p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Sidebar: Reviewer Tools */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden sticky top-24">
                                <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Reviewer Assessment</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Evaluate the candidate based on the criteria below.</p>
                                </div>
                                <div className="p-6 space-y-6">
                                    {/* Rating */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">Overall Rating</label>
                                        <div className="flex items-center gap-2 mb-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    onClick={() => setReviewScore(star)}
                                                    className={`hover:scale-110 transition-transform focus:outline-none ${reviewScore >= star ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                                                >
                                                    <Star size={28} fill={reviewScore >= star ? "currentColor" : "none"} />
                                                </button>
                                            ))}
                                            <span className="ml-2 text-sm font-bold text-gray-700 dark:text-gray-300">{reviewScore}/5</span>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Click stars to rate.</p>
                                    </div>

                                    {/* Decision */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Decision Recommendation</label>
                                        <select
                                            value={internalDecision || ""}
                                            onChange={(e) => setInternalDecision(e.target.value)}
                                            className="block w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5"
                                        >
                                            <option value="" disabled>Select decision...</option>
                                            <option value="accepted">Accept</option>
                                            <option value="waitlisted">Waitlist</option>
                                            <option value="rejected">Reject</option>
                                        </select>
                                    </div>

                                    {/* Comment */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                                            Detailed Comments <span className="text-xs font-normal text-slate-500 ml-1">(Private to admins)</span>
                                        </label>
                                        <textarea
                                            value={reviewNote}
                                            onChange={(e) => setReviewNote(e.target.value)}
                                            className="block w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 placeholder-slate-400"
                                            rows={6}
                                            placeholder="Write your assessment here..."
                                        ></textarea>
                                    </div>

                                    {/* Current Notes Display (Optional, simplified) */}
                                    {application.adminData?.notes && application.adminData.notes.length > 0 && (
                                        <div className="bg-slate-50 p-3 rounded text-xs text-slate-600 space-y-2 max-h-40 overflow-y-auto">
                                            <p className="font-semibold text-slate-800">Previous Notes:</p>
                                            {application.adminData.notes.map((n, i) => (
                                                <div key={i} className="border-b border-slate-200 pb-1 mb-1 last:border-0">
                                                    <span className="font-bold">{n.author}</span>: {n.content} <br />
                                                    <span className="text-[10px] text-slate-400">{new Date(n.date).toLocaleDateString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="border-t border-slate-200 dark:border-slate-700 pt-6 flex flex-col gap-3">
                                        <Button
                                            onClick={handleSaveReview}
                                            disabled={saving}
                                            className="w-full flex justify-center items-center font-medium"
                                        >
                                            <Save size={16} className="mr-2" />
                                            Save Review
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Pending box */}
                            {!application.adminData?.internalDecision && (
                                <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex">
                                    <Info size={20} className="text-yellow-600 dark:text-yellow-500 flex-shrink-0" />
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Pending Decision</h3>
                                        <div className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                                            <p>This application has not been marked with a decision yet.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function AdminApplicationDetailPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            </div>
        }>
            <AdminApplicationDetailContent />
        </Suspense>
    );
}
