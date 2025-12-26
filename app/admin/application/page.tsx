"use client"

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { dbService, DBApplication } from "@/lib/db-service";
import { ArrowLeft, User, Mail, School, Calendar, Download, CheckCircle, XCircle, Clock, Star, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { APPLICATION_CONFIG } from "@/lib/config";

// ... (Components like StatusTag can remain or be inline)
function StatusTag({ status }: { status: string }) {
    const styles: Record<string, string> = {
        submitted: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        under_review: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
        decision_released: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        accepted: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        waitlisted: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        enrolled: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
        draft: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    };
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || styles.draft}`}>
            {status.replace('_', ' ').toUpperCase()}
        </span>
    );
}

function AdminApplicationDetailContent() {
    const { user, loading: authLoading, isAdmin } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get('id');

    const [application, setApplication] = useState<DBApplication | null>(null);
    const [loading, setLoading] = useState(true);

    // Review Form State
    const [reviewScore, setReviewScore] = useState(0);
    const [internalDecision, setInternalDecision] = useState<string>("");
    const [reviewNote, setReviewNote] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!authLoading && !isAdmin) router.push('/');
    }, [authLoading, isAdmin, router]);

    const fetchApplication = async () => {
        if (!id) return;
        setLoading(true);
        try {
            // Using getMyApplication but strictly passing User ID (which is the doc ID).
            const data = await dbService.getMyApplication(id);
            if (data) {
                setApplication(data);
                // Init form state
                setReviewScore(data.adminData?.reviewScore || 0);
                setInternalDecision(data.adminData?.internalDecision || "");
            }
        } catch (e) {
            console.error("Fetch failed", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAdmin && id) {
            fetchApplication();
        }
    }, [isAdmin, id]);

    const handleSaveReview = async () => {
        if (!application || !user?.email) return;
        setSaving(true);
        try {
            await dbService.updateAdminReview(application.userId, {
                reviewScore: reviewScore,
                decision: internalDecision as any,
                note: reviewNote,
                author: user.email
            });
            setReviewNote("");
            await fetchApplication();
            alert("Review saved successfully.");
        } catch (e) {
            console.error("Failed to save review", e);
            alert("Failed to save review.");
        } finally {
            setSaving(false);
        }
    };

    // Release Result Handler
    const handleRelease = async () => {
        if (!application) return;
        const confirm = window.confirm("Are you sure you want to release the result to the candidate? This will update their public status.");
        if (!confirm) return;
        try {
            await dbService.releaseResult(application.userId);
            await fetchApplication();
            alert("Result released!");
        } catch (e) {
            console.error("Failed", e);
            alert("Failed to release.");
        }
    };

    if (loading || !application) return <div className="p-12 text-center">Loading...</div>;

    const formData = application.formData || {};
    const notes = application.adminData?.notes || [];

    return (
        <div className="bg-slate-50 dark:bg-slate-900 min-h-screen flex flex-col font-sans text-slate-700 dark:text-slate-200">

            <main className="flex-grow p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Breadcrumb & Title */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <button onClick={() => router.back()} className="flex items-center text-sm text-slate-500 hover:text-blue-600 transition-colors mb-2">
                                <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
                            </button>
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                                {application.personalInfoSnapshot?.firstName} {application.personalInfoSnapshot?.lastName}
                            </h2>
                            <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                                <span className="flex items-center gap-1"><Mail size={14} /> {application.personalInfoSnapshot?.email || "No Email"}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1"><Clock size={14} /> Submitted {application.timeline?.submittedAt ? new Date(application.timeline.submittedAt).toLocaleDateString() : 'N/A'}</span>
                                <span>•</span>
                                <StatusTag status={application.status} />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            {/* <Button variant="outline"><Download size={16} className="mr-2"/> Download PDF</Button> */}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Application Data */}
                        <div className="lg:col-span-2 space-y-8">

                            {/* Dynamic Sections based on Config */}

                            {/* Section: Essays & Basic Info */}
                            <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Application Responses</h3>
                                </div>
                                <div className="p-6 space-y-6">
                                    {APPLICATION_CONFIG.essays.map(field => (
                                        <div key={field.id} className="space-y-2 border-b border-slate-100 dark:border-slate-700/50 last:border-0 pb-4 last:pb-0">
                                            <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{field.label}</h4>
                                            <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                                                {formData[field.id] || <span className="text-slate-400 italic">No answer provided</span>}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Section: Academic / Selections */}
                            <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Academic & Selection</h3>
                                </div>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {APPLICATION_CONFIG.selections.map(field => (
                                        <div key={field.id}>
                                            <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{field.label}</h4>
                                            <p className="text-slate-800 dark:text-slate-200">{formData[field.id]}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Section: Preferences */}
                            <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Program Preferences</h3>
                                </div>
                                <div className="p-6 space-y-4">
                                    {APPLICATION_CONFIG.programPreferences.rows.map(row => (
                                        <div key={row.id} className="flex justify-between border-b last:border-0 pb-2">
                                            <span className="font-medium text-slate-700 dark:text-slate-300">{row.label}</span>
                                            <span className="text-slate-900 dark:text-white font-bold">{formData[`pref_${row.id}`] || '-'}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Section: Uploads (Links) */}
                            <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Documents</h3>
                                </div>
                                <div className="p-6 space-y-4">
                                    {APPLICATION_CONFIG.uploads.map(field => (
                                        <div key={field.id}>
                                            <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{field.label}</h4>
                                            {formData[field.id] ? (
                                                <a href={formData[field.id]} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                                                    {formData[field.id]}
                                                </a>
                                            ) : <span className="text-slate-400">Not provided</span>}
                                        </div>
                                    ))}
                                </div>
                            </section>

                        </div>

                        {/* Right Column: Reviewer Tools */}
                        <div className="space-y-6">
                            {/* Assessment Card */}
                            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden sticky top-24">
                                <div className="bg-slate-900 text-white px-6 py-4">
                                    <h3 className="font-bold text-lg">Reviewer Assessment</h3>
                                </div>
                                <div className="p-6 space-y-6">

                                    {/* Score */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Overall Rating (1-5)</label>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map(score => (
                                                <button
                                                    key={score}
                                                    onClick={() => setReviewScore(score)}
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${reviewScore === score
                                                        ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400'
                                                        }`}
                                                >
                                                    {score}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Decision */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Recommendation</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['accepted', 'waitlisted', 'rejected'].map(decision => (
                                                <button
                                                    key={decision}
                                                    onClick={() => setInternalDecision(decision)}
                                                    className={`py-2 px-1 rounded-md text-xs font-bold uppercase transition-all ${internalDecision === decision
                                                        ? (decision === 'accepted' ? 'bg-green-600 text-white' : decision === 'rejected' ? 'bg-red-600 text-white' : 'bg-yellow-500 text-white')
                                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-700'
                                                        }`}
                                                >
                                                    {decision}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Action Button: Save Review */}
                                    <Button onClick={handleSaveReview} disabled={saving} className="w-full">
                                        {saving ? 'Saving...' : 'Save Review'}
                                    </Button>

                                    <div className="border-t border-slate-200 dark:border-slate-700 my-4"></div>

                                    {/* Release Button */}
                                    <div className="bg-slate-50 dark:bg-slate-900 rounded p-4 border border-slate-200 dark:border-slate-700">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Final Action</h4>
                                        <p className="text-xs text-slate-500 mb-3">
                                            Releasing the results will update the candidate's public status based on your recommendation.
                                        </p>
                                        <Button
                                            variant="secondary"
                                            className="w-full text-xs"
                                            onClick={handleRelease}
                                            disabled={!internalDecision || saving}
                                        >
                                            Release Result
                                        </Button>
                                    </div>

                                    {/* Notes History */}
                                    <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                            <MessageSquare size={16} /> Internal Notes
                                        </h4>
                                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                            {notes.map((note, i) => (
                                                <div key={i} className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded text-sm space-y-1">
                                                    <p className="text-slate-800 dark:text-slate-200">{note.content}</p>
                                                    <div className="text-xs text-slate-400 flex justify-between">
                                                        <span>{note.author}</span>
                                                        <span>{new Date(note.date).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            {notes.length === 0 && <p className="text-xs text-slate-400 italic">No notes yet.</p>}
                                        </div>
                                        <Textarea
                                            placeholder="Add a new note..."
                                            value={reviewNote}
                                            onChange={(e) => setReviewNote(e.target.value)}
                                            className="text-sm min-h-[80px]"
                                        />
                                    </div>

                                </div>
                            </div>
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
