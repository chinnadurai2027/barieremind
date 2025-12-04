import React from 'react';
import { ViewState } from '../types';
import { Home, Calendar, CheckSquare, Settings } from 'lucide-react';

interface NavigationProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, onChangeView }) => {
  const navItems = [
    { id: 'today', icon: Home, label: 'Today' },
    { id: 'calendar', icon: Calendar, label: 'Calendar' },
    { id: 'completed', icon: CheckSquare, label: 'Done' },
  ];

  return (
    <>
      {/* Mobile Bottom Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-barbie-soft/50 px-6 py-3 flex justify-between items-center md:hidden z-40 safe-area-pb">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id as ViewState)}
              className={`flex flex-col items-center gap-1 transition-colors ${
                isActive ? 'text-barbie-deep' : 'text-barbie-muted hover:text-barbie-pink'
              }`}
            >
              <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-barbie-soft/30 p-6 z-40">
        <div className="mb-10 flex items-center gap-2 text-barbie-deep">
           {/* Logo placeholder */}
           <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-barbie-pink to-barbie-deep flex items-center justify-center text-white font-bold font-display text-xl">
             B
           </div>
           <h1 className="font-display font-bold text-xl tracking-tight">BarbieRemind</h1>
        </div>

        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
             const isActive = currentView === item.id;
             return (
              <button
                key={item.id}
                onClick={() => onChangeView(item.id as ViewState)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                  ? 'bg-barbie-cream text-barbie-deep font-semibold shadow-sm' 
                  : 'text-barbie-neutral hover:bg-gray-50'
                }`}
              >
                <item.icon size={20} className={isActive ? 'text-barbie-pink' : 'text-barbie-muted'} />
                <span>{item.label}</span>
              </button>
             );
          })}
        </nav>

        <div className="mt-auto">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-barbie-soft to-barbie-cream border border-white shadow-sm">
            <h4 className="font-display font-bold text-barbie-deep text-sm mb-1">Pro Tip ✨</h4>
            <p className="text-xs text-barbie-neutral/80">
              Drag tasks in calendar view to reschedule them instantly!
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
