import React from 'react';
import { Reminder } from '../types';
import { Check, Clock, Trash2, Tag, AlertCircle } from 'lucide-react';
import { format, isPast } from 'date-fns';

interface ReminderCardProps {
  reminder: Reminder;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (reminder: Reminder) => void;
}

export const ReminderCard: React.FC<ReminderCardProps> = ({ 
  reminder, 
  onToggleComplete, 
  onDelete,
  onEdit
}) => {
  const due = new Date(reminder.dueDateTime);
  const isOverdue = !reminder.isCompleted && isPast(due);
  
  // Dynamic Priority Badge
  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'high': return 'text-red-500 bg-red-50';
      case 'medium': return 'text-orange-500 bg-orange-50';
      default: return 'text-barbie-muted bg-gray-50';
    }
  };

  return (
    <div 
      className={`
        group relative overflow-hidden bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-transparent hover:border-barbie-soft
        ${reminder.isCompleted ? 'opacity-60 bg-gray-50' : ''}
      `}
    >
      {/* Colored Strip on Left */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1.5" 
        style={{ backgroundColor: reminder.color || '#FF69B4' }} 
      />

      <div className="p-4 pl-5 flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleComplete(reminder.id); }}
          className={`
            mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
            ${reminder.isCompleted 
              ? 'bg-barbie-pink border-barbie-pink' 
              : 'border-barbie-muted hover:border-barbie-pink'}
          `}
          aria-label={reminder.isCompleted ? "Mark as incomplete" : "Mark as complete"}
        >
          {reminder.isCompleted && <Check size={14} className="text-white" />}
        </button>

        {/* Content */}
        <div 
          className="flex-grow cursor-pointer"
          onClick={() => onEdit(reminder)}
        >
          <div className="flex justify-between items-start">
            <h3 className={`font-display font-semibold text-lg leading-tight mb-1 ${reminder.isCompleted ? 'line-through text-barbie-muted' : 'text-barbie-neutral'}`}>
              {reminder.title}
            </h3>
            {reminder.priority !== 'low' && !reminder.isCompleted && (
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${getPriorityColor(reminder.priority)}`}>
                {reminder.priority}
              </span>
            )}
          </div>
          
          {reminder.notes && (
            <p className="text-sm text-barbie-muted mb-2 line-clamp-2">
              {reminder.notes}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs text-barbie-muted flex-wrap">
            <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-500 font-medium' : ''}`}>
              {isOverdue ? <AlertCircle size={12} /> : <Clock size={12} />}
              <span>{format(due, 'MMM d, h:mm a')}</span>
            </div>
            
            {reminder.labels.length > 0 && (
              <div className="flex items-center gap-1">
                <Tag size={12} />
                <span>{reminder.labels.join(', ')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions (Visible on hover or consistent on mobile) */}
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(reminder.id); }}
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-2 text-barbie-muted hover:text-red-500 rounded-full hover:bg-red-50"
          aria-label="Delete reminder"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};