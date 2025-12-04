import { Reminder } from '../types';

const STORAGE_KEY = 'barbie_remind_data_v1';

export const loadReminders = (): Reminder[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to load reminders", error);
    return [];
  }
};

export const saveReminders = (reminders: Reminder[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
  } catch (error) {
    console.error("Failed to save reminders", error);
  }
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};
