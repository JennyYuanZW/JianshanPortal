"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dbService } from "@/lib/db-service";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";

interface NotesSectionProps {
    applicationId: string;
    notes: Array<{
        content: string;
        author: string;
        date: string;
    }>;
    onNoteAdded: () => void; // Callback to refresh data
}

export function NotesSection({ applicationId, notes, onNoteAdded }: NotesSectionProps) {
    const { user } = useAuth();
    const [newNote, setNewNote] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleAddNote = async () => {
        if (!newNote.trim()) return;
        setSubmitting(true);
        try {
            const authorName = user?.displayName || user?.email || "Admin";
            await dbService.addApplicationNote(applicationId, newNote, authorName);
            setNewNote("");
            onNoteAdded();
        } catch (e) {
            console.error("Failed to add note", e);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Internal Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* List of Notes */}
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                    {(!notes || notes.length === 0) && (
                        <p className="text-sm text-muted-foreground italic">No notes yet.</p>
                    )}
                    {notes && notes.map((note, idx) => (
                        <div key={idx} className="bg-muted/50 p-3 rounded-md text-sm">
                            <p className="whitespace-pre-wrap">{note.content}</p>
                            <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                                <span>{note.author}</span>
                                <span>{new Date(note.date).toLocaleString()}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Add Note Input */}
                <div className="space-y-2">
                    <Textarea
                        placeholder="Add a private comment..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="min-h-[80px]"
                    />
                    <div className="flex justify-end">
                        <Button
                            size="sm"
                            onClick={handleAddNote}
                            disabled={submitting || !newNote.trim()}
                        >
                            {submitting && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                            Add Note
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
