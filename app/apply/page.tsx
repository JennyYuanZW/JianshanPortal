"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { dbService, DBApplication } from "@/lib/db-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ArrowRight, Save, CheckCircle2 } from "lucide-react";
import { APPLICATION_CONFIG } from "@/lib/config";
// import { cn } from "@/lib/utils"; // Not used currently

export default function ApplyPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [app, setApp] = useState<DBApplication | null>(null);

    // Initial Load
    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [authLoading, user, router]);

    useEffect(() => {
        const fetchApp = async () => {
            if (!user) return;
            const uid = user.uid;
            console.log("Fetching application for user:", uid);

            try {
                let myApp = await dbService.getMyApplication(uid);
                if (!myApp) {
                    console.log("No application found. Creating new draft for:", uid);
                    myApp = await dbService.createApplication(uid);
                }
                setApp(myApp);
            } catch (err: any) {
                console.error("Error fetching/creating application:", err);
                if (err.message?.includes('Permission Denied') || err.code === 'permission-denied') {
                    alert("Database Permission Denied. Please contact administrator.");
                } else {
                    alert("Failed to load application. " + (err.message || "Unknown error"));
                }
            } finally {
                setLoading(false);
            }
        };
        fetchApp();
    }, [user]);

    // Update Form Data Helper
    const handleFieldChange = (fieldId: string, value: any) => {
        if (!app) return;
        setApp(prev => {
            if (!prev) return null;
            return {
                ...prev,
                formData: {
                    ...prev.formData,
                    [fieldId]: value
                }
            };
        });
    };

    const handleSave = async () => {
        if (!user || !app) return;
        setSaving(true);
        try {
            await dbService.saveApplication(user.uid, app.formData);
            console.log("Draft saved successfully");
            // Optional: Show toast
        } catch (err) {
            console.error("Failed to save draft:", err);
            alert("Failed to save draft.");
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !app) return;

        // Basic Validation could go here based on config (check required fields)
        const missing = [];
        // Example: Check essays
        for (const q of APPLICATION_CONFIG.essays) {
            if (!app.formData[q.id]) missing.push(q.label);
        }
        if (missing.length > 0) {
            const confirm = window.confirm(`You have empty fields: ${missing.join(', ')}. Submit anyway? (Dev Mode: normally would block)`);
            if (!confirm) return;
        }

        setSaving(true);
        try {
            await dbService.saveApplication(user.uid, app.formData);
            await dbService.submitApplication(user.uid);
            alert("Application submitted successfully!");
            router.push("/dashboard"); // Or stay and show success state
        } catch (err) {
            console.error("Failed to submit:", err);
            alert("Failed to submit application.");
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || loading || !app) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const isReadonly = app.status !== 'draft';
    const formData = app.formData || {};

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header Section */}
                <div>
                    <nav className="flex items-center text-sm font-medium mb-4">
                        <span className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer" onClick={() => router.push('/dashboard')}>Dashboard</span>
                        <span className="mx-2 text-slate-300">/</span>
                        <span className="text-blue-600 dark:text-blue-400 font-semibold">Application Form</span>
                    </nav>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Student Application</h1>
                    <p className="mt-2 text-lg text-slate-600 dark:text-slate-300">Please complete all sections below.</p>

                    {isReadonly && (
                        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 p-4 rounded-lg flex items-center gap-3 mt-4">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="font-medium">Application Submitted. Status: <span className="uppercase">{app.status.replace('_', ' ')}</span></span>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* 1. Essays / Open-Ended Questions */}
                    <div className="bg-white dark:bg-slate-800 shadow rounded-xl p-6 md:p-8 space-y-6">
                        <div className="border-b border-slate-100 dark:border-slate-700 pb-4 mb-4">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">General Information & Essays</h2>
                        </div>
                        <div className="grid grid-cols-1 gap-6">
                            {APPLICATION_CONFIG.essays.map((field) => (
                                <div key={field.id} className="space-y-2">
                                    <Label htmlFor={field.id} className="text-base font-semibold text-slate-800 dark:text-slate-200">
                                        {field.label}
                                    </Label>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{field.prompt}</p>

                                    {/* Heuristic: If placeholder implies long text or field ID implies "outline"/"interest", use Textarea */}
                                    {(field.id.toLowerCase().includes('outline') || field.id.toLowerCase().includes('interest') || field.id.toLowerCase().includes('comments') || field.id.toLowerCase().includes('session')) ? (
                                        <Textarea
                                            id={field.id}
                                            placeholder={field.placeholder}
                                            value={formData[field.id] || ''}
                                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                            disabled={isReadonly}
                                            className="min-h-[120px]"
                                        />
                                    ) : (
                                        <Input
                                            id={field.id}
                                            placeholder={field.placeholder}
                                            value={formData[field.id] || ''}
                                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                            disabled={isReadonly}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 2. Selections */}
                    <div className="bg-white dark:bg-slate-800 shadow rounded-xl p-6 md:p-8 space-y-6">
                        <div className="border-b border-slate-100 dark:border-slate-700 pb-4 mb-4">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Academic Details</h2>
                            {/* Multiple Choice Selections */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {APPLICATION_CONFIG.selections.map((field) => (
                                    <div key={field.id} className="space-y-2">
                                        <Label htmlFor={field.id} className="text-slate-700 dark:text-slate-200">
                                            {field.label}
                                        </Label>
                                        <Select
                                            value={formData[field.id] || ""}
                                            onValueChange={(val) => handleFieldChange(field.id, val)}
                                            disabled={isReadonly}
                                        >
                                            <SelectTrigger id={field.id} className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                                <SelectValue placeholder="Select an option" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {field.options.map((opt) => (
                                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ))}
                            </div>


                        </div>
                    </div>

                    {/* 3. Program Preferences (Grid) */}
                    <div className="bg-white dark:bg-slate-800 shadow rounded-xl p-6 md:p-8 space-y-6">
                        <div className="border-b border-slate-100 dark:border-slate-700 pb-4 mb-4">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Program Preferences</h2>
                        </div>
                        <div className="space-y-4">
                            <Label className="text-base">{APPLICATION_CONFIG.programPreferences.label}</Label>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                    <thead>
                                        <tr>
                                            <th className="px-4 py-2 text-left text-sm font-medium text-slate-500">Option</th>
                                            {APPLICATION_CONFIG.programPreferences.options.map(opt => (
                                                <th key={opt} className="px-4 py-2 text-center text-sm font-medium text-slate-500">{opt}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                        {APPLICATION_CONFIG.programPreferences.rows.map(row => (
                                            <tr key={row.id}>
                                                <td className="px-4 py-4 text-sm font-medium text-slate-900 dark:text-white">{row.label}</td>
                                                {APPLICATION_CONFIG.programPreferences.options.map(opt => {
                                                    const fieldKey = `pref_${row.id}`;
                                                    const isChecked = formData[fieldKey] === opt;
                                                    return (
                                                        <td key={opt} className="px-4 py-4 text-center">
                                                            <div className="flex justify-center">
                                                                <input
                                                                    type="radio"
                                                                    name={fieldKey}
                                                                    checked={isChecked}
                                                                    onChange={() => handleFieldChange(fieldKey, opt)}
                                                                    disabled={isReadonly}
                                                                    className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                                                                />
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* 4. Uploads */}
                    <div className="bg-white dark:bg-slate-800 shadow rounded-xl p-6 md:p-8 space-y-6">
                        <div className="border-b border-slate-100 dark:border-slate-700 pb-4 mb-4">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Document Uploads</h2>
                        </div>
                        <div className="grid grid-cols-1 gap-6">
                            {APPLICATION_CONFIG.uploads.map((field) => (
                                <div key={field.id} className="space-y-2">
                                    <Label htmlFor={field.id}>{field.label}</Label>
                                    <p className="text-sm text-slate-500 mb-2">{field.prompt}</p>
                                    {/* Mock File Input - actually just stores text/link for now as no storage backend is ready */}
                                    <Input
                                        id={field.id}
                                        placeholder="Paste link to document (Google Drive, Dropbox, etc.)"
                                        value={formData[field.id] || ''}
                                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                        disabled={isReadonly}
                                    />
                                    {/* 
                                     <Input type="file" disabled={true} />
                                     <p className="text-xs text-amber-600">File upload is currently disabled. Please provide a link above.</p>
                                    */}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-4 pt-6">
                        {!isReadonly && (
                            <>
                                <Button type="button" variant="outline" onClick={handleSave} disabled={saving}>
                                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save Draft
                                </Button>
                                <Button type="submit" disabled={saving}>
                                    Submit Application
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </>
                        )}
                        {isReadonly && (
                            <Button type="button" variant="outline" onClick={() => router.push('/dashboard')}>
                                Back to Dashboard
                            </Button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
