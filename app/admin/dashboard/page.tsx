"use client"

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { dbService, DBApplication } from "@/lib/db-service";
import Link from "next/link";
import {
    LayoutDashboard, User, LogOut, Download, Search,
    Calendar, Star, Eye
} from "lucide-react";

export default function AdminDashboardPage() {
    const { user, loading, isAdmin, logout } = useAuth();
    const router = useRouter();
    const [applications, setApplications] = useState<DBApplication[]>([]);
    const [filteredApps, setFilteredApps] = useState<DBApplication[]>([]);
    const [fetching, setFetching] = useState(true);

    // Filter States
    const [searchQuery, setSearchQuery] = useState("");
    const [subjectFilter, setSubjectFilter] = useState("All Subjects");
    const [availabilityFilter, setAvailabilityFilter] = useState("All Availabilities");
    const [allocationFilter, setAllocationFilter] = useState("All Allocations");
    const [statusFilter, setStatusFilter] = useState("All Statuses");

    useEffect(() => {
        if (!loading && !isAdmin) {
            router.push('/');
        }
    }, [loading, isAdmin, router]);

    useEffect(() => {
        async function fetchApps() {
            if (isAdmin) {
                try {
                    const data = await dbService.getAllApplications();
                    setApplications(data);
                    setFilteredApps(data);
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

    // Filtering Logic
    useEffect(() => {
        let result = applications;

        // Search
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter(app =>
                (app.personalInfoSnapshot?.firstName || "").toLowerCase().includes(lowerQuery) ||
                (app.personalInfoSnapshot?.lastName || "").toLowerCase().includes(lowerQuery) ||
                app.userId.toLowerCase().includes(lowerQuery) ||
                (app.personalInfoSnapshot?.school || "").toLowerCase().includes(lowerQuery)
            );
        }

        // Dropdown Filters
        if (subjectFilter !== "All Subjects") {
            result = result.filter(app => app.formData?.subjectGroup === subjectFilter);
        }
        if (availabilityFilter !== "All Availabilities") {
            // Check if array includes the specific availability (stored in formData)
            result = result.filter(app => {
                const avail = app.formData?.availability;
                return Array.isArray(avail) && avail.includes(availabilityFilter);
            });
        }
        if (allocationFilter !== "All Allocations") {
            if (allocationFilter === "Unallocated") {
                result = result.filter(app => !app.adminData?.campAllocation);
            } else {
                result = result.filter(app => app.adminData?.campAllocation === allocationFilter);
            }
        }
        if (statusFilter !== "All Statuses") {
            if (statusFilter === "Pending") {
                result = result.filter(app => ['submitted', 'under_review'].includes(app.status));
            } else if (statusFilter === "Accepted") {
                result = result.filter(app => ['decision_released', 'enrolled', 'accepted'].includes(app.status));
            } else if (statusFilter === "Rejected") {
                result = result.filter(app => app.status === 'rejected');
            }
        }

        setFilteredApps(result);
    }, [applications, searchQuery, subjectFilter, availabilityFilter, allocationFilter, statusFilter]);

    const handleExportCSV = () => {
        const headers = ["ID", "Name", "Email", "School", "Grade", "Subject", "Availability", "Allocation", "Status"];
        const rows = filteredApps.map(app => [
            app.userId,
            `${app.personalInfoSnapshot?.firstName || ""} ${app.personalInfoSnapshot?.lastName || ""}`,
            app.personalInfoSnapshot?.email || "",
            app.personalInfoSnapshot?.school || "",
            app.personalInfoSnapshot?.grade || "",
            app.formData?.subjectGroup || "",
            (app.formData?.availability || []).join("; "),
            app.adminData?.campAllocation || "",
            app.status
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "candidates_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading || fetching) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div></div>;
    }

    if (!isAdmin) return null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-100">

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="max-w-[90rem] mx-auto space-y-6">
                    {/* Page Title */}
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Candidate Comparison Dashboard</h2>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">Compare candidates, manage camp allocations, and finalize decisions.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleExportCSV}
                                className="inline-flex items-center px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                                <Download size={16} className="mr-2" />
                                Export CSV
                            </button>
                        </div>
                    </div>

                    {/* Filters Toolbar */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
                        <div className="flex flex-col xl:flex-row gap-4 justify-between">
                            {/* Search */}
                            <div className="relative flex-grow max-w-md">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search size={18} className="text-slate-400" />
                                </div>
                                <input
                                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md leading-5 bg-slate-50 dark:bg-slate-900 placeholder-slate-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out text-gray-900 dark:text-white"
                                    placeholder="Search by name, email, or ID..."
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {/* Dropdowns */}
                            <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                                <FilterSelect
                                    value={subjectFilter}
                                    onChange={setSubjectFilter}
                                    options={["All Subjects", "Computer Science", "Mathematics", "Physics", "Biology", "Chemistry", "Economics"]}
                                />
                                <FilterSelect
                                    value={allocationFilter}
                                    onChange={setAllocationFilter}
                                    options={["All Allocations", "Unallocated", "Camp Alpha", "Camp Beta", "Camp Gamma"]}
                                />
                                <FilterSelect
                                    value={statusFilter}
                                    onChange={setStatusFilter}
                                    options={["All Statuses", "Accepted", "Rejected", "Pending"]}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Data Table */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                <thead className="bg-gray-50 dark:bg-gray-800/50">
                                    <tr>
                                        {["Candidate", "Stage", "Status", "Avg Score", "Subject Group", "Camp Availability", "Camp Allocation", "My Review", "Actions"].map((head) => (
                                            <th key={head} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider" scope="col">
                                                {head}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                                    {filteredApps.map((app) => {
                                        // Helper: Avg Score
                                        const reviews = app.adminData?.reviews || [];
                                        const avgScore = reviews.length > 0
                                            ? (reviews.reduce((sum, r) => sum + (r.score || 0), 0) / reviews.length).toFixed(1)
                                            : "-";

                                        // Helper: Availability
                                        const prefs = app.formData?.programPreferences || {};
                                        const availString = Object.entries(prefs)
                                            .filter(([k, v]) => k !== 'label' && k !== 'options' && (v === 'First Preference' || v === 'Second Preference'))
                                            .map(([city, pref]) => `${city} (${pref === 'First Preference' ? '1st' : '2nd'})`)
                                            .join(', ') || 'None';

                                        return (
                                            <tr key={app.userId} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                                {/* 1. Candidate Name */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                                                            {app.personalInfoSnapshot?.firstName?.[0] || "?"}
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-slate-900 dark:text-white">
                                                                {app.personalInfoSnapshot?.firstName} {app.personalInfoSnapshot?.lastName}
                                                            </div>
                                                            <div className="text-sm text-slate-500 dark:text-slate-400">
                                                                {app.userId}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* 2. Stage */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${app.adminData?.stage === 'second_round'
                                                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                        }`}>
                                                        {app.adminData?.stage === 'second_round' ? 'Second Round' : 'First Round'}
                                                    </span>
                                                </td>

                                                {/* 3. Status */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {(() => {
                                                        const status = app.adminData?.internalDecision || 'undecided';
                                                        const colors = {
                                                            accepted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                                                            rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
                                                            waitlisted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                                                            undecided: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                                        };
                                                        return (
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${colors[status] || colors.undecided}`}>
                                                                {status}
                                                            </span>
                                                        );
                                                    })()}
                                                </td>

                                                {/* 4. Avg Score */}
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
                                                    <div className="font-bold">{avgScore}</div>
                                                </td>

                                                {/* 5. Subject Group (NEW) */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm text-slate-700 dark:text-slate-300">
                                                        {app.formData?.subjectGroup || "Unspecified"}
                                                    </span>
                                                </td>

                                                {/* 6. Camp Availability */}
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                                    <div className="truncate max-w-[150px]" title={availString}>
                                                        {availString}
                                                    </div>
                                                </td>

                                                {/* 7. Camp Allocation */}
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                                    {app.adminData?.campAllocation || '-'}
                                                </td>

                                                {/* 8. My Review */}
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <Link
                                                        href={`/admin/application?id=${app.userId}`}
                                                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold"
                                                    >
                                                        Review Now
                                                    </Link>
                                                </td>

                                                {/* 9. Actions (Details -> Review Summary) */}
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <Link
                                                        href={`/admin/review-summary?id=${app.userId}`}
                                                        className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                                                    >
                                                        Details
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {filteredApps.length === 0 && (
                                <div className="p-12 text-center text-slate-500">
                                    No applications found matching filters.
                                </div>
                            )}
                        </div>
                    </div >
                </div >
            </main >
        </div >
    );
}

function FilterSelect({ value, onChange, options }: { value: string, onChange: (val: string) => void, options: string[] }) {
    return (
        <div className="relative">
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="block w-40 pl-3 pr-8 py-2 text-base border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-slate-50 dark:bg-slate-900 text-gray-900 dark:text-white whitespace-nowrap appearance-none cursor-pointer"
            >
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            {/* Custom Arrow could go here but default browser arrow is OK for MVP */}
        </div>
    )
}

