import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  role: 'student' | 'admin';
}

export interface Application {
  id: string;
  userId: string;
  status: 'draft' | 'submitted' | 'under_review' | 'decision_released' | 'enrolled' | 'rejected' | 'waitlisted';
  submittedAt?: string; // ISO Date
  lastUpdatedAt: string; // ISO Date
  // Form Data (simplified for now)
  personalInfo: {
    firstName: string;
    lastName: string;
    phone: string;
    wechatId?: string;
    school: string;
    grade: string;
  };
  academicInfo?: {
    subjectGroup?: string;
  };
  availability?: string[];
  essays: {
    question1: string;
    question2: string;
  };
}

// Helpers
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const getStored = <T>(key: string): T | null => {
  if (typeof window === 'undefined') return null;
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : null;
};

const store = (key: string, data: any) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
};

const USERS_KEY = 'jianshan_users';
const APPS_KEY = 'jianshan_apps';
const SESSION_KEY = 'jianshan_session';

export const mockApi = {
  async login(email: string): Promise<User> {
    await delay(800);
    const users = getStored<User[]>(USERS_KEY) || [];
    const user = users.find(u => u.email === email);

    if (!user) {
      // Requirement: If no account, must register. 
      // So login fails if user not found.
      throw new Error("User not found");
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  },

  async register(email: string, name?: string): Promise<User> {
    await delay(1000);
    const users = getStored<User[]>(USERS_KEY) || [];
    if (users.find(u => u.email === email)) {
      throw new Error("User already exists");
    }

    const newUser: User = {
      id: uuidv4(),
      email,
      name: name || email.split('@')[0],
      role: 'student',
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
    };

    users.push(newUser);
    store(USERS_KEY, users);
    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
    return newUser;
  },

  async logout(): Promise<void> {
    await delay(400);
    localStorage.removeItem(SESSION_KEY);
  },

  async getCurrentUser(): Promise<User | null> {
    await delay(300);
    const session = localStorage.getItem(SESSION_KEY);
    if (!session) return null;
    return JSON.parse(session);
  },

  async getMyApplication(userId: string): Promise<Application | null> {
    await delay(600);
    const apps = getStored<Application[]>(APPS_KEY) || [];
    return apps.find(a => a.userId === userId) || null;
  },

  async saveApplication(userId: string, data: Partial<Application>): Promise<Application> {
    await delay(800);
    const apps = getStored<Application[]>(APPS_KEY) || [];
    const index = apps.findIndex(a => a.userId === userId);

    let app: Application;
    const timestamp = new Date().toISOString();

    if (index === -1) {
      app = {
        id: uuidv4(),
        userId,
        status: 'draft',
        lastUpdatedAt: timestamp,
        personalInfo: { firstName: '', lastName: '', phone: '', school: '', grade: '' },
        essays: { question1: '', question2: '' },
        ...data
      } as Application;
      apps.push(app);
    } else {
      app = { ...apps[index], ...data, lastUpdatedAt: timestamp };
      apps[index] = app;
    }

    store(APPS_KEY, apps);
    return app;
  },

  async submitApplication(userId: string): Promise<Application> {
    await delay(1000);
    const apps = getStored<Application[]>(APPS_KEY) || [];
    const index = apps.findIndex(a => a.userId === userId);

    if (index === -1) throw new Error("Application not found");

    const app = apps[index];
    app.status = 'under_review'; // Direct to under_review mechanism
    app.submittedAt = new Date().toISOString();
    app.lastUpdatedAt = new Date().toISOString();

    apps[index] = app;
    store(APPS_KEY, apps);
    return app;
  },

  // Admin/Dev Tools
  async advanceApplicationStatus(userId: string): Promise<Application> {
    const apps = getStored<Application[]>(APPS_KEY) || [];
    const index = apps.findIndex(a => a.userId === userId);
    if (index === -1) throw new Error("App not found");

    const app = apps[index];
    if (app.status === 'under_review') app.status = 'decision_released';
    else if (app.status === 'decision_released') app.status = 'enrolled';

    apps[index] = app;
    store(APPS_KEY, apps);
    return app;
  },

  async rollbackApplicationStatus(userId: string): Promise<Application> {
    const apps = getStored<Application[]>(APPS_KEY) || [];
    const index = apps.findIndex(a => a.userId === userId);
    if (index === -1) throw new Error("App not found");

    const app = apps[index];
    if (app.status === 'enrolled') app.status = 'decision_released';
    else if (app.status === 'decision_released') app.status = 'under_review';

    apps[index] = app;
    store(APPS_KEY, apps);
    return app;
  },

  async resetApplication(userId: string): Promise<Application> {
    const apps = getStored<Application[]>(APPS_KEY) || [];
    const index = apps.findIndex(a => a.userId === userId);
    if (index === -1) throw new Error("App not found");

    // Resetting to draft and clearing status-related timestamps if needed
    const app = apps[index];
    app.status = 'draft';
    delete app.submittedAt;

    // Optional: Clear form data if requested? User said "清空重制", let's assume status reset is the main goal to get back to welcome. 
    // If they want to clear form, we could do:
    // app.personalInfo = { firstName: '', lastName: '', phone: '', school: '', grade: '' };
    // app.essays = { question1: '', question2: '' };
    // But usually 'reset' in this context means 'go back to start'. Keeping data might be helpful for testing re-submission.
    // Let's stick to status reset for now as it unblocks the flow.

    apps[index] = app;
    store(APPS_KEY, apps);
    return app;
  }
};
