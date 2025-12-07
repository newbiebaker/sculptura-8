export interface Project {
  id: string;
  name: string;
  url: string;
  size: number;
  uploadedAt: Date;
  folderId?: string | null;
  isVisible: boolean;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: Date;
  isVisible: boolean;
  parentId?: string | null;
}

export type DragStatus = 'idle' | 'dragging' | 'error' | 'success';