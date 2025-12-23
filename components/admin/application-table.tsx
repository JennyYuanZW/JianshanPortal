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
import { DBApplication } from "@/lib/db-service";
import { Search, Eye } from "lucide-react";

interface AdminApplicationTableProps {
    applications: DBApplication[];
}

export function AdminApplicationTable({ applications }: AdminApplicationTableProps) {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    // Filter logic
    const safeApps = applications || [];
    const filteredApps = safeApps.filter(app => {
        const nameMatch = (
            (app.personalInfo?.firstName || "") + " " + (app.personalInfo?.lastName || "")
        ).toLowerCase().includes(search.toLowerCase());

        const statusMatch = statusFilter === "all" || app.status === statusFilter;

        return nameMatch && statusMatch;
    });

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
            </div>

            {/* Table */}
            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Applicant</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Registered At</TableHead>
                            <TableHead>Last Updated</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredApps.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No results found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredApps.map((app) => (
                                <TableRow key={app.userId}>
                                    <TableCell className="font-medium">
                                        {app.personalInfo?.lastName} {app.personalInfo?.firstName}
                                        <br />
                                        <span className="text-xs text-muted-foreground">{app.personalInfo?.phone || "No Phone"}</span>
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={app.status} />
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
