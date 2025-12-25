"use client"

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { dbService, DBApplication } from "@/lib/db-service";
import { Button } from "@/components/ui/button";
import { Check, Clock, FileText, Calendar, Mail, Loader2, ArrowRight, CreditCard, Download, Flag, PenTool, User, Eye, FilePen } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Components ---

function ProgressTimeline({ status }: { status: DBApplication['status'] }) {
    // Current Logic:
    // Registration: Always Check
    // Application Submitted: Check if submitted+, else Future
    // Under Review: Check if decision+, Active Pulse if under_review, Future if submitted only.
    // Final Decision: Check/Flag(Color) if decision+, Future if under_review or before.

    const isSubmitted = status !== 'draft';
    const isUnderReview = ['under_review', 'decision_released', 'enrolled', 'accepted', 'rejected', 'waitlisted'].includes(status);
    const isDecisionReleased = ['decision_released', 'enrolled', 'accepted', 'rejected', 'waitlisted'].includes(status);
    const isEnrolled = status === 'enrolled';

    return (
        <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-foreground mb-6">Progress Timeline</h3>
            <div className="grid grid-cols-[40px_1fr] gap-x-4">

                {/* --- Step 1: Registration --- */}
                {/* Icon Column */}
                <div className="flex flex-col items-center gap-1 pt-1">
                    <div className="size-8 rounded-full bg-primary flex items-center justify-center text-white">
                        <Check size={20} className="text-white" strokeWidth={3} />
                    </div>
                    {/* Vertical Line */}
                    <div className="w-[2px] bg-primary h-full min-h-[40px]"></div>
                </div>
                {/* Text Column */}
                <div className="flex flex-col pb-8">
                    <p className="text-base font-bold leading-normal text-foreground">Registration</p>
                    <p className="text-sm text-muted-foreground font-normal leading-normal">Completed on May 10, 2025</p>
                </div>

                {/* --- Step 2: Filling Application (New) --- */}
                {/* Icon Column */}
                <div className="flex flex-col items-center gap-1 pt-1">
                    {isSubmitted ? (
                        // Completed
                        <div className="size-8 rounded-full bg-primary flex items-center justify-center text-white z-10">
                            <Check size={20} className="text-white" strokeWidth={3} />
                        </div>
                    ) : (
                        // Active (Draft) - Yellow Pulse
                        <div className="size-8 rounded-full border-[3px] border-accent bg-white relative z-10 shadow-[0_0_15px_rgba(225,177,104,0.4)] flex items-center justify-center">
                            <div className="size-2.5 bg-accent rounded-full animate-pulse"></div>
                        </div>
                    )}
                    {/* Vertical Line */}
                    <div className={cn(
                        "w-[2px] h-full min-h-[40px]",
                        isSubmitted ? "bg-primary" : "bg-muted"
                    )}></div>
                </div>
                {/* Text Column */}
                <div className="flex flex-col pb-8 pt-1">
                    <p className={cn("text-base font-bold leading-normal")}>
                        Filling Application
                    </p>
                    <p className="text-sm text-muted-foreground font-normal leading-normal">
                        {isSubmitted ? "Completed" : "In Progress..."}
                    </p>
                </div>

                {/* --- Step 3: Application Submitted --- */}
                {/* Icon Column */}
                <div className="flex flex-col items-center gap-1 pt-1">
                    {/* Top connector adjustment if needed, but the previous line flows into this */}
                    {/* 
                       Logic for Icon:
                       - If Submitted: Check (Primary)
                       - If Not: Future (Gray) - (Though realistic user only sees this if submitted usually)
                     */}
                    {isSubmitted ? (
                        <div className="size-8 rounded-full bg-primary flex items-center justify-center text-white z-10">
                            <Check size={20} className="text-white" strokeWidth={3} />
                        </div>
                    ) : (
                        <div className="size-8 rounded-full bg-muted border-2 border-border flex items-center justify-center text-muted-foreground z-10">
                            <div className="h-2 w-2 rounded-full bg-muted-foreground/30"></div>
                        </div>
                    )}
                    {/* Vertical Line: Submitted -> Under Review */}
                    {/* If next step (Under Review) is active or done, line should be primary? 
                        Reference: "Registration" -> "App Submitted" line is primary.
                        "App Submitted" -> "Under Review" line is primary ONLY if "Under Review" is reached.
                    */}
                    <div className={cn(
                        "w-[2px] h-full min-h-[40px]",
                        isUnderReview ? "bg-primary" : "bg-muted" // Or bg-slate-200
                    )}></div>
                </div>
                {/* Text Column */}
                <div className="flex flex-col pb-8 pt-1">
                    <p className={cn("text-base font-bold leading-normal", !isSubmitted && "text-muted-foreground")}>Application Submitted</p>
                    <p className="text-sm text-muted-foreground font-normal leading-normal">
                        {isSubmitted ? "Submitted on June 12, 2025" : "Pending Submission"}
                    </p>
                </div>

                {/* --- Step 3: Under Review --- */}
                {/* Icon Column */}
                <div className="flex flex-col items-center gap-1 pt-1">
                    {isDecisionReleased ? (
                        // Completed
                        <div className="size-8 rounded-full bg-primary flex items-center justify-center text-white z-10">
                            <Check size={20} className="text-white" strokeWidth={3} />
                        </div>
                    ) : isUnderReview ? (
                        // Active Pulse
                        <div className="size-8 rounded-full border-[3px] border-accent bg-white relative z-10 shadow-[0_0_15px_rgba(225,177,104,0.4)] flex items-center justify-center">
                            <div className="size-2.5 bg-accent rounded-full animate-pulse"></div>
                        </div>
                    ) : (
                        // Future
                        <div className="size-8 rounded-full bg-muted border-2 border-border flex items-center justify-center text-muted-foreground z-10">
                            <div className="h-2 w-2 rounded-full bg-muted-foreground/30"></div>
                        </div>
                    )}

                    {/* Vertical Line: Under Review -> Decision */}
                    <div className={cn(
                        "w-[2px] h-full min-h-[40px]",
                        isDecisionReleased ? "bg-primary" : "bg-muted"
                    )}></div>
                </div>
                {/* Text Column */}
                <div className="flex flex-col pb-8 pt-1">
                    <p className={cn(
                        "text-base font-bold leading-normal",
                        isUnderReview && !isDecisionReleased ? "text-primary dark:text-accent" : // Active color
                            !isUnderReview ? "text-muted-foreground" : "text-foreground"
                    )}>
                        Under Review
                    </p>
                    <p className="text-sm text-muted-foreground font-normal leading-normal">
                        {isUnderReview && !isDecisionReleased ? "Currently in progress by admissions team" :
                            isDecisionReleased ? "Review completed" : "Pending review"}
                    </p>
                </div>

                {/* --- Step 4: Final Decision --- */}
                {/* Icon Column */}
                <div className="flex flex-col items-center gap-1 pt-1">
                    {/* Line from top is handled by previous block */}

                    {/* Icon */}
                    {isDecisionReleased ? (
                        isEnrolled ? (
                            <div className="size-8 rounded-full bg-primary flex items-center justify-center text-white z-10">
                                <Check size={20} className="text-white" strokeWidth={3} />
                            </div>
                        ) : (
                            // Decision Out but not enrolled (Action Required) -> Active Glow State
                            <div className="size-8 rounded-full bg-[#FFF8E6] border-[3px] border-[#E1B168] relative z-10 shadow-[0_0_15px_rgba(225,177,104,0.6)] flex items-center justify-center text-[#E1B168]">
                                <Flag size={16} className="text-[#E1B168] fill-[#E1B168] animate-pulse" />
                            </div>
                        )
                    ) : (
                        // Future
                        <div className="size-8 rounded-full bg-muted border-2 border-border flex items-center justify-center text-muted-foreground z-10">
                            <Flag size={18} />
                        </div>
                    )}

                    {/* Line to next? Only if Enrolled state exists as a step */}
                    {isEnrolled && <div className="w-[2px] bg-primary h-full min-h-[40px]"></div>}
                </div>
                {/* Text Column */}
                <div className={cn("flex flex-col pt-1", isEnrolled ? "pb-8" : "pb-0")}>
                    <p className={cn(
                        "text-base font-bold leading-normal",
                        isDecisionReleased ? "text-foreground" : "text-muted-foreground"
                    )}>
                        Final Decision
                    </p>
                    <p className="text-sm text-muted-foreground font-normal leading-normal">
                        {isDecisionReleased ? "Decision Available" : "Expected July 15, 2025"}
                    </p>
                </div>

                {/* --- Optional Step 5: Offer Accepted --- */}
                {isEnrolled && (
                    <>
                        {/* Icon Column */}
                        <div className="flex flex-col items-center gap-1 pt-0">
                            <div className="size-8 rounded-full bg-green-50 border-[3px] border-green-600 relative z-10 shadow-[0_0_15px_rgba(22,163,74,0.6)] flex items-center justify-center text-green-600">
                                <Check size={20} className="text-green-600 animate-pulse" strokeWidth={3} />
                            </div>
                        </div>
                        {/* Text Column */}
                        <div className="flex flex-col pb-1 pt-1">
                            <p className="text-base font-bold leading-normal text-green-700">
                                Offer Accepted
                            </p>
                            <p className="text-sm text-muted-foreground font-normal leading-normal">
                                See you this summer!
                            </p>
                        </div>
                    </>
                )}

            </div>
        </div>
    );
}


function ApplicationDetails({ app, user }: { app: DBApplication, user: any }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 border-b bg-[#F9FAFC]">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Details</h3>
            </div>
            <div className="p-5 flex flex-col gap-4">
                <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                        <p className="text-xs uppercase font-bold text-muted-foreground">Applicant Name</p>
                        <p className="text-sm font-medium">{user.displayName || user.email}</p>
                    </div>
                </div>
                <div className="h-px bg-border w-full"></div>
                <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                        <p className="text-xs uppercase font-bold text-muted-foreground">Application ID</p>
                        <p className="text-sm font-medium">#{app.userId.slice(0, 8).toUpperCase()}</p>
                    </div>
                </div>
                <div className="h-px bg-border w-full"></div>
                <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                        <p className="text-xs uppercase font-bold text-muted-foreground">Submission Date</p>
                        <p className="text-sm font-medium">{app.timeline?.submittedAt ? new Date(app.timeline.submittedAt).toLocaleDateString() : 'N/A'}</p>
                    </div>
                </div>
            </div>
            <div className="p-4 border-t bg-[#F9FAFC]">
                {app.status === 'draft' ? (
                    <Button variant="outline" className="w-full font-bold" asChild>
                        <Link href="/apply">
                            <FilePen className="mr-2 h-4 w-4" strokeWidth={2.5} />
                            Edit Application
                        </Link>
                    </Button>
                ) : (
                    <Button variant="outline" className="w-full font-bold" asChild>
                        <Link href="/apply">
                            <Eye className="mr-2 h-4 w-4" strokeWidth={2.5} />
                            View Full Application
                        </Link>
                    </Button>
                )}
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [app, setApp] = useState<DBApplication | null>(null);
    const [loading, setLoading] = useState(true);

    // Initial auth check
    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [authLoading, user, router]);

    // Data Load
    useEffect(() => {
        const fetchApp = async () => {
            if (!user) return;
            const uid = user.uid;
            console.log("Dashboard fetching app for:", uid);
            try {
                const myApp = await dbService.getMyApplication(uid);
                setApp(myApp);

                // If no app (shouldn't happen if registered), redirect or handle.
                // For real flow, usually user clicks Apply first.
                // If dashboard is home, maybe show "Start Application".
                // Current flow: if no app, redirect to welcome?
                // But welcome says "Registration Complete".
                // If myApp is null, we should probably redirect to welcome or show "Empty".
                if (!myApp) {
                    console.log("No app found on dashboard, redirecting to welcome");
                    router.replace("/welcome");
                    return;
                }
            } catch (err) {
                console.error("Dashboard fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchApp();
    }, [user, router]);

    // Helper to advance state for demo
    const handleAdvance = async () => {
        if (!user || !app) return;
        setLoading(true);
        const uid = user.uid;
        try {
            await dbService.advanceStatus(uid, app.status);
            // Re-fetch to see changes
            const updated = await dbService.getMyApplication(uid);
            setApp(updated);
        } finally {
            setLoading(false);
        }
    };

    // Helper to rollback state for demo - DISABLED for now in DB mode
    const handleRollback = async () => {
        // Not implemented in DB service yet
        console.warn("Rollback not implemented");
    };

    if (authLoading || loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user || !app) return null;

    // --- RENDER BASED ON STATUS ---

    return (
        <div className="container max-w-7xl mx-auto px-4 py-8 md:py-12">

            {/* Header Area */}
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl md:text-4xl font-black text-foreground">Application Status</h1>
                    <p className="text-muted-foreground text-lg">Track the progress of your summer camp application.</p>
                </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Main Content */}
                <div className="lg:col-span-8 flex flex-col gap-8">

                    <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm border relative overflow-hidden group">
                        {/* Dynamic Backgrounds based on status */}
                        <div className={cn(
                            "absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl transition-all duration-700",
                            app.status === 'enrolled' ? "bg-green-500/10" : "bg-accent/10"
                        )} />

                        <div className="relative z-10 flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                {app.status === 'enrolled' ? (
                                    <span className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-bold uppercase">Accepted & Confirmed</span>
                                ) : app.status === 'decision_released' ? (
                                    <span className="px-3 py-1 rounded-full bg-accent text-primary text-xs font-bold uppercase">Action Required</span>
                                ) : (
                                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary dark:text-accent text-xs font-bold uppercase">Current Status</span>
                                )}
                                <span className="text-sm text-muted-foreground">Updated recently</span>
                            </div>

                            {/* MAIN STATUS TEXT */}
                            {app.status === 'enrolled' ? (
                                <>
                                    <h2 className="text-2xl md:text-3xl font-bold leading-tight">录取成功，已接受 Offer！ 🎉</h2>
                                    <p className="text-muted-foreground leading-relaxed">
                                        Congratulations! You have accepted our offer. Please complete the tuition payment to secure your spot.
                                    </p>
                                    <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row gap-4">
                                        <Button size="lg">
                                            前往缴费 <CreditCard className="ml-2 h-5 w-5" />
                                        </Button>
                                        <Button variant="outline" size="lg">
                                            Download Acceptance Letter <Download className="ml-2 h-5 w-5" />
                                        </Button>
                                    </div>
                                </>
                            ) : app.status === 'decision_released' ? (
                                <>
                                    <h2 className="text-2xl md:text-3xl font-bold leading-tight">Application Results Available 🔔</h2>
                                    <p className="text-muted-foreground leading-relaxed">
                                        The admissions team has completed the review of your application. Please click below to view your result.
                                    </p>
                                    <div className="mt-4 pt-4 border-t flex gap-4">
                                        <Button size="lg" asChild>
                                            <Link href="/acceptance">
                                                查看申请结果 <ArrowRight className="ml-2 h-5 w-5" />
                                            </Link>
                                        </Button>
                                    </div>
                                </>
                            ) : app.status === 'draft' ? (
                                // Draft State
                                <>
                                    <h2 className="text-2xl md:text-3xl font-bold leading-tight">Application In Progress ✍️</h2>
                                    <p className="text-muted-foreground leading-relaxed">
                                        Please complete your application form as soon as possible to secure your spot. We look forward to reviewing your application!
                                    </p>
                                    <div className="mt-4 pt-4 border-t flex gap-4">
                                        <Button size="lg" asChild>
                                            <Link href="/apply">
                                                Continue Application <ArrowRight className="ml-2 h-5 w-5" />
                                            </Link>
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                // Default: Submitted or Under Review
                                <>
                                    <h2 className="text-2xl md:text-3xl font-bold leading-tight">Your application is under review 👀</h2>
                                    <p className="text-muted-foreground leading-relaxed">
                                        We have received all your documents. You should hear back from us by July 15th.
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    <ProgressTimeline status={app.status} />

                </div>

                {/* Right Sidebar */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <ApplicationDetails app={app} user={user} />

                    {/* Contact Card */}
                    <div className="bg-primary rounded-xl p-6 text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="font-bold text-lg mb-2">Have questions?</h3>
                            <p className="text-sm text-white/80 mb-4 opacity-90">If you have any issues with your application status, please reach out to our admissions team.</p>
                            <Button size="sm" className="w-full sm:w-auto" asChild>
                                <a href="mailto:admissions@jianshan.com">
                                    <Mail className="mr-2 h-4 w-4" />
                                    Email Admissions
                                </a>
                            </Button>
                        </div>
                        {/* Background Icon Decoration */}
                        <div className="absolute -right-6 -bottom-10 opacity-10 rotate-12 text-white pointer-events-none">
                            <Mail className="h-[120px] w-[120px]" />
                        </div>
                    </div>

                    {/* DEV TOOL: Advance State */}

                    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
                        {app.status !== 'enrolled' && (
                            <Button onClick={handleAdvance} size="sm" className="shadow-xl bg-red-600 hover:bg-red-700 text-white border-2 border-white">
                                [DEV] Advance State
                            </Button>
                        )}
                        {/* Rollback disabled for now
                        {(app.status === 'decision_released' || app.status === 'enrolled') && (
                            <Button onClick={handleRollback} size="sm" className="shadow-xl bg-blue-600 hover:bg-blue-700 text-white border-2 border-white">
                                [DEV] Previous State
                            </Button>
                        )}
                        */}
                        <Button onClick={async () => {
                            if (!user) return;
                            const uid = user.uid;
                            setLoading(true);
                            await dbService.resetApplication(uid);
                            router.push("/welcome");
                        }} size="sm" className="shadow-xl bg-slate-800 hover:bg-slate-900 text-white border-2 border-white">
                            [DEV] Reset / Clear App
                        </Button>
                    </div>

                </div>
            </div>
        </div>
    );
}
