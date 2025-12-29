"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { dbService, DBApplication } from "@/lib/db-service";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Check } from "lucide-react";
import { APPLICATION_CONFIG } from "@/lib/config";

export default function SecondRoundPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [app, setApp] = useState<DBApplication | null>(null);
    const [loading, setLoading] = useState(true);
    const [secondRoundAnswer, setSecondRoundAnswer] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) router.push("/login");
    }, [authLoading, user, router]);

    useEffect(() => {
        const fetchApp = async () => {
            if (!user) return;
            try {
                const myApp = await dbService.getMyApplication(user.uid);
                setApp(myApp);
                if (!myApp) {
                    router.replace("/welcome");
                    return;
                }

                // Guard: Only allow if in Second Round
                const isRound2 = myApp.status !== 'decision_released' && myApp.status !== 'enrolled' && myApp.adminData?.stage === 'second_round';
                if (!isRound2) {
                    router.replace("/dashboard");
                }

                if (myApp.formData?.secondRoundVideo) {
                    setSecondRoundAnswer(myApp.formData.secondRoundVideo);
                }

            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchApp();
    }, [user, router]);

    const handleSubmit = async () => {
        if (!app || !user || !secondRoundAnswer.trim()) return;
        setSubmitting(true);
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
            setSubmitting(false);
        }
    };

    if (authLoading || loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#DCA54E]" /></div>;
    }

    if (!user || !app) return null;

    if (!APPLICATION_CONFIG.secondRound) return <div>Configuration missing.</div>;

    return (
        <div className="bg-[#F3F5F7] dark:bg-[#111827] min-h-screen font-sans text-slate-900 dark:text-white">
            <main className="max-w-3xl mx-auto px-4 py-12">
                <Button variant="ghost" className="mb-6 pl-0 hover:bg-transparent hover:text-[#DCA54E]" onClick={() => router.back()}>
                    <ArrowLeft size={18} className="mr-2" /> Back to Dashboard
                </Button>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-8 border border-gray-100 dark:border-gray-700">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                        {APPLICATION_CONFIG.secondRound.title}
                    </h1>
                    <p className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed whitespace-pre-wrap">
                        {APPLICATION_CONFIG.secondRound.description}
                    </p>

                    <div className="bg-blue-50 dark:bg-slate-700/50 p-6 rounded-xl mb-8 border border-blue-100 dark:border-slate-600">
                        <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-4 uppercase tracking-wide">Video Requirements</h4>
                        <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300">
                            {APPLICATION_CONFIG.secondRound.requirements.map((req, i) => (
                                <li key={i}>{req}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-sm font-bold text-slate-900 dark:text-white">
                            {APPLICATION_CONFIG.secondRound.label}
                        </label>
                        <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                            {APPLICATION_CONFIG.secondRound.prompt}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="text"
                                className="flex-grow rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-3 text-base focus:ring-2 focus:ring-[#DCA54E] focus:border-[#DCA54E] outline-none transition-all"
                                placeholder={APPLICATION_CONFIG.secondRound.placeholder}
                                value={secondRoundAnswer}
                                onChange={(e) => setSecondRoundAnswer(e.target.value)}
                            />
                            <Button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="bg-[#DCA54E] hover:bg-yellow-600 text-white font-semibold py-3 px-8 rounded-lg h-auto"
                            >
                                {submitting ? <Loader2 className="animate-spin h-5 w-5" /> : 'Submit Video'}
                            </Button>
                        </div>

                        {app.formData?.secondRoundVideo && (
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-lg p-3 flex items-center gap-2 mt-4">
                                <Check size={16} className="text-green-600 dark:text-green-400" />
                                <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                                    Submission received. You can update the link above if needed.
                                </span>
                            </div>
                        )}
                    </div>

                </div>
            </main>
        </div>
    );
}
