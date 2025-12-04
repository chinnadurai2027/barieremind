import React, { useState, useEffect } from 'react';
import { Reminder, ReminderFormData, Priority } from '../types';
import { Button } from './ui/Button';
import { Calendar, Clock, Tag, Flag, Type, Palette } from 'lucide-react';

interface ReminderEditorProps {
  initialData?: Reminder;
  onSave: (data: ReminderFormData) => void;
  onCancel: () => void;
}

export const ReminderEditor: React.FC<ReminderEditorProps> = ({ initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState<ReminderFormData>({
    title: '',
    notes: '',
    dueDateTime: new Date().toISOString().slice(0, 16),
    priority: 'medium',
    labels: '',
    color: '#FF69B4',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        notes: initialData.notes || '',
        dueDateTime: initialData.dueDateTime.slice(0, 16),
        priority: initialData.priority,
        labels: initialData.labels.join(', '),
        color: initialData.color || '#FF69B4',
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title Input */}
      <div className="relative">
        <label className="block text-xs font-bold text-barbie-muted uppercase tracking-wider mb-1">
          What needs doing?
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Type size={18} className="text-barbie-pink" />
          </div>
          <input
            type="text"
            required
            autoFocus
            className="block w-full pl-10 pr-3 py-3 border-2 border-barbie-soft rounded-xl leading-5 bg-white placeholder-barbie-muted/50 focus:outline-none focus:ring-0 focus:border-barbie-deep transition-colors text-barbie-neutral font-medium"
            placeholder="e.g. Buy sparkles for the party"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div>
            <label className="block text-xs font-bold text-barbie-muted uppercase tracking-wider mb-1">
              When?
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                required
                className="block w-full pl-3 pr-3 py-3 border-2 border-barbie-soft rounded-xl leading-5 bg-white focus:outline-none focus:border-barbie-deep text-barbie-neutral"
                value={formData.dueDateTime}
                onChange={(e) => setFormData({ ...formData, dueDateTime: e.target.value })}
              />
            </div>
         </div>
         
         {/* Priority */}
         <div>
            <label className="block text-xs font-bold text-barbie-muted uppercase tracking-wider mb-1">
              Priority
            </label>
            <div className="flex bg-barbie-cream rounded-xl p-1 border-2 border-barbie-soft">
              {(['low', 'medium', 'high'] as Priority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority: p })}
                  className={`flex-1 capitalize text-sm py-2 rounded-lg font-medium transition-all ${
                    formData.priority === p 
                    ? 'bg-white text-barbie-deep shadow-sm' 
                    : 'text-barbie-muted hover:text-barbie-neutral'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
         </div>
      </div>

      {/* Labels & Color */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-barbie-muted uppercase tracking-wider mb-1">
            Tags (comma separated)
          </label>
          <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Tag size={18} className="text-barbie-pink" />
              </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border-2 border-barbie-soft rounded-xl bg-white focus:outline-none focus:border-barbie-deep text-barbie-neutral"
              placeholder="Work, Health, Party"
              value={formData.labels}
              onChange={(e) => setFormData({ ...formData, labels: e.target.value })}
            />
          </div>
        </div>
        <div>
           <label className="block text-xs font-bold text-barbie-muted uppercase tracking-wider mb-1">
            Color
          </label>
          <div className="flex items-center gap-2 h-[50px]">
             <input 
              type="color" 
              value={formData.color}
              onChange={(e) => setFormData({...formData, color: e.target.value})}
              className="h-10 w-10 rounded-full cursor-pointer border-0 p-0 overflow-hidden shadow-sm"
             />
             <span className="text-xs text-barbie-muted font-mono">{formData.color}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-bold text-barbie-muted uppercase tracking-wider mb-1">
          Notes
        </label>
        <textarea
          rows={3}
          className="block w-full p-3 border-2 border-barbie-soft rounded-xl bg-white focus:outline-none focus:border-barbie-deep text-barbie-neutral resize-none"
          placeholder="Add any details here..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      <div className="pt-4 flex gap-3 justify-end">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {initialData ? 'Update Reminder' : 'Create Reminder'}
        </Button>
      </div>
    </form>
  );
};
