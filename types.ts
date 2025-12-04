export type Priority = 'low' | 'medium' | 'high';

export interface Reminder {
  id: string;
  title: string;
  notes?: string;
  dueDateTime: string; // ISO string
  isCompleted: boolean;
  priority: Priority;
  labels: string[];
  color?: string; // Hex code
  createdAt: number;
  wasNotified?: boolean;
}

export type ViewState = 'today' | 'calendar' | 'completed';

export interface ReminderFormData {
  title: string;
  notes: string;
  dueDateTime: string;
  priority: Priority;
  labels: string; // comma separated for form
  color: string;
}