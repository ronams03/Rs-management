
export interface ReturnItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  timestamp: number;
}

export interface User {
  fullName: string;
  email: string;
}

export type ViewState = 'dashboard' | 'storage' | 'settings' | 'about' | 'trash';