"use client"

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { dbService, DBApplication } from "@/lib/db-service";
import { Button } from "@/components/ui/button";
import { Check, Clock, FileText, Calendar, Mail, Loader2, ArrowRight, CreditCard, Download, Flag, Eye, FilePen, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { APPLICATION_CONFIG } from "@/lib/config";

// --- Components ---

function ProgressTimeline({ app }: { app: DBApplication }) {
    const status = app.status;
    const stage = app.adminData?.stage;

    // Timeline Steps Logic
    // 1. Registration: Always Done
    // 2. Filling Application: Done if submitted, Active if draft.
    // 3. Application Submitted: Done if submitted.
    // 4. Initial Review: Done if (under_review AND stage=second_round) OR decision released. Active if under_review AND stage=first_round.
    // 5. Second Round Review: Active if under_review AND stage=second_round. Done if decision released.
    // 6. Final Decision: Done if decision released.

    const isSubmitted = status !== 'draft';
    const isUnderReview = ['under_review', 'decision_released', 'enrolled', 'accepted', 'rejected', 'waitlisted'].includes(status);
    const isDecisionReleased = ['decision_released', 'enrolled', 'accepted', 'rejected', 'waitlisted'].includes(status);

    // Stage Logic
    // If we are in 'under_review' and NOT 'second_round', we assume we are in Initial Review (or just generic review).
    // If we are in 'under_review' AND 'second_round', Initial Review is PASSED.
    const isRound2 = stage === 'second_round';

    // Determine Step States
    const step1_Reg: 'done' | 'active' | 'future' = 'done'; // Always done
    const step2_Fill: 'done' | 'active' | 'future' = isSubmitted ? 'done' : 'active';
    const step3_Submit: 'done' | 'active' | 'future' = isSubmitted ? 'done' : 'future';

    // Initial Review: 
    // If decision released -> Done.
    // If Round 2 -> Done.
    // If Under Review (and not R2) -> Active? (Or just done if we consider submission = initial review start)
    // Let's say: Active if Under Review & R1. Done if R2 or Decision Released.
    let step4_Initial: 'done' | 'active' | 'future' = 'future';
    if (isDecisionReleased) step4_Initial = 'done';
    else if (isRound2) step4_Initial = 'done';
    else if (isUnderReview) step4_Initial = 'done'; // Assuming generic under_review means passed initial screening mostly? Or 'active'. Let's say 'Passed on...' implies done. 

    // Second Round:
    // If decision released -> Done (or skipped if never went to R2? effectively done)
    // If Round 2 -> Active.
    let step5_Round2: 'done' | 'active' | 'future' = 'future';
    if (isDecisionReleased) step5_Round2 = 'done';
    else if (isRound2) step5_Round2 = 'active';

    // Final Decision:
    let step6_Final: 'done' | 'active' | 'future' = 'future';
    if (isDecisionReleased) step6_Final = 'active'; // Or 'done' visual? Design shows Flag.

    // Helper for Timeline Item
    const TimelineItem = ({
        title,
        date,
        state,
        last = false
    }: {
        title: string,
        date: string,
        state: 'done' | 'active' | 'future',
        last?: boolean
    }) => {
        return (
            <div className="relative flex items-start mb-10 last:mb-0 group">
                {!last && (
                    <div className={cn(
                        "absolute top-2 left-[18px] bottom-[-40px] w-0.5",
                        state === 'done' ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"
                    )}></div>
                )}

                <div className="absolute left-0 z-10">
                    {state === 'done' && (
                        <div className="bg-green-500 rounded-full p-1 border-4 border-white dark:border-slate-800">
                            <Check size={14} className="text-white font-bold" strokeWidth={4} />
                        </div>
                    )}
                    {state === 'active' && (
                        <div className="bg-white dark:bg-slate-800 rounded-full p-1 border-4 border-[#DCA54E] shadow-lg">
                            <div className="w-4 h-4 bg-[#DCA54E] rounded-full"></div>
                        </div>
                    )}
                    {state === 'future' && (
                        <div className="bg-gray-200 dark:bg-gray-700 rounded-full p-1.5 border-4 border-white dark:border-slate-800">
                            <Flag size={14} className="text-gray-400 dark:text-gray-500" />
                        </div>
                    )}
                </div>

                <div className="ml-12">
                    <h3 className={cn(
                        "text-lg font-semibold transition-colors",
                        state === 'active' ? "text-[#DCA54E] dark:text-[#DCA54E]" :
                            state === 'done' ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-gray-500"
                    )}>{title}</h3>

                    {state === 'active' && (
                        <p className="text-sm text-slate-600 dark:text-slate-300 font-medium bg-yellow-50 dark:bg-yellow-900/20 px-2 py-0.5 rounded inline-block mt-1">
                            In Progress...
                        </p>
                    )}

                    <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">{date}</p>
                </div>
            </div>
        )
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 sm:p-8 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-8">Progress Timeline</h2>
            <div className="relative pl-2">
                <TimelineItem
                    title="Registration"
                    date="Completed"
                    state="done"
                />
                <TimelineItem
                    title="Filling Application"
                    date={isSubmitted ? "Completed" : "In Progress"}
                    state={step2_Fill}
                />
                <TimelineItem
                    title="Application Submitted"
                    date={app.timeline?.submittedAt ? `Submitted on ${new Date(app.timeline.submittedAt).toLocaleDateString()}` : "Pending"}
                    state={step3_Submit}
                />
                <TimelineItem
                    title="Initial Review"
                    date={step4_Initial === 'done' ? "Passed" : "Pending"}
                    state={step4_Initial}
                />
                <TimelineItem
                    title="Second Round Review"
                    date="Detailed assessment by committee"
                    state={step5_Round2}
                />
                <TimelineItem
                    title="Final Decision"
                    date="Expected July 15, 2025"
                    state={step6_Final}
                    last={true}
                />
            </div>
        </div>
    );
}


function ApplicationDetails({ app, user }: { app: DBApplication, user: any }) {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-slate-50/50 dark:bg-slate-800/50">
                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Details</h3>
            </div>
            <div className="p-6 space-y-6">
                <div className="flex items-start gap-4">
                    <div className="mt-0.5 text-slate-400">
                        <User size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-0.5">Applicant Name</p>
                        <p className="text-base font-medium text-slate-900 dark:text-white">{user.displayName || user.email}</p>
                    </div>
                </div>
                <div className="flex items-start gap-4">
                    <div className="mt-0.5 text-slate-400">
                        <FileText size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-0.5">Application ID</p>
                        <p className="text-base font-medium text-slate-900 dark:text-white">#{app.userId.slice(0, 8).toUpperCase()}</p>
                    </div>
                </div>
                <div className="flex items-start gap-4">
                    <div className="mt-0.5 text-slate-400">
                        <Calendar size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-0.5">Submission Date</p>
                        <p className="text-base font-medium text-slate-900 dark:text-white">
                            {app.timeline?.submittedAt ? new Date(app.timeline.submittedAt).toLocaleDateString() : 'N/A'}
                        </p>
                    </div>
                </div>
            </div>
            <div className="px-6 pb-6">
                <button className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium py-2.5 px-4 rounded-lg transition-colors flex justify-center items-center gap-2">
                    <FilePen size={16} />
                    Edit Application
                </button>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [app, setApp] = useState<DBApplication | null>(null);
    const [loading, setLoading] = useState(true);
    const [secondRoundAnswer, setSecondRoundAnswer] = useState("");
    const [submittingR2, setSubmittingR2] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) router.push("/login");
    }, [authLoading, user, router]);

    useEffect(() => {
        const fetchApp = async () => {
            if (!user) return;
            try {
                const myApp = await dbService.getMyApplication(user.uid);
                setApp(myApp);
                if (!myApp) router.replace("/welcome");
            } finally {
                setLoading(false);
            }
        };
        fetchApp();
    }, [user, router]);

    useEffect(() => {
        if (app?.formData?.secondRoundVideo) {
            setSecondRoundAnswer(app.formData.secondRoundVideo);
        }
    }, [app]);

    const handleSecondRoundSubmit = async () => {
        if (!app || !user || !secondRoundAnswer.trim()) return;
        setSubmittingR2(true);
        try {
            await dbService.saveApplication(user.uid, {
                ...app.formData,
                secondRoundVideo: secondRoundAnswer
            });
            alert("Video link submitted successfully!");
            // Refresh app data
            const updated = await dbService.getMyApplication(user.uid);
            setApp(updated);
        } catch (e) {
            console.error("Failed to submit", e);
            alert("Failed to submit.");
        } finally {
            setSubmittingR2(false);
        }
    };

    // Helpers for Dev
    const handleAdvance = async () => {
        if (!user || !app) return;
        setLoading(true);
        await dbService.advanceStatus(user.uid, app.status);
        const updated = await dbService.getMyApplication(user.uid);
        setApp(updated);
        setLoading(false);
    };

    if (authLoading || loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#DCA54E]" /></div>;
    }

    if (!user || !app) return null;

    const isRound2 = app.status !== 'decision_released' && app.status !== 'enrolled' && app.adminData?.stage === 'second_round';

    return (
        <div className="bg-[#F3F5F7] dark:bg-[#111827] min-h-screen font-sans text-slate-900 dark:text-white transition-colors duration-200">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* HERO CARD */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 sm:p-8 border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-4">
                                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 uppercase tracking-wide">
                                    Current Status
                                </div>
                                <span className="text-sm text-slate-500 dark:text-slate-400">Updated recently</span>
                            </div>

                            {/* DYNAMIC HERO CONTENT */}
                            {isRound2 ? (
                                <>
                                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-3">
                                        Second Round Review <span className="text-3xl">🧐</span>
                                    </h1>
                                    <p className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed max-w-2xl">
                                        Congratulations! Your application has successfully passed the initial screening. We are now conducting a thorough second round review. Our team is carefully assessing your qualifications against our criteria.
                                    </p>
                                    <Button className="bg-[#DCA54E] hover:bg-yellow-600 text-white font-semibold py-6 px-8 rounded-lg transition-colors flex items-center gap-2 shadow-md hover:shadow-lg transform active:scale-95 duration-150">
                                        Complete Second Round Task <ArrowRight size={18} />
                                    </Button>

                                    {/* Question for Round 2 */}
                                    {APPLICATION_CONFIG.secondRound && (
                                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                                            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{APPLICATION_CONFIG.secondRound.title}</h2>
                                            <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm whitespace-pre-wrap leading-relaxed">
                                                {APPLICATION_CONFIG.secondRound.description}
                                            </p>

                                            <div className="bg-blue-50 dark:bg-slate-700/50 p-4 rounded-md mb-6 border border-blue-100 dark:border-slate-600">
                                                <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-2 uppercase tracking-wide">Video Requirements</h4>
                                                <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 dark:text-slate-300">
                                                    {APPLICATION_CONFIG.secondRound.requirements.map((req, i) => (
                                                        <li key={i}>{req}</li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                                    {APPLICATION_CONFIG.secondRound.label}
                                                </label>
                                                <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm italic">
                                                    {APPLICATION_CONFIG.secondRound.prompt}
                                                </p>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        className="flex-grow rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                        placeholder={APPLICATION_CONFIG.secondRound.placeholder}
                                                        value={secondRoundAnswer}
                                                        onChange={(e) => setSecondRoundAnswer(e.target.value)}
                                                    />
                                                    <Button
                                                        onClick={handleSecondRoundSubmit}
                                                        disabled={submittingR2}
                                                        size="default"
                                                        className="whitespace-nowrap"
                                                    >
                                                        {submittingR2 ? <Loader2 className="animate-spin h-4 w-4" /> : 'Submit'}
                                                    </Button>
                                                </div>
                                                {app.formData?.secondRoundVideo && (
                                                    <p className="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                                        <Check size={12} /> Submission received. Update link to re-submit.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : app.status === 'enrolled' ? (
                                <>
                                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Welcome Aboard! 🎉</h1>
                                    <p className="text-slate-600 dark:text-slate-300 mb-8">
                                        You have accepted the offer. We can't wait to see you this summer!
                                    </p>
                                    <Button className="bg-green-600 hover:bg-green-700 text-white py-6 px-8 rounded-lg shadow-md">
                                        Download Welcome Packet <Download size={18} className="ml-2" />
                                    </Button>
                                </>
                            ) : app.status === 'decision_released' ? (
                                <>
                                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Decision Available 🔔</h1>
                                    <p className="text-slate-600 dark:text-slate-300 mb-8">
                                        Your application decision is ready to view.
                                    </p>
                                    <Button asChild className="bg-[#DCA54E] hover:bg-yellow-600 text-white py-6 px-8 rounded-lg shadow-md">
                                        <Link href="/acceptance">View Decision <ArrowRight size={18} className="ml-2" /></Link>
                                    </Button>
                                </>
                            ) : app.status === 'draft' ? (
                                <>
                                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Application In Progress ✍️</h1>
                                    <p className="text-slate-600 dark:text-slate-300 mb-8">
                                        Continue where you left off.
                                    </p>
                                    <Button asChild className="bg-[#DCA54E] hover:bg-yellow-600 text-white py-6 px-8 rounded-lg shadow-md">
                                        <Link href="/apply">Continue Application <ArrowRight size={18} className="ml-2" /></Link>
                                    </Button>
                                </>
                            ) : (
                                // Default / Initial Review / Submitted
                                <>
                                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Application Under Review 👀</h1>
                                    <p className="text-slate-600 dark:text-slate-300 mb-8">
                                        Your application is currently being reviewed by our admissions team.
                                    </p>
                                </>
                            )}
                        </div>

                        {/* TIMELINE */}
                        <ProgressTimeline app={app} />

                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-1 space-y-6">
                        <ApplicationDetails app={app} user={user} />

                        {/* HELP CARD */}
                        <div className="bg-[#1E3A4C] rounded-xl shadow-md p-6 relative overflow-hidden text-white">
                            <div className="absolute -right-10 -bottom-10 opacity-10">
                                <Mail size={200} />
                            </div>
                            <h3 className="text-xl font-bold mb-2 relative z-10">Have questions?</h3>
                            <p className="text-blue-100 text-sm mb-6 relative z-10 leading-relaxed">
                                If you have any issues with your application status, please reach out to our admissions team.
                            </p>
                            <button className="relative z-10 w-full bg-[#DCA54E] hover:bg-yellow-600 text-[#1E3A4C] font-bold py-2.5 px-4 rounded-lg transition-colors flex justify-center items-center gap-2 shadow-sm">
                                <Mail size={18} />
                                Email Admissions
                            </button>
                        </div>

                        {/* ROUND 2 TIP - Only show in R2 */}
                        {isRound2 && (
                            <div className="bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-xl p-4 flex gap-3">
                                <div className="text-blue-500 dark:text-blue-400 mt-1">
                                    <Clock size={20} />
                                </div>
                                <p className="text-sm text-blue-800 dark:text-slate-300">
                                    <strong>Round 2 Tip:</strong> Ensure your portfolio links are accessible as reviewers will be clicking them frequently this week.
                                </p>
                            </div>
                        )}

                        {/* DEV TOOLS (Hidden in prod ideally, kept for user flow testing) */}
                        <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700">
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-4">Developer Tools</h4>
                            <div className="flex flex-col gap-2">
                                <Button onClick={handleAdvance} size="sm" variant="outline">Advance State</Button>
                                <Button onClick={async () => {
                                    if (!user) return;
                                    await dbService.resetApplication(user.uid);
                                    router.push("/welcome");
                                }} size="sm" variant="destructive">Reset Application</Button>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}
