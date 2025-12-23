import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
    status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
    let color = "bg-gray-500 hover:bg-gray-600";
    let label = status;

    switch (status) {
        case 'draft':
            color = "bg-gray-400 hover:bg-gray-500";
            label = "Draft";
            break;
        case 'submitted':
            color = "bg-blue-500 hover:bg-blue-600";
            label = "Submitted";
            break;
        case 'under_review':
            color = "bg-yellow-500 hover:bg-yellow-600";
            label = "Under Review";
            break;
        case 'decision_released':
            color = "bg-purple-500 hover:bg-purple-600";
            label = "Decision Released";
            break;
        case 'enrolled':
            color = "bg-green-500 hover:bg-green-600";
            label = "Enrolled";
            break;
        case 'rejected':
            color = "bg-red-500 hover:bg-red-600";
            label = "Rejected";
            break;
        case 'waitlisted':
            color = "bg-orange-500 hover:bg-orange-600";
            label = "Waitlisted";
            break;
    }

    return (
        <Badge className={`${color} text-white border-0`}>
            {label}
        </Badge>
    );
}
