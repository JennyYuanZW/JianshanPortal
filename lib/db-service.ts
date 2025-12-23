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
    _openid?: string;
    userId: string;
    status: 'draft' | 'submitted' | 'under_review' | 'decision_released' | 'enrolled' | 'rejected' | 'waitlisted';
    personalInfo: {
        firstName: string;
        lastName: string;
        phone?: string;
        wechatId?: string;
        school?: string;
        grade?: string;
    };
    timeline: {
        registeredAt?: string;
        submittedAt?: string;
        decisionReleasedAt?: string;
        enrolledAt?: string;
    };
    lastUpdatedAt: string;
    // Keep other fields optional/empty to satisfy frontend type if we cast it
    essays?: {
        question1: string;
        question2: string;
    };
    // Admin specific data
    adminData?: {
        internalDecision?: 'accepted' | 'rejected' | 'waitlisted' | null;
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
    async getMyApplication(userId: string): Promise<Application | null> {
        if (!db) return null;
        console.log("[db-service] getMyApplication calling with:", userId);

        // We assume userId is the doc ID based on createApplication logic
        const docRef = doc(db, COLLECTION, userId);
        const docSnap = await getDoc(docRef);

        console.log("[db-service] getMyApplication res exists:", docSnap.exists());

        if (docSnap.exists()) {
            const data = docSnap.data() as DBApplication;
            // Return full structure expected by UI, filling defaults for missing fields
            return {
                id: data.userId, // Using userId as ID
                userId: data.userId,
                status: data.status,
                submittedAt: data.timeline?.submittedAt,
                lastUpdatedAt: data.lastUpdatedAt,
                personalInfo: {
                    firstName: data.personalInfo?.firstName || '',
                    lastName: data.personalInfo?.lastName || '',
                    phone: data.personalInfo?.phone || '',
                    wechatId: data.personalInfo?.wechatId || '',
                    school: data.personalInfo?.school || '',
                    grade: data.personalInfo?.grade || ''
                },
                essays: {
                    question1: data.essays?.question1 || '',
                    question2: data.essays?.question2 || ''
                }
            } as Application;
        }

        return null;
    },

    // Create a new draft application
    async createApplication(userId: string): Promise<Application> {
        if (!db) throw new Error("DB not initialized");
        console.log("[db-service] creating application for user:", userId);

        const timestamp = new Date().toISOString();
        const initialData: Omit<DBApplication, '_id'> = {
            userId,
            status: 'draft',
            personalInfo: {
                firstName: '',
                lastName: '',
                phone: '',
                wechatId: '',
                school: '',
                grade: ''
            },
            timeline: { registeredAt: timestamp },
            lastUpdatedAt: timestamp,
            essays: { question1: '', question2: '' }
        };

        try {
            // Use setDoc with doc(db, COLLECTION, userId)
            await setDoc(doc(db, COLLECTION, userId), initialData);
            console.log("[db-service] created application for:", userId);

            // Return structured data
            return {
                id: userId,
                ...initialData as any
            };
        } catch (e: any) {
            console.error("[db-service] create application failed:", e);
            if (e.code === 'permission-denied') {
                throw new Error(`Firebase Permission Denied: Unable to create application record.`);
            }
            throw e;
        }
    },

    // Save only allowed fields (First/Last Name) + LastUpdated
    async saveApplication(userId: string, data: Partial<Application>) {
        if (!db) return;
        console.log("[db-service] saving application for:", userId, data);

        const timestamp = new Date().toISOString();

        // Extract only what we want to save
        const updates: any = {
            lastUpdatedAt: timestamp,
            'personalInfo.firstName': data.personalInfo?.firstName,
            'personalInfo.lastName': data.personalInfo?.lastName,
            personalInfo: data.personalInfo,
            essays: data.essays
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
    // Submit: Change status, add submittedAt
    async submitApplication(userId: string) {
        if (!db) return;
        console.log("[db-service] submitting application for:", userId);
        const timestamp = new Date().toISOString();

        try {
            // Change to updateDoc
            const docRef = doc(db, COLLECTION, userId);
            await updateDoc(docRef, {
                status: 'under_review',
                lastUpdatedAt: timestamp,
                'timeline.submittedAt': timestamp
            });
            console.log("[db-service] submit result success");
        } catch (e) {
            console.error("[db-service] submit failed:", e);
            throw e;
        }
    },

    // Dev Tool: Advance Status
    // Dev Tool: Advance Status
    async advanceStatus(userId: string, currentStatus: string) {
        if (!db) return;
        let nextStatus = '';
        const updates: any = {};
        const timestamp = new Date().toISOString();

        if (currentStatus === 'under_review') {
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

    // Dev Tool: Reset
    // Dev Tool: Reset
    async resetApplication(userId: string) {
        if (!db) return;
        const timestamp = new Date().toISOString();

        // Reset to draft, specific timeline fields

        await updateDoc(doc(db, COLLECTION, userId), {
            status: 'draft',
            lastUpdatedAt: timestamp,
            'timeline.submittedAt': deleteField(),
            'timeline.decisionReleasedAt': deleteField(),
            'timeline.enrolledAt': deleteField()
        });
    }, // Added comma here

    // Admin: Get all applications
    async getAllApplications(): Promise<DBApplication[]> {
        if (!db) return [];
        console.log("[db-service] getting all applications");

        try {
            // Retrieve all records. 
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

    // Admin: Set Internal Decision (does not notify user)
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

    // Admin: Release Result (updates public status)
    async releaseResult(userId: string) {
        if (!db) return;

        // Fetch current doc to get internal decision
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

        // Map decision to status
        if (decision === 'accepted') publicStatus = 'decision_released'; // Accepted -> decision released (Acceptance Letter)
        if (decision === 'rejected') publicStatus = 'rejected';
        if (decision === 'waitlisted') publicStatus = 'waitlisted';

        const updates: any = {
            status: publicStatus,
            lastUpdatedAt: timestamp,
            'timeline.decisionReleasedAt': timestamp
        };

        await updateDoc(docRef, updates);
    }
};
