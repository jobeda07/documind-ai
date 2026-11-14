export interface StatCardData {
  id: string;
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  iconName: 'file' | 'check' | 'chat' | 'storage';
  bgColor: string;
  iconColor: string;
}

export interface RecentDocumentItem {
  id: string;
  title: string;
  fileType: 'PDF' | 'DOCX' | 'TXT';
  uploadedAt: string;
  status: 'Processed' | 'Processing' | 'Failed';
}

export interface QuickActionItem {
  id: string;
  label: string;
  icon: 'upload' | 'chat' | 'search' | 'workspace';
  bgColor: string;
  iconColor: string;
  textColor: string;
}

export type NavItemKey =
  | 'dashboard'
  | 'documents'
  | 'chat'
  | 'workspaces'
  | 'users'
  | 'settings'
  | 'profile'
  | 'logout';
