import React, { useState, useEffect, useMemo } from 'react';
import { Reminder, ReminderFormData, ViewState } from './types';
import { loadReminders, saveReminders, generateId } from './services/storage';
import { requestNotificationPermission, sendNotification, getNotificationPermissionState } from './services/notifications';
import { Navigation } from './components/Navigation';
import { ReminderCard } from './components/ReminderCard';
import { Modal } from './components/Modal';
import { ReminderEditor } from './components/ReminderEditor';
import { Plus, Calendar as CalendarIcon, Sparkles, Search, ChevronLeft, ChevronRight, Trophy, Bell, BellOff, Download, HelpCircle, Share, MoreVertical, PlusSquare } from 'lucide-react';
import { format, isSameDay, endOfMonth, eachDayOfInterval, isSameMonth, endOfWeek, addMonths } from 'date-fns';

// Declare confetti on window for TypeScript
declare global {
  interface Window {
    confetti: any;
    deferredPrompt: any;
  }
}

const App: React.FC = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [view, setView] = useState<ViewState>('today');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | undefined>(undefined);
  const [greeting, setGreeting] = useState('');
  
  // New States
  const [searchQuery, setSearchQuery] = useState('');
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  // Load data on mount
  useEffect(() => {
    const data = loadReminders();
    setReminders(data);
    setNotificationPermission(getNotificationPermissionState());
    
    // Check OS
    const isIOSCheck = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSCheck);

    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning, Barbie!');
    else if (hour < 18) setGreeting('Good Afternoon, Barbie!');
    else setGreeting('Good Evening, Barbie!');

    // PWA Install Prompt Listener
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    });
  }, []);

  // Save data on change
  useEffect(() => {
    saveReminders(reminders);
  }, [reminders]);

  // Notification Checker Interval
  useEffect(() => {
    if (notificationPermission !== 'granted') return;

    const intervalId = setInterval(() => {
      const now = new Date();
      
      setReminders(currentReminders => {
        let hasUpdates = false;
        
        const updatedReminders = currentReminders.map(r => {
          if (r.isCompleted || r.wasNotified) return r;

          const due = new Date(r.dueDateTime);
          const timeDiff = now.getTime() - due.getTime();

          // Check if due time is in the past, but within the last minute (to avoid spamming old tasks)
          // Or if it's just becoming due now
          if (timeDiff >= 0 && timeDiff < 60000) {
             sendNotification(`It's time! ✨`, r.title);
             hasUpdates = true;
             return { ...r, wasNotified: true };
          }
          return r;
        });

        return hasUpdates ? updatedReminders : currentReminders;
      });

    }, 10000); // Check every 10 seconds

    return () => clearInterval(intervalId);
  }, [notificationPermission]);

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setNotificationPermission(granted ? 'granted' : 'denied');
    if (granted) {
      sendNotification("Notifications enabled! 💖", "You'll now be notified when your sparkles are due.");
    }
  };

  const handleInstallApp = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          setInstallPrompt(null);
        }
      });
    } else {
      // Open help modal for manual instructions (iOS or if prompt hidden)
      setIsHelpOpen(true);
    }
  };

  const handleCreateOrUpdate = (data: ReminderFormData) => {
    if (editingReminder) {
      setReminders(reminders.map(r => r.id === editingReminder.id ? {
        ...r,
        ...data,
        labels: data.labels.split(',').map(l => l.trim()).filter(Boolean),
        wasNotified: false // Reset notification if they change the time/details
      } : r));
    } else {
      const newReminder: Reminder = {
        id: generateId(),
        ...data,
        labels: data.labels.split(',').map(l => l.trim()).filter(Boolean),
        isCompleted: false,
        createdAt: Date.now(),
        wasNotified: false
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
    const monthStart = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), 1);
    const monthEnd = endOfMonth(currentCalendarDate);
    
    const startDate = new Date(monthStart);
    startDate.setDate(monthStart.getDate() - monthStart.getDay());
    
    const endDate = endOfWeek(monthEnd);
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const today = new Date();

    const nextMonth = () => setCurrentCalendarDate(addMonths(currentCalendarDate, 1));
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
            
            <div className="flex items-center gap-3">
              {/* Install / Help Button (Mobile) */}
              <button 
                onClick={handleInstallApp}
                className={`w-8 h-8 rounded-full bg-white text-barbie-deep border border-barbie-soft flex items-center justify-center shadow-sm ${installPrompt ? 'animate-bounce' : ''}`}
                title="Install App"
              >
                {installPrompt ? <Download size={16} /> : <HelpCircle size={16} />}
              </button>

              {/* Mobile Bell */}
              {notificationPermission !== 'granted' && notificationPermission !== 'unsupported' && (
                <button 
                  onClick={handleRequestPermission}
                  className="w-8 h-8 rounded-full bg-white text-barbie-pink border border-barbie-soft flex items-center justify-center shadow-sm"
                >
                  <BellOff size={16} />
                </button>
              )}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-barbie-pink to-barbie-deep text-white flex items-center justify-center font-bold">
                  B
              </div>
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
             {/* Install / Help Button (Desktop) */}
            <button 
              onClick={handleInstallApp}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl ${installPrompt ? 'bg-barbie-deep text-white shadow-md' : 'bg-white text-barbie-muted border border-barbie-soft'} hover:opacity-90 transition-all font-medium text-sm`}
            >
                {installPrompt ? <Download size={18} /> : <HelpCircle size={18} />}
                <span>{installPrompt ? 'Install App' : 'How to Install'}</span>
            </button>

            {/* Notification Permission Bell (Desktop) */}
            {notificationPermission !== 'granted' && notificationPermission !== 'unsupported' && (
               <button 
                onClick={handleRequestPermission}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-barbie-pink/10 text-barbie-deep hover:bg-barbie-pink/20 transition-colors font-medium text-sm animate-pulse"
                title="Enable Notifications"
               >
                 <Bell size={18} />
                 <span>Enable Alerts</span>
               </button>
            )}

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

      {/* Create/Edit Modal */}
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

      {/* Install Help Modal */}
      <Modal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        title="Get the App 📱"
      >
        <div className="space-y-6 text-barbie-neutral">
           <p className="text-sm text-barbie-muted">
             BarbieRemind is a web app that you can add directly to your home screen! No download store required.
           </p>

           <div className="bg-gray-50 p-4 rounded-xl border border-barbie-soft/50">
              <h3 className="font-bold text-barbie-deep flex items-center gap-2 mb-2">
                 <span>🍎</span> iPhone (iOS)
              </h3>
              <ol className="list-decimal list-inside text-sm space-y-2 text-barbie-neutral/80">
                 <li>Tap the <strong>Share</strong> button <Share className="inline w-4 h-4 mx-1" /> in Safari.</li>
                 <li>Scroll down and select <strong>Add to Home Screen</strong> <PlusSquare className="inline w-4 h-4 mx-1" />.</li>
                 <li>Tap <strong>Add</strong> in the top right.</li>
              </ol>
           </div>

           <div className="bg-gray-50 p-4 rounded-xl border border-barbie-soft/50">
              <h3 className="font-bold text-barbie-deep flex items-center gap-2 mb-2">
                 <span>🤖</span> Android
              </h3>
              <ol className="list-decimal list-inside text-sm space-y-2 text-barbie-neutral/80">
                 <li>Tap the <strong>Menu</strong> icon <MoreVertical className="inline w-4 h-4 mx-1" /> in Chrome.</li>
                 <li>Select <strong>Install App</strong> or <strong>Add to Home Screen</strong>.</li>
                 <li>Follow the prompts to install.</li>
              </ol>
           </div>
           
           <div className="text-center pt-2">
              <button 
                onClick={() => setIsHelpOpen(false)}
                className="text-barbie-pink text-sm font-semibold hover:underline"
              >
                Got it, thanks!
              </button>
           </div>
        </div>
      </Modal>
    </div>
  );
};

export default App;