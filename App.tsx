import React, { useState, useEffect, useMemo } from 'react';
import { Reminder, ReminderFormData, ViewState } from './types';
import { loadReminders, saveReminders, generateId } from './services/storage';
import { Navigation } from './components/Navigation';
import { ReminderCard } from './components/ReminderCard';
import { Modal } from './components/Modal';
import { ReminderEditor } from './components/ReminderEditor';
import { Plus, Calendar as CalendarIcon, Sparkles, Search, ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import { format, isSameDay, endOfMonth, eachDayOfInterval, isSameMonth, endOfWeek, addMonths } from 'date-fns';

// Declare confetti on window for TypeScript
declare global {
  interface Window {
    confetti: any;
  }
}

const App: React.FC = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [view, setView] = useState<ViewState>('today');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | undefined>(undefined);
  const [greeting, setGreeting] = useState('');
  
  // New States
  const [searchQuery, setSearchQuery] = useState('');
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  // Load data on mount
  useEffect(() => {
    const data = loadReminders();
    setReminders(data);
    
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning, Barbie!');
    else if (hour < 18) setGreeting('Good Afternoon, Barbie!');
    else setGreeting('Good Evening, Barbie!');
  }, []);

  // Save data on change
  useEffect(() => {
    saveReminders(reminders);
  }, [reminders]);

  const handleCreateOrUpdate = (data: ReminderFormData) => {
    if (editingReminder) {
      setReminders(reminders.map(r => r.id === editingReminder.id ? {
        ...r,
        ...data,
        labels: data.labels.split(',').map(l => l.trim()).filter(Boolean)
      } : r));
    } else {
      const newReminder: Reminder = {
        id: generateId(),
        ...data,
        labels: data.labels.split(',').map(l => l.trim()).filter(Boolean),
        isCompleted: false,
        createdAt: Date.now()
      };
      setReminders([...reminders, newReminder]);
    }
    setIsModalOpen(false);
    setEditingReminder(undefined);
  };

  const handleToggleComplete = (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (reminder && !reminder.isCompleted && window.confetti) {
      // Trigger confetti if marking as done
      window.confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF69B4', '#DB0073', '#FFD3E0', '#FFFFFF']
      });
    }

    setReminders(reminders.map(r => 
      r.id === id ? { ...r, isCompleted: !r.isCompleted } : r
    ));
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this sparkle?')) {
      setReminders(reminders.filter(r => r.id !== id));
    }
  };

  const openCreateModal = () => {
    setEditingReminder(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setIsModalOpen(true);
  };

  // Filtered Reminders based on search
  const filteredReminders = useMemo(() => {
    if (!searchQuery) return reminders;
    const lowerQuery = searchQuery.toLowerCase();
    return reminders.filter(r => 
      r.title.toLowerCase().includes(lowerQuery) || 
      r.notes?.toLowerCase().includes(lowerQuery) ||
      r.labels.some(l => l.toLowerCase().includes(lowerQuery))
    );
  }, [reminders, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const completed = reminders.filter(r => r.isCompleted).length;
    const total = reminders.length;
    return { completed, total };
  }, [reminders]);

  // --- Views ---

  const renderTodayView = () => {
    const today = new Date();
    const todayReminders = filteredReminders
      .filter(r => !r.isCompleted && isSameDay(new Date(r.dueDateTime), today))
      .sort((a, b) => new Date(a.dueDateTime).getTime() - new Date(b.dueDateTime).getTime());
    
    const otherUpcoming = filteredReminders
      .filter(r => !r.isCompleted && !isSameDay(new Date(r.dueDateTime), today) && new Date(r.dueDateTime) > today)
      .sort((a, b) => new Date(a.dueDateTime).getTime() - new Date(b.dueDateTime).getTime())
      .slice(0, 5);

    return (
      <div className="space-y-8 animate-fade-in pb-24 md:pb-0">
        <section>
          <h2 className="text-xl font-display font-bold text-barbie-deep mb-4 flex items-center gap-2">
            <Sparkles size={20} className="text-barbie-pink" />
            Today's Schedule
          </h2>
          {todayReminders.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-dashed border-barbie-soft">
              {searchQuery ? (
                <p className="text-barbie-muted">No matching sparkles found.</p>
              ) : (
                <>
                  <p className="text-barbie-muted text-lg font-medium">Nothing scheduled for today yet.</p>
                  <p className="text-barbie-pink mt-2 text-sm">Time to relax or plan something fun!</p>
                </>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {todayReminders.map(r => (
                <ReminderCard 
                  key={r.id} 
                  reminder={r} 
                  onToggleComplete={handleToggleComplete} 
                  onDelete={handleDelete}
                  onEdit={openEditModal}
                />
              ))}
            </div>
          )}
        </section>

        {otherUpcoming.length > 0 && (
          <section>
            <h2 className="text-lg font-display font-semibold text-barbie-neutral/70 mb-4">Coming Up Soon</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {otherUpcoming.map(r => (
                <ReminderCard 
                  key={r.id} 
                  reminder={r} 
                  onToggleComplete={handleToggleComplete} 
                  onDelete={handleDelete}
                  onEdit={openEditModal}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    );
  };

  const renderCompletedView = () => {
    const completed = filteredReminders.filter(r => r.isCompleted).sort((a, b) => b.createdAt - a.createdAt);

    return (
      <div className="space-y-6 animate-fade-in pb-24 md:pb-0">
         <h2 className="text-xl font-display font-bold text-barbie-deep mb-4">Completed Sparkles</h2>
         {completed.length === 0 ? (
            <div className="text-center py-10 text-barbie-muted">
              {searchQuery ? "No matching completed tasks." : "No completed tasks yet. Go be productive!"}
            </div>
         ) : (
           <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {completed.map(r => (
                <ReminderCard 
                  key={r.id} 
                  reminder={r} 
                  onToggleComplete={handleToggleComplete} 
                  onDelete={handleDelete}
                  onEdit={openEditModal}
                />
              ))}
           </div>
         )}
      </div>
    );
  };

  const renderCalendarView = () => {
    // Replaced startOfMonth(currentCalendarDate)
    const monthStart = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), 1);
    const monthEnd = endOfMonth(currentCalendarDate);
    
    // Replaced startOfWeek(monthStart) - assuming default Sunday start
    const startDate = new Date(monthStart);
    startDate.setDate(monthStart.getDate() - monthStart.getDay());
    
    const endDate = endOfWeek(monthEnd);
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const today = new Date();

    const nextMonth = () => setCurrentCalendarDate(addMonths(currentCalendarDate, 1));
    // Replaced subMonths(currentCalendarDate, 1)
    const prevMonth = () => setCurrentCalendarDate(addMonths(currentCalendarDate, -1));
    const jumpToday = () => setCurrentCalendarDate(new Date());

    return (
      <div className="animate-fade-in pb-24 md:pb-0 h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-bold text-barbie-deep flex items-center gap-2">
            <CalendarIcon className="text-barbie-pink" />
            {format(currentCalendarDate, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-2 hover:bg-white rounded-full text-barbie-deep transition-colors"><ChevronLeft size={20}/></button>
            <button onClick={jumpToday} className="text-xs font-bold text-barbie-pink px-3 py-1 bg-white rounded-full shadow-sm hover:shadow-md transition-all">Today</button>
            <button onClick={nextMonth} className="p-2 hover:bg-white rounded-full text-barbie-deep transition-colors"><ChevronRight size={20}/></button>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-barbie-soft/50 overflow-hidden flex-grow flex flex-col">
           {/* Days Header */}
           <div className="grid grid-cols-7 bg-barbie-cream border-b border-barbie-soft">
             {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
               <div key={d} className="py-3 text-center text-xs font-bold text-barbie-muted uppercase tracking-wider">
                 {d}
               </div>
             ))}
           </div>
           
           {/* Grid */}
           <div className="grid grid-cols-7 flex-grow auto-rows-fr bg-barbie-soft gap-px">
             {days.map(day => {
               const dayReminders = filteredReminders.filter(r => !r.isCompleted && isSameDay(new Date(r.dueDateTime), day));
               const isCurrentMonth = isSameMonth(day, currentCalendarDate);
               const isToday = isSameDay(day, today);

               return (
                 <div 
                  key={day.toISOString()} 
                  className={`min-h-[100px] bg-white p-2 transition-colors hover:bg-gray-50 flex flex-col ${!isCurrentMonth ? 'bg-gray-50/50' : ''}`}
                 >
                   <div className="flex justify-between items-start mb-1">
                     <span className={`
                        w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold
                        ${isToday ? 'bg-barbie-pink text-white' : 'text-barbie-neutral'}
                        ${!isCurrentMonth ? 'text-barbie-muted/50' : ''}
                     `}>
                       {format(day, 'd')}
                     </span>
                   </div>
                   
                   <div className="flex-grow space-y-1 overflow-y-auto max-h-[100px]">
                      {dayReminders.map(r => (
                        <div 
                          key={r.id} 
                          className="px-1.5 py-1 rounded text-[10px] font-medium truncate border-l-2 cursor-pointer hover:opacity-80"
                          style={{ backgroundColor: (r.color || '#FF69B4') + '20', borderLeftColor: r.color || '#FF69B4', color: '#333' }}
                          onClick={() => openEditModal(r)}
                        >
                          {r.title}
                        </div>
                      ))}
                   </div>
                 </div>
               );
             })}
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-barbie-cream text-barbie-neutral font-body md:pl-64">
      <Navigation currentView={view} onChangeView={setView} />
      
      {/* Mobile Header with Search */}
      <header className="md:hidden flex flex-col p-6 bg-white/50 backdrop-blur-sm sticky top-0 z-30 gap-4">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-xl text-barbie-deep">BarbieRemind</h1>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-barbie-pink to-barbie-deep text-white flex items-center justify-center font-bold">
                B
            </div>
         </div>
         {/* Mobile Search Bar */}
         <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-barbie-muted" size={16} />
            <input 
              type="text" 
              placeholder="Search sparkles..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-barbie-soft text-sm focus:outline-none focus:border-barbie-pink"
            />
         </div>
      </header>

      {/* Main Content Area */}
      <main className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen">
        <header className="hidden md:flex justify-between items-start mb-10">
          <div>
            <h2 className="font-display font-bold text-3xl text-barbie-neutral">{greeting}</h2>
            <p className="text-barbie-muted mt-1">Ready to organize your dream life?</p>
          </div>
          
          <div className="flex gap-6 items-center">
            {/* Desktop Statistics */}
            <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-2xl shadow-sm border border-barbie-soft/50">
              <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-500">
                <Trophy size={20} />
              </div>
              <div>
                <p className="text-xs text-barbie-muted font-bold uppercase">Sparkles</p>
                <p className="text-sm font-bold text-barbie-deep">{stats.completed} / {stats.total}</p>
              </div>
            </div>

            {/* Desktop Search */}
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-barbie-muted" size={18} />
              <input 
                type="text" 
                placeholder="Search your sparkles..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl shadow-sm border-2 border-transparent focus:border-barbie-soft transition-all text-sm focus:outline-none"
              />
            </div>
          </div>
        </header>

        {view === 'today' && renderTodayView()}
        {view === 'completed' && renderCompletedView()}
        {view === 'calendar' && renderCalendarView()}
      </main>

      {/* FAB */}
      <button 
        onClick={openCreateModal}
        className="fixed bottom-24 md:bottom-10 right-6 md:right-10 w-16 h-16 rounded-full shadow-lg hover:shadow-xl shadow-barbie-pink/40 bg-gradient-to-br from-barbie-pink to-barbie-deep text-white flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-40"
        aria-label="Create reminder"
      >
        <Plus size={32} />
      </button>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingReminder ? "Edit Sparkle" : "New Sparkle"}
      >
        <ReminderEditor 
          initialData={editingReminder}
          onSave={handleCreateOrUpdate}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default App;