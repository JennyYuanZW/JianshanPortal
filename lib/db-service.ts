import { db } from '@/lib/firebase';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    query,
    where,
    orderBy,
    limit,
    arrayUnion,
    deleteField,
    Timestamp
} from "firebase/firestore";
import { Application } from '@/lib/mock-api'; // Re-use type or define new one? Let's use clean types here.

// Simplify Application type for DB to match requirement (Name + Status)
// But we still need to match the Shape expected by frontend UI to avoid massive refactor.
// So we will conform to the existing Application interface but only persist specific fields as requested.

export interface DBApplication {
    _id?: string;
    // Core Identity
    userId: string;
    status: 'draft' | 'submitted' | 'under_review' | 'decision_released' | 'enrolled' | 'rejected' | 'waitlisted';

    // Dynamic Form Data (Keyed by config IDs)
    formData: Record<string, any>;

    // Snapshot of key info for easier indexing/dashboard display (populated from formData on save)
    personalInfoSnapshot: {
        firstName: string;
        lastName: string;
        email?: string;
        school?: string; // from yearOfStudy or fieldOfStudy?
        grade?: string;
    };

    timeline: {
        registeredAt?: string;
        submittedAt?: string;
        decisionReleasedAt?: string;
        enrolledAt?: string;
    };
    lastUpdatedAt: string;

    // Admin specific data
    adminData?: {
        internalDecision?: 'accepted' | 'rejected' | 'waitlisted' | null;
        campAllocation?: string; // e.g. "Camp Alpha"
        reviewScore?: number; // 0-5
        reviewStatus?: 'reviewed' | 'pending';
        notes?: Array<{
            content: string;
            author: string;
            date: string;
        }>;
    };
}

const COLLECTION = 'applications';

export const dbService = {
    // Get user's application
    async getMyApplication(userId: string): Promise<DBApplication | null> {
        if (!db) return null;
        console.log("[db-service] getMyApplication calling with:", userId);

        const docRef = doc(db, COLLECTION, userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data() as DBApplication;
        }

        return null;
    },

    // Create a new draft application
    async createApplication(userId: string): Promise<DBApplication> {
        if (!db) throw new Error("DB not initialized");
        console.log("[db-service] creating application for user:", userId);

        const timestamp = new Date().toISOString();
        const initialData: Omit<DBApplication, '_id'> = {
            userId,
            status: 'draft',
            formData: {}, // Empty start
            personalInfoSnapshot: {
                firstName: '',
                lastName: ''
            },
            timeline: { registeredAt: timestamp },
            lastUpdatedAt: timestamp,
        };

        try {
            await setDoc(doc(db, COLLECTION, userId), initialData);
            console.log("[db-service] created application for:", userId);

            return {
                ...initialData
            };
        } catch (e: any) {
            console.error("[db-service] create application failed:", e);
            throw e;
        }
    },

    // Save Application Form Data
    async saveApplication(userId: string, formData: Record<string, any>) {
        if (!db) return;
        console.log("[db-service] saving application for:", userId);

        const timestamp = new Date().toISOString();

        // Construct Snapshot from formData
        // Config ID mapping: 'fullName' -> split? 
        // User provided: fullName. Let's just store fullName in snapshot if available, or try to split.
        // Actually, for sorting, firstName/lastName is useful. 
        // Let's assume the form provides 'fullName' as one string.
        // We will store it in snapshot as firstName (first word) and lastName (rest), or just add fullName to snapshot?
        // The DBApplication interface has firstName/lastName. Let's try to parse.

        const fullName = formData['fullName'] || '';
        const nameParts = fullName.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const updates: any = {
            lastUpdatedAt: timestamp,
            formData: formData,
            personalInfoSnapshot: {
                firstName: firstName,
                lastName: lastName,
                email: formData['email'],
                school: formData['school'] || formData['yearOfStudy'] // heuristics
            }
        };

        try {
            const docRef = doc(db, COLLECTION, userId);
            await updateDoc(docRef, updates);
            console.log("[db-service] save result success");
        } catch (e) {
            console.error("[db-service] save failed:", e);
            throw e;
        }
    },

    // Submit: Change status, add submittedAt
    async submitApplication(userId: string) {
        if (!db) return;
        console.log("[db-service] submitting application for:", userId);
        const timestamp = new Date().toISOString();

        try {
            const docRef = doc(db, COLLECTION, userId);
            await updateDoc(docRef, {
                status: 'submitted', // Or go directly to under_review if no validation step
                lastUpdatedAt: timestamp,
                'timeline.submittedAt': timestamp
            });
            console.log("[db-service] submit result success");
        } catch (e) {
            console.error("[db-service] submit failed:", e);
            throw e;
        }
    },

    // Dev Tools
    async advanceStatus(userId: string, currentStatus: string) {
        if (!db) return;
        let nextStatus = '';
        const updates: any = {};
        const timestamp = new Date().toISOString();

        if (currentStatus === 'submitted') nextStatus = 'under_review';
        else if (currentStatus === 'under_review') {
            nextStatus = 'decision_released';
            updates['timeline.decisionReleasedAt'] = timestamp;
        } else if (currentStatus === 'decision_released') {
            nextStatus = 'enrolled';
            updates['timeline.enrolledAt'] = timestamp;
        } else {
            return;
        }

        updates.status = nextStatus;
        updates.lastUpdatedAt = timestamp;

        await updateDoc(doc(db, COLLECTION, userId), updates);
    },

    async resetApplication(userId: string) {
        if (!db) return;
        const timestamp = new Date().toISOString();
        await updateDoc(doc(db, COLLECTION, userId), {
            status: 'draft',
            lastUpdatedAt: timestamp,
            'timeline.submittedAt': deleteField(),
            'timeline.decisionReleasedAt': deleteField(),
            'timeline.enrolledAt': deleteField()
        });
    },

    // Admin: Get all applications
    async getAllApplications(): Promise<DBApplication[]> {
        if (!db) return [];
        console.log("[db-service] getting all applications");

        try {
            const q = query(collection(db, COLLECTION), orderBy('lastUpdatedAt', 'desc'), limit(1000));
            const querySnapshot = await getDocs(q);

            const apps: DBApplication[] = [];
            querySnapshot.forEach((doc) => {
                apps.push(doc.data() as DBApplication);
            });
            return apps;
        } catch (e) {
            console.error("[db-service] get all failed", e);
            throw e;
        }
    },

    // Admin: Add Note
    async addApplicationNote(userId: string, note: string, author: string) {
        if (!db) return;
        const timestamp = new Date().toISOString();
        const newNote = {
            content: note,
            author,
            date: timestamp
        };

        const docRef = doc(db, COLLECTION, userId);
        await updateDoc(docRef, {
            'adminData.notes': arrayUnion(newNote),
            lastUpdatedAt: timestamp
        });
    },

    // Admin: Set Internal Decision
    async setInternalDecision(userId: string, decision: 'accepted' | 'rejected' | 'waitlisted') {
        if (!db) return;
        const timestamp = new Date().toISOString();
        const updates: any = {
            'adminData.internalDecision': decision,
            lastUpdatedAt: timestamp
        };
        const docRef = doc(db, COLLECTION, userId);
        await updateDoc(docRef, updates);
    },

    // Admin: Release Result
    async releaseResult(userId: string) {
        if (!db) return;
        const docRef = doc(db, COLLECTION, userId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return;

        const data = docSnap.data() as DBApplication;
        const decision = data.adminData?.internalDecision;

        if (!decision) {
            throw new Error("No internal decision marked to release.");
        }

        let publicStatus = '';
        const timestamp = new Date().toISOString();

        if (decision === 'accepted') publicStatus = 'decision_released';
        if (decision === 'rejected') publicStatus = 'rejected';
        if (decision === 'waitlisted') publicStatus = 'waitlisted';

        const updates: any = {
            status: publicStatus,
            lastUpdatedAt: timestamp,
            'timeline.decisionReleasedAt': timestamp
        };

        await updateDoc(docRef, updates);
    },

    // Admin: Save Comprehensive Review (Score, Decision, Comment)
    async updateAdminReview(userId: string, data: {
        reviewScore?: number;
        internalDecision?: 'accepted' | 'rejected' | 'waitlisted' | null;
        note?: string;
        author?: string;
    }) {
        if (!db) return;
        const timestamp = new Date().toISOString();
        const updates: any = {
            lastUpdatedAt: timestamp
        };

        if (data.reviewScore !== undefined) {
            updates['adminData.reviewScore'] = data.reviewScore;
        }
        if (data.internalDecision !== undefined) {
            updates['adminData.internalDecision'] = data.internalDecision;
        }

        if (data.note && data.author) {
            const newNote = {
                content: data.note,
                author: data.author,
                date: timestamp
            };
            updates['adminData.notes'] = arrayUnion(newNote);
        }

        const docRef = doc(db, COLLECTION, userId);
        await updateDoc(docRef, updates);
    }
};
