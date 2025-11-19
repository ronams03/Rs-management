
import { User, ReturnItem } from '../types';

// Simulated delay to mimic API latency for a realistic feel
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const STORAGE_KEYS = {
  USERS: 'returnos_users',
  SESSION: 'returnos_session',
  ITEMS_PREFIX: 'returnos_items_',
  TRASH_PREFIX: 'returnos_trash_',
  DRAFT_PREFIX: 'returnos_draft_'
};

export const storageService = {
  // --- AUTHENTICATION ---

  async register(user: User & { password: string }): Promise<User> {
    await delay(800);
    const usersStr = localStorage.getItem(STORAGE_KEYS.USERS);
    const users = usersStr ? JSON.parse(usersStr) : {};
    
    // Check for duplicate email
    if (users[user.email]) {
      throw new Error('This email address is already registered.');
    }
    
    // Store user keyed by email
    users[user.email] = user;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    
    // Auto login after register
    const { password, ...safeUser } = user;
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(safeUser));
    return safeUser;
  },

  async login(email: string, password: string): Promise<User> {
    await delay(1000);
    const usersStr = localStorage.getItem(STORAGE_KEYS.USERS);
    const users = usersStr ? JSON.parse(usersStr) : {};
    
    const user = users[email];
    
    if (!user || user.password !== password) {
      throw new Error('Invalid email or password');
    }
    
    const { password: _, ...safeUser } = user;
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(safeUser));
    return safeUser;
  },

  async logout(): Promise<void> {
    await delay(300);
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  },

  getSession(): User | null {
    const session = localStorage.getItem(STORAGE_KEYS.SESSION);
    return session ? JSON.parse(session) : null;
  },

  // --- DATA MANAGEMENT ---

  async getItems(email: string): Promise<ReturnItem[]> {
    await delay(500);
    const key = `${STORAGE_KEYS.ITEMS_PREFIX}${email}`;
    const items = localStorage.getItem(key);
    return items ? JSON.parse(items) : [];
  },

  async saveItem(email: string, item: ReturnItem): Promise<ReturnItem> {
    await delay(600);
    const items = await this.getItems(email);
    const newItems = [item, ...items];
    localStorage.setItem(`${STORAGE_KEYS.ITEMS_PREFIX}${email}`, JSON.stringify(newItems));
    return item;
  },

  async updateItem(email: string, updatedItem: ReturnItem): Promise<void> {
    await delay(400);
    const items = await this.getItems(email);
    const newItems = items.map(i => i.id === updatedItem.id ? updatedItem : i);
    localStorage.setItem(`${STORAGE_KEYS.ITEMS_PREFIX}${email}`, JSON.stringify(newItems));
  },

  async deleteItem(email: string, id: string): Promise<void> {
    await delay(400);
    const items = await this.getItems(email);
    const newItems = items.filter(i => i.id !== id);
    localStorage.setItem(`${STORAGE_KEYS.ITEMS_PREFIX}${email}`, JSON.stringify(newItems));
  },

  // --- TRASH MANAGEMENT ---

  async getTrash(email: string): Promise<ReturnItem[]> {
    await delay(500);
    const key = `${STORAGE_KEYS.TRASH_PREFIX}${email}`;
    const items = localStorage.getItem(key);
    return items ? JSON.parse(items) : [];
  },

  async softDelete(email: string, id: string): Promise<void> {
    await delay(400);
    // Get item from main storage
    const items = await this.getItems(email);
    const itemToTrash = items.find(i => i.id === id);
    
    if (!itemToTrash) return;

    // Remove from main items
    const newItems = items.filter(i => i.id !== id);
    localStorage.setItem(`${STORAGE_KEYS.ITEMS_PREFIX}${email}`, JSON.stringify(newItems));

    // Add to trash
    const trash = await this.getTrash(email);
    const newTrash = [itemToTrash, ...trash];
    localStorage.setItem(`${STORAGE_KEYS.TRASH_PREFIX}${email}`, JSON.stringify(newTrash));
  },

  async restore(email: string, id: string): Promise<void> {
    await delay(400);
    // Get item from trash
    const trash = await this.getTrash(email);
    const itemToRestore = trash.find(i => i.id === id);
    
    if (!itemToRestore) return;

    // Remove from trash
    const newTrash = trash.filter(i => i.id !== id);
    localStorage.setItem(`${STORAGE_KEYS.TRASH_PREFIX}${email}`, JSON.stringify(newTrash));

    // Add back to main items
    const items = await this.getItems(email);
    const newItems = [itemToRestore, ...items];
    newItems.sort((a, b) => b.timestamp - a.timestamp);
    localStorage.setItem(`${STORAGE_KEYS.ITEMS_PREFIX}${email}`, JSON.stringify(newItems));
  },

  async restoreAll(email: string): Promise<void> {
    await delay(600);
    const trash = await this.getTrash(email);
    if (trash.length === 0) return;

    const items = await this.getItems(email);
    const newItems = [...items, ...trash];
    newItems.sort((a, b) => b.timestamp - a.timestamp);
    
    localStorage.setItem(`${STORAGE_KEYS.ITEMS_PREFIX}${email}`, JSON.stringify(newItems));
    localStorage.setItem(`${STORAGE_KEYS.TRASH_PREFIX}${email}`, JSON.stringify([]));
  },

  async permanentDelete(email: string, id: string): Promise<void> {
    await delay(400);
    const trash = await this.getTrash(email);
    const newTrash = trash.filter(i => i.id !== id);
    localStorage.setItem(`${STORAGE_KEYS.TRASH_PREFIX}${email}`, JSON.stringify(newTrash));
  },

  async emptyTrash(email: string): Promise<void> {
    await delay(500);
    localStorage.setItem(`${STORAGE_KEYS.TRASH_PREFIX}${email}`, JSON.stringify([]));
  },

  // --- DRAFTS ---
  
  getDraft(email: string): any | null {
    const draft = localStorage.getItem(`${STORAGE_KEYS.DRAFT_PREFIX}${email}`);
    return draft ? JSON.parse(draft) : null;
  },

  saveDraft(email: string, draftData: any): void {
    localStorage.setItem(`${STORAGE_KEYS.DRAFT_PREFIX}${email}`, JSON.stringify(draftData));
  },

  clearDraft(email: string): void {
    localStorage.removeItem(`${STORAGE_KEYS.DRAFT_PREFIX}${email}`);
  },

  // --- PORTABILITY (CROSS-DEVICE SYNC VIA FILE) ---

  exportData(email: string): string {
    const itemsKey = `${STORAGE_KEYS.ITEMS_PREFIX}${email}`;
    const trashKey = `${STORAGE_KEYS.TRASH_PREFIX}${email}`;
    
    const data = {
      email,
      exportDate: new Date().toISOString(),
      items: JSON.parse(localStorage.getItem(itemsKey) || '[]'),
      trash: JSON.parse(localStorage.getItem(trashKey) || '[]'),
      appVersion: '1.0.0',
      signature: 'ReturnOS-Secure-Backup'
    };
    
    return JSON.stringify(data, null, 2);
  },

  async importData(email: string, jsonString: string): Promise<{ success: boolean; count: number; message: string }> {
    try {
      const data = JSON.parse(jsonString);
      
      if (data.signature !== 'ReturnOS-Secure-Backup') {
        return { success: false, count: 0, message: 'Invalid backup file format.' };
      }

      // Import Items
      const currentItems = await this.getItems(email);
      const newItems = data.items as ReturnItem[];
      let addedCount = 0;

      const existingIds = new Set(currentItems.map(i => i.id));
      const mergedItems = [...currentItems];

      newItems.forEach(item => {
        if (!existingIds.has(item.id)) {
          mergedItems.push(item);
          addedCount++;
        }
      });
      mergedItems.sort((a, b) => b.timestamp - a.timestamp);
      localStorage.setItem(`${STORAGE_KEYS.ITEMS_PREFIX}${email}`, JSON.stringify(mergedItems));

      // Import Trash
      if (data.trash) {
        const currentTrash = await this.getTrash(email);
        const newTrash = data.trash as ReturnItem[];
        const trashIds = new Set(currentTrash.map(i => i.id));
        const mergedTrash = [...currentTrash];
        newTrash.forEach(item => {
          if (!trashIds.has(item.id)) mergedTrash.push(item);
        });
        localStorage.setItem(`${STORAGE_KEYS.TRASH_PREFIX}${email}`, JSON.stringify(mergedTrash));
      }
      
      return { success: true, count: addedCount, message: `Successfully restored ${addedCount} items.` };
    } catch (e) {
      console.error(e);
      return { success: false, count: 0, message: 'Failed to parse backup file.' };
    }
  }
};
