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
                app.personalInfo.firstName.toLowerCase().includes(lowerQuery) ||
                app.personalInfo.lastName.toLowerCase().includes(lowerQuery) ||
                app.userId.toLowerCase().includes(lowerQuery) ||
                (app.personalInfo.school || "").toLowerCase().includes(lowerQuery)
            );
        }

        // Dropdown Filters
        if (subjectFilter !== "All Subjects") {
            result = result.filter(app => app.academicInfo?.subjectGroup === subjectFilter);
        }
        if (availabilityFilter !== "All Availabilities") {
            // Check if array includes the specific availability
            result = result.filter(app => (app.availability || []).includes(availabilityFilter));
            // Or strictly match if using single select logic? The UI HTML implies single select filter.
            // But data is array. "Flexible" is an option.
        }
        if (allocationFilter !== "All Allocations") {
            if (allocationFilter === "Unallocated") {
                result = result.filter(app => !app.adminData?.campAllocation);
            } else {
                result = result.filter(app => app.adminData?.campAllocation === allocationFilter);
            }
        }
        if (statusFilter !== "All Statuses") {
            // Map UI status filter to DB status
            // Pending -> draft, submitted, under_review? Usually "Pending" Review.
            if (statusFilter === "Pending") {
                result = result.filter(app => ['submitted', 'under_review'].includes(app.status));
            } else if (statusFilter === "Accepted") {
                result = result.filter(app => ['decision_released', 'enrolled'].includes(app.status)); // Assuming accepted means decision released (and internal decision accepted)
                // Better: filter by internal decision or public status?
                // HTML shows "Accepted" tag.
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
            `${app.personalInfo.firstName} ${app.personalInfo.lastName}`,
            "", // Email not currently in DBApplication top level, usually in auth/user obj. Can't easy get here without mapping.
            app.personalInfo.school || "",
            app.personalInfo.grade || "",
            app.academicInfo?.subjectGroup || "",
            (app.availability || []).join("; "),
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
        <div className="bg-slate-50 dark:bg-slate-900 min-h-screen flex flex-col font-sans text-slate-700 dark:text-slate-200">
            {/* Header */}
            <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 py-4 px-8 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-800 text-white p-1.5 rounded flex items-center justify-center">
                            <LayoutDashboard size={20} />
                        </div>
                        <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Admin Portal</h1>
                    </div>
                    <nav className="flex items-center gap-6 text-sm font-medium text-slate-500 dark:text-slate-400">
                        <a className="text-slate-800 dark:text-white font-semibold" href="#">Dashboard</a>
                        <div className="flex items-center gap-2 cursor-pointer hover:text-slate-800 dark:hover:text-white transition-colors">
                            <User size={18} />
                            <span>{user?.email}</span>
                        </div>
                        <button onClick={() => logout()} aria-label="Logout" className="hover:text-slate-800 dark:hover:text-white transition-colors">
                            <LogOut size={18} />
                        </button>
                    </nav>
                </div>
            </header>

            <main className="flex-grow p-8">
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
                                    value={availabilityFilter}
                                    onChange={setAvailabilityFilter}
                                    options={["All Availabilities", "June Session", "July Session", "August Session", "Flexible"]}
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
                                        {["Candidate", "Subject Group", "Camp Availability", "Camp Allocation", "Score", "Review", "Status", "Actions"].map((head) => (
                                            <th key={head} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider" scope="col">
                                                {head}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                                    {filteredApps.map((app) => (
                                        <tr key={app.userId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            {/* Candidate */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-sm">
                                                        {app.personalInfo.firstName[0]}{app.personalInfo.lastName[0]}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{app.personalInfo.firstName} {app.personalInfo.lastName}</div>
                                                        <div className="text-xs text-slate-500 dark:text-slate-400">ID: {app.userId.slice(0, 8)}...</div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Subject */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-700 dark:text-gray-300">{app.academicInfo?.subjectGroup || "-"}</span>
                                            </td>

                                            {/* Availability */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col text-sm text-gray-600 dark:text-gray-400">
                                                    {(app.availability && app.availability.length > 0) ? (
                                                        app.availability.map(s => (
                                                            <div key={s} className="flex items-center">
                                                                <Calendar size={14} className="mr-1 text-slate-400" />
                                                                {s}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <span className="text-slate-400 italic">Not set</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Allocation */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {app.adminData?.campAllocation ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                                                        {app.adminData.campAllocation}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                                                        Unallocated
                                                    </span>
                                                )}
                                            </td>

                                            {/* Score */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <Star size={16} className="text-yellow-400 mr-1 fill-yellow-400" />
                                                    <span className="text-sm font-bold text-gray-900 dark:text-white">{app.adminData?.reviewScore || "-"}</span>
                                                    <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">/ 5</span>
                                                </div>
                                            </td>

                                            {/* My Review Button */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Link href={`/admin/application?id=${app.userId}`} className="inline-flex items-center px-3 py-1 border border-blue-500 text-xs font-medium rounded-full text-blue-500 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                                                    Review Now
                                                </Link>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <StatusTag status={app.status} internal={app.adminData?.internalDecision || undefined} />
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <Link href={`/admin/application?id=${app.userId}`} className="text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-colors flex items-center justify-end gap-1">
                                                    <Eye size={18} />
                                                    <span>Details</span>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredApps.length === 0 && (
                                <div className="p-12 text-center text-slate-500">
                                    No applications found matching filters.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
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

function StatusTag({ status, internal }: { status: string, internal?: string }) {
    if (status === 'rejected' || internal === 'rejected') {
        return <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Rejected</span>
    }
    if (['decision_released', 'enrolled', 'accepted'].includes(status) || internal === 'accepted') {
        return <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Accepted</span>
    }
    if (status === 'waitlisted' || internal === 'waitlisted') {
        return <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Waitlist</span>
    }

    return <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pending</span>
}
