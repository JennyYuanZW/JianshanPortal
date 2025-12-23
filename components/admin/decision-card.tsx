"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { dbService } from "@/lib/db-service";
import { Loader2, AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react";


interface DecisionCardProps {
    applicationId: string;
    currentInternalDecision: 'accepted' | 'rejected' | 'waitlisted' | null | undefined;
    currentPublicStatus: string;
    onUpdate: () => void;
}

export function DecisionCard({ applicationId, currentInternalDecision, currentPublicStatus, onUpdate }: DecisionCardProps) {
    const [loading, setLoading] = useState(false);
    const [selectedDecision, setSelectedDecision] = useState<string>(currentInternalDecision || "");

    const handleSaveDecision = async (decision: string) => {
        setLoading(true);
        try {
            await dbService.setInternalDecision(applicationId, decision as any);
            setSelectedDecision(decision);
            onUpdate();
        } catch (e) {
            console.error("Failed to save decision", e);
        } finally {
            setLoading(false);
        }
    };

    const handleReleaseResult = async () => {
        if (!window.confirm(`Are you sure you want to release the result as "${currentInternalDecision}"? This action is immediate and the applicant will see it.`)) {
            return;
        }

        setLoading(true);
        try {
            await dbService.releaseResult(applicationId);
            onUpdate();
        } catch (e) {
            console.error("Failed to release result", e);
        } finally {
            setLoading(false);
        }
    };

    const isReleased = ['decision_released', 'enrolled', 'rejected', 'waitlisted'].includes(currentPublicStatus) && currentPublicStatus !== 'under_review';

    // Determine badge color for internal decision
    let decisionColor = "text-gray-500";
    if (currentInternalDecision === 'accepted') decisionColor = "text-green-600";
    if (currentInternalDecision === 'rejected') decisionColor = "text-red-600";
    if (currentInternalDecision === 'waitlisted') decisionColor = "text-orange-600";

    return (
        <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
                <CardTitle className="text-lg">Decision Management</CardTitle>
                <CardDescription>Mark decision internally, then release to applicant.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Step 1: Internal Marking */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Internal Decision Marking</label>
                    <div className="flex gap-2 flex-wrap">
                        <Button
                            variant={currentInternalDecision === 'accepted' ? "default" : "outline"}
                            className={currentInternalDecision === 'accepted' ? "bg-green-600 hover:bg-green-700" : "hover:text-green-600 hover:border-green-600"}
                            size="sm"
                            disabled={loading || isReleased}
                            onClick={() => handleSaveDecision('accepted')}
                        >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Accept
                        </Button>
                        <Button
                            variant={currentInternalDecision === 'rejected' ? "default" : "outline"}
                            className={currentInternalDecision === 'rejected' ? "bg-red-600 hover:bg-red-700" : "hover:text-red-600 hover:border-red-600"}
                            size="sm"
                            disabled={loading || isReleased}
                            onClick={() => handleSaveDecision('rejected')}
                        >
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject
                        </Button>
                        <Button
                            variant={currentInternalDecision === 'waitlisted' ? "default" : "outline"}
                            className={currentInternalDecision === 'waitlisted' ? "bg-orange-500 hover:bg-orange-600" : "hover:text-orange-500 hover:border-orange-500"}
                            size="sm"
                            disabled={loading || isReleased}
                            onClick={() => handleSaveDecision('waitlisted')}
                        >
                            <Clock className="mr-2 h-4 w-4" />
                            Waitlist
                        </Button>
                    </div>
                    {currentInternalDecision && (
                        <p className="text-xs text-muted-foreground mt-1">
                            Current Internal Mark: <span className={`font-bold uppercase ${decisionColor}`}>{currentInternalDecision}</span>
                        </p>
                    )}
                </div>

                <div className="border-t pt-4"></div>

                {/* Step 2: Release */}
                <div className="space-y-2">
                    <label className="text-sm font-medium block">Release Action</label>

                    {isReleased ? (
                        <div className="flex items-center gap-2 text-sm bg-green-50 text-green-700 p-3 rounded border border-green-200">
                            <CheckCircle className="h-4 w-4" />
                            Result released to applicant.
                        </div>
                    ) : (
                        <div>
                            <Button
                                className="w-full"
                                disabled={!currentInternalDecision || loading}
                                variant="default"
                                onClick={handleReleaseResult}
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Release Result to Applicant
                            </Button>
                            <p className="text-xs text-muted-foreground mt-2">
                                Applicant will see the result immediately after release.
                            </p>
                        </div>
                    )}
                </div>

            </CardContent>
        </Card>
    );
}
