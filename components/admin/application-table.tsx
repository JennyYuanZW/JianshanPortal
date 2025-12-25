"use client"

import { useState } from "react";
import Link from "next/link";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { dbService, DBApplication } from "@/lib/db-service";
import { Search, Eye, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface AdminApplicationTableProps {
    applications: DBApplication[];
}

export function AdminApplicationTable({ applications }: AdminApplicationTableProps) {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [decisionFilter, setDecisionFilter] = useState("all");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [releasing, setReleasing] = useState(false);

    // Filter logic
    const safeApps = applications || [];
    const filteredApps = safeApps.filter(app => {
        const nameMatch = (
            (app.personalInfoSnapshot?.firstName || "") + " " + (app.personalInfoSnapshot?.lastName || "")
        ).toLowerCase().includes(search.toLowerCase());

        const statusMatch = statusFilter === "all" || app.status === statusFilter;

        let decisionMatch = true;
        if (decisionFilter === "all") {
            decisionMatch = true;
        } else if (decisionFilter === "undecided") {
            decisionMatch = !app.adminData?.internalDecision;
        } else {
            decisionMatch = app.adminData?.internalDecision === decisionFilter;
        }

        return nameMatch && statusMatch && decisionMatch;
        return nameMatch && statusMatch && decisionMatch;
    });

    // Valid for release: Status is 'under_review' AND has internal decision
    const isEligibleForRelease = (app: DBApplication) => {
        return app.status === 'under_review' && !!app.adminData?.internalDecision;
    };

    const eligibleApps = filteredApps.filter(isEligibleForRelease);
    const isAllSelected = eligibleApps.length > 0 && eligibleApps.every(app => selectedIds.has(app.userId));

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds(new Set());
        } else {
            const newSet = new Set<string>();
            // Only select eligible apps
            eligibleApps.forEach(app => newSet.add(app.userId));
            setSelectedIds(newSet);
        }
    };

    const toggleSelectRow = (userId: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(userId)) {
            newSet.delete(userId);
        } else {
            newSet.add(userId);
        }
        setSelectedIds(newSet);
    };

    const handleBatchRelease = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Are you sure you want to release decisions for ${selectedIds.size} applicants?`)) return;

        setReleasing(true);
        try {
            const results = await Promise.allSettled(
                Array.from(selectedIds).map(id => dbService.releaseResult(id))
            );

            // Check for errors
            const errors = results.filter(r => r.status === 'rejected');
            if (errors.length > 0) {
                console.error("Some releases failed:", errors);
                alert(`Released with ${errors.length} errors. Check console.`);
            } else {
                alert("Decisions released successfully!");
            }

            // Reset and reload
            setSelectedIds(new Set());
            window.location.reload();
        } catch (error) {
            console.error("Batch release failed completely:", error);
            alert("Batch release failed. Check console.");
        } finally {
            setReleasing(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full sm:w-auto items-center">
                    {selectedIds.size > 0 && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleBatchRelease}
                            disabled={releasing}
                        >
                            {releasing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Release Decisions ({selectedIds.size})
                        </Button>
                    )}
                    <div className="w-full sm:w-48">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="submitted">Submitted</SelectItem>
                                <SelectItem value="under_review">Under Review</SelectItem>
                                <SelectItem value="decision_released">Decision Released</SelectItem>
                                <SelectItem value="enrolled">Enrolled</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                                <SelectItem value="waitlisted">Waitlisted</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-full sm:w-48">
                        <Select value={decisionFilter} onValueChange={setDecisionFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Internal Decision" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Decisions</SelectItem>
                                <SelectItem value="undecided">Undecided</SelectItem>
                                <SelectItem value="accepted">Accepted</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                                <SelectItem value="waitlisted">Waitlisted</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">
                                <Checkbox
                                    checked={isAllSelected}
                                    onCheckedChange={toggleSelectAll}
                                    disabled={eligibleApps.length === 0}
                                    aria-label="Select all eligible"
                                />
                            </TableHead>
                            <TableHead>Applicant</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Internal Decision</TableHead>
                            <TableHead>Registered At</TableHead>
                            <TableHead>Last Updated</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredApps.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    No results found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredApps.map((app) => (
                                <TableRow key={app.userId}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedIds.has(app.userId)}
                                            onCheckedChange={() => toggleSelectRow(app.userId)}
                                            aria-label={`Select ${app.personalInfoSnapshot?.lastName}`}
                                            disabled={!isEligibleForRelease(app)}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {app.personalInfoSnapshot?.lastName} {app.personalInfoSnapshot?.firstName}
                                        <br />
                                        <span className="text-xs text-muted-foreground">{app.personalInfoSnapshot?.email || "No Email"}</span>
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={app.status} />
                                    </TableCell>
                                    <TableCell>
                                        {app.adminData?.internalDecision ? (
                                            <span className="capitalize font-medium text-sm">
                                                {app.adminData.internalDecision}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>{new Date(app.timeline?.registeredAt || "").toLocaleDateString()}</TableCell>
                                    <TableCell>{new Date(app.lastUpdatedAt || "").toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/admin/application?id=${app.userId}`}>
                                            <Button variant="ghost" size="sm">
                                                <Eye className="h-4 w-4 mr-2" />
                                                View
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="text-sm text-muted-foreground">
                Showing {filteredApps.length} applications
            </div>
        </div>
    );
}
