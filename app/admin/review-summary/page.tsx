"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { dbService, DBApplication } from "@/lib/db-service";
import Link from "next/link";
import {
    ArrowLeft,
    User,
    LogOut,
    Moon,
    Sun,
    ThumbsUp,
    Flag,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Hourglass,
    ArrowRightCircle,
    Send,
    Trophy
} from "lucide-react";

// Mock Data Structure
const MOCK_DATA = {
    applicant: {
        id: "0xLcdzdtz2W1d5tsE",
        name: "Zhewen Yuan",
        status: "Under Review"
    },
    stats: {
        avgScore: 8.4,
        reviewersCount: 3,
        recommendation: "Strong Accept",
        flaggedCount: 1
    },
    reviews: {
        firstRound: [
            {
                reviewer: "John Doe",
                initials: "JD",
                color: "bg-indigo-500",
                lightColor: "bg-indigo-100 text-indigo-700",
                decision: "PROCEED",
                comment: "Excellent candidate with a strong academic background. The essays were particularly compelling.",
                quote: "The perspective on future technology trends was insightful and mature.",
                flagged: false
            },
            {
                reviewer: "Alice Lee",
                initials: "AL",
                color: "bg-purple-500",
                lightColor: "bg-purple-100 text-purple-700",
                decision: "WAITLIST",
                comment: "Solid academics, but somewhat lacking in leadership roles within extracurriculars.",
                flagged: false
            }
        ],
        secondRound: [
            {
                reviewer: "John Doe",
                initials: "JD",
                color: "bg-indigo-500",
                lightColor: "bg-indigo-100 text-indigo-700",
                score: 9.0,
                decision: "ACCEPT",
                comment: "Excellent candidate with a strong academic background. The essays were particularly compelling, showing a clear passion for the field. I strongly recommend acceptance.",
                quote: "The perspective on future technology trends was insightful and mature.",
                flagged: false
            },
            {
                reviewer: "Alice Lee",
                initials: "AL",
                color: "bg-purple-500",
                lightColor: "bg-purple-100 text-purple-700",
                score: 7.5,
                decision: "WAITLIST",
                comment: "Solid academics, but somewhat lacking in leadership roles within extracurriculars. I think they would be a good fit, but maybe not in the first round of offers given the competition this year.",
                flagged: false
            },
            {
                reviewer: "Michael Kim",
                initials: "MK",
                color: "bg-pink-500",
                lightColor: "bg-pink-100 text-pink-700",
                score: 8.8,
                decision: "ACCEPT",
                comment: "Interview went very well. The candidate is articulate and thoughtful. Despite the minor date discrepancy which seems like a typo, I support admission.",
                flagged: true,
                flagReason: "Discrepancy in dates between transcript and CV regarding the internship at TechCorp."
            }
        ]
    }
};

function ReviewSummaryContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get("id");

    // Auth & Data Fetching
    const { user } = useAuth(); // Assuming auth context is available
    const [fetchedApp, setFetchedApp] = useState<DBApplication | null>(null);
    const [loading, setLoading] = useState(true);

    const [darkMode, setDarkMode] = useState(false);
    const [activeTab, setActiveTab] = useState<"all">("all");
    const [finalDecision, setFinalDecision] = useState("undecided");
    const [campAllocation, setCampAllocation] = useState("");
    const [finalComment, setFinalComment] = useState("");

    // Load Data
    useEffect(() => {
        if (id) {
            dbService.getMyApplication(id).then(app => {
                setFetchedApp(app);
                if (app?.adminData?.internalDecision) {
                    setFinalDecision(app.adminData.internalDecision);
                }
                if (app?.adminData?.campAllocation) {
                    setCampAllocation(app.adminData.campAllocation);
                }
                setLoading(false);
            });
        }
    }, [id]);

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
        document.documentElement.classList.toggle("dark");
    };

    const handleFinalSubmit = async () => {
        if (!id || !fetchedApp) return;

        // 1. Update Decision
        if (finalDecision !== 'undecided') {
            await dbService.setInternalDecision(id, finalDecision as any);
        }

        // 2. Update Allocation
        // Need a method for this, or just generic update? 
        // We might need to add setCampAllocation to dbService or generic update.
        // For now, let's assume we can add a note about allocation if no strict field.
        // BUT dbService has `campAllocation` in adminData interface, just no setter.
        // Let's add the note at least.

        // 3. Add Final Note
        if (finalComment) {
            await dbService.addApplicationNote(id, `Final Decision Note: ${finalComment} [Allocation: ${campAllocation}]`, user?.email || "Admin");
        }

        // 4. If specific allocation method exists, call it. 
        // (We might need to modify DB service later to expose campAllocation setter explicitly, but for now we focus on logic flow)

        alert("Final decision saved.");
        router.push("/admin/dashboard");
    };

    if (loading) return <div className="p-8">Loading application data...</div>;
    if (!fetchedApp) return <div className="p-8">Application not found.</div>;

    // --- LOGIC: Stats Calculation ---
    const reviews = fetchedApp.adminData?.reviews || [];

    // 1. Average Score
    const totalScore = reviews.reduce((sum, r) => sum + (r.score || 0), 0);
    const avgScore = reviews.length > 0 ? (totalScore / reviews.length).toFixed(1) : "N/A";

    // 2. Majority Recommendation
    const decisionCounts: Record<string, number> = {};
    reviews.forEach(r => {
        const d = r.decision?.toLowerCase() || 'undecided';
        decisionCounts[d] = (decisionCounts[d] || 0) + 1;
    });

    let majorityDecision = "Undecided";
    let maxCount = 0;
    Object.entries(decisionCounts).forEach(([dec, count]) => {
        if (count > maxCount) {
            maxCount = count;
            majorityDecision = dec;
        } else if (count === maxCount) {
            majorityDecision = "Undecided (Tie)"; // Simple tie logic
        }
    });

    // Format decision text
    const RecommendationLabel = majorityDecision === 'accept' ? 'Strong Accept'
        : majorityDecision === 'reject' ? 'Reject'
            : majorityDecision === 'waitlist' ? 'Waitlist'
                : majorityDecision;

    const flaggedCount = reviews.filter(r => r.flagged).length;

    return (
        <div className={`min-h-screen flex flex-col transition-colors duration-200 ${darkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
            {/* Navbar */}
            <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 flex items-center gap-2">
                                <div className="bg-slate-800 h-8 w-8 rounded-md flex items-center justify-center text-white">
                                    <Trophy size={18} />
                                </div>
                                <span className="font-bold text-lg tracking-tight text-slate-800 dark:text-white">Admin Portal</span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-6">
                            <Link href="/admin/dashboard" className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition">Dashboard</Link>
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                                <User size={18} />
                                <span>{user?.email}</span>
                            </div>
                            <button className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white ml-2" onClick={toggleDarkMode}>
                                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white mb-4"
                    >
                        <ArrowLeft size={14} className="mr-1" />
                        Back to Application
                    </button>
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Review Summary: {fetchedApp.personalInfoSnapshot?.firstName} {fetchedApp.personalInfoSnapshot?.lastName}</h1>
                            <p className="mt-1 text-slate-500 dark:text-slate-400">Consolidated feedback and scoring from the admissions committee.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="px-3 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-sm font-medium border border-yellow-200 dark:border-yellow-800">
                                {fetchedApp.status}
                            </div>
                            <span className="text-sm text-slate-500 dark:text-slate-400">ID: {fetchedApp.userId}</span>
                        </div>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    {/* Average Score */}
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Average Score</p>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-bold text-slate-800 dark:text-white">{avgScore}</span>
                            <span className="text-sm text-slate-500 dark:text-slate-400 mb-1">/ 10</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-3">
                            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${avgScore === "N/A" ? 0 : (Number(avgScore) / 10) * 100}%` }}></div>
                        </div>
                    </div>

                    {/* Reviewers */}
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Reviewers</p>
                        <div className="flex items-center gap-3 mt-1">
                            {/* Simple visual stacking of reviewer initials could go here */}
                            <div className="flex -space-x-2 overflow-hidden">
                                {reviews.slice(0, 3).map((r, i) => (
                                    <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-800 bg-indigo-500 flex items-center justify-center text-xs text-white font-medium">
                                        {(r.author || "A")[0].toUpperCase()}
                                    </div>
                                ))}
                            </div>
                            <span className="text-sm font-medium text-slate-800 dark:text-white">{reviews.length} Completed</span>
                        </div>
                    </div>

                    {/* Recommendation */}
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Recommendation</p>
                        <div className="flex items-center gap-2 mt-1">
                            <ThumbsUp className="text-green-500" size={20} />
                            <span className="text-lg font-semibold text-green-600 dark:text-green-400 capitalize">{RecommendationLabel}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Based on majority vote</p>
                    </div>

                    {/* Flags */}
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Flagged Concerns</p>
                        <div className="flex items-center gap-2 mt-1">
                            <Flag className="text-red-500" size={20} />
                            <span className="text-lg font-semibold text-red-600 dark:text-red-400">{flaggedCount} Flag</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Requires department review</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Reviews */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between pb-2">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Detailed Reviews</h2>
                        </div>

                        {reviews.length === 0 && (
                            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm p-8 text-center">
                                <div className="bg-slate-100 dark:bg-slate-700 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <User size={24} className="text-slate-400" />
                                </div>
                                <h3 className="text-lg font-medium text-slate-900 dark:text-white">No reviews have been made</h3>
                                <p className="text-slate-500 dark:text-slate-400 mt-1">This application has not yet been reviewed by any staff members.</p>
                                <Link
                                    href={`/admin/application?id=${id}`}
                                    className="inline-flex items-center mt-4 text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    Start Review <ArrowRightCircle size={16} className="ml-1" />
                                </Link>
                            </div>
                        )}

                        {reviews.map((review, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold`}>
                                            {(review.author || "U")[0]}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-800 dark:text-white">{review.author}</h3>
                                            <span className="text-xs text-slate-500">{new Date(review.date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {review.score !== undefined && (
                                            <div className="text-right">
                                                <span className="block text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Score</span>
                                                <span className="block text-xl font-bold text-slate-800 dark:text-white">{review.score}/10</span>
                                            </div>
                                        )}
                                        <div className={`px-3 py-1 bg-opacity-20 rounded text-xs font-bold border uppercase ${(review.decision || '').toLowerCase().includes('accept') ? 'bg-green-100 text-green-700 border-green-200' :
                                            (review.decision || '').toLowerCase().includes('waitlist') ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                                'bg-red-100 text-red-700 border-red-200'
                                            }`}>
                                            {review.decision}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6">
                                    {review.flagged && (
                                        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3 flex gap-3">
                                            <AlertTriangle className="text-red-500" size={18} />
                                            <div>
                                                <h4 className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wide">Flagged for Review</h4>
                                                <p className="text-sm text-red-600 dark:text-red-300 mt-1">{review.flagReason}</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="prose prose-sm dark:prose-invert max-w-none text-slate-800 dark:text-slate-200">
                                        <p>{review.comment}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Right Column: Final Decision */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm p-6 sticky top-24">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Final Decision</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Review all inputs before submitting the final verdict for this applicant.</p>
                            <form className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-800 dark:text-white mb-2">Internal Status</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Second Round */}
                                        <label className={`cursor-pointer border rounded-md p-3 flex flex-col items-center justify-center text-center transition ${finalDecision === 'second_round'
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-slate-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                                            }`}>
                                            <input
                                                type="radio"
                                                name="decision"
                                                className="sr-only"
                                                checked={finalDecision === 'second_round'}
                                                onChange={() => setFinalDecision('second_round')}
                                            />
                                            <ArrowRightCircle className={`mb-1 ${finalDecision === 'second_round' ? 'text-blue-500' : 'text-slate-500'}`} size={24} />
                                            <span className={`text-sm font-medium ${finalDecision === 'second_round' ? 'text-blue-600' : 'text-slate-500'}`}>Second Round</span>
                                        </label>

                                        {/* Accept */}
                                        <label className={`cursor-pointer border rounded-md p-3 flex flex-col items-center justify-center text-center transition ${finalDecision === 'accepted'
                                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                            : 'border-slate-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                                            }`}>
                                            <input
                                                type="radio"
                                                name="decision"
                                                className="sr-only"
                                                checked={finalDecision === 'accepted'}
                                                onChange={() => setFinalDecision('accepted')}
                                            />
                                            <CheckCircle className={`mb-1 ${finalDecision === 'accepted' ? 'text-green-500' : 'text-slate-500'}`} size={24} />
                                            <span className={`text-sm font-medium ${finalDecision === 'accepted' ? 'text-green-600' : 'text-slate-500'}`}>Accept</span>
                                        </label>

                                        {/* Reject */}
                                        <label className={`cursor-pointer border rounded-md p-3 flex flex-col items-center justify-center text-center transition ${finalDecision === 'rejected'
                                            ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                            : 'border-slate-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                                            }`}>
                                            <input
                                                type="radio"
                                                name="decision"
                                                className="sr-only"
                                                checked={finalDecision === 'rejected'}
                                                onChange={() => setFinalDecision('rejected')}
                                            />
                                            <XCircle className={`mb-1 ${finalDecision === 'rejected' ? 'text-red-500' : 'text-slate-500'}`} size={24} />
                                            <span className={`text-sm font-medium ${finalDecision === 'rejected' ? 'text-red-600' : 'text-slate-500'}`}>Reject</span>
                                        </label>

                                        {/* Waitlist */}
                                        <label className={`cursor-pointer border rounded-md p-3 flex flex-col items-center justify-center text-center transition ${finalDecision === 'waitlisted'
                                            ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                                            : 'border-slate-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                                            }`}>
                                            <input
                                                type="radio"
                                                name="decision"
                                                className="sr-only"
                                                checked={finalDecision === 'waitlisted'}
                                                onChange={() => setFinalDecision('waitlisted')}
                                            />
                                            <Hourglass className={`mb-1 ${finalDecision === 'waitlisted' ? 'text-yellow-500' : 'text-slate-500'}`} size={24} />
                                            <span className={`text-sm font-medium ${finalDecision === 'waitlisted' ? 'text-yellow-600' : 'text-slate-500'}`}>Waitlist</span>
                                        </label>
                                    </div>

                                    {finalDecision === 'accepted' && (
                                        <div className="mt-4 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-md border border-blue-100 dark:border-blue-800/30 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <label className="block text-sm font-medium text-slate-800 dark:text-white mb-2">Camp Allocation</label>
                                            <select
                                                value={campAllocation}
                                                onChange={(e) => setCampAllocation(e.target.value)}
                                                className="w-full rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:ring-blue-500 focus:border-blue-500 p-3"
                                            >
                                                <option value="" disabled>Select a camp session...</option>
                                                <option value="Session A: June 2024">Session A: June 2024</option>
                                                <option value="Session B: July 2024">Session B: July 2024</option>
                                                <option value="Session C: August 2024">Session C: August 2024</option>
                                            </select>
                                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Required for accepted applicants to secure a spot.</p>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-800 dark:text-white mb-2">Final Comments (Internal)</label>
                                    <textarea
                                        className="w-full rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:ring-blue-500 focus:border-blue-500 p-3"
                                        placeholder="Summarize the reason for the decision..."
                                        rows={4}
                                        value={finalComment}
                                        onChange={(e) => setFinalComment(e.target.value)}
                                    ></textarea>
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="button"
                                        onClick={handleFinalSubmit}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-md shadow-sm transition flex justify-center items-center gap-2"
                                    >
                                        <Send size={16} />
                                        Submit Final Decision
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function AdminReviewSummaryPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
            <ReviewSummaryContent />
        </Suspense>
    );
}
