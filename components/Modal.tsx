import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const [show, setShow] = useState(isOpen);

  useEffect(() => {
    if (isOpen) setShow(true);
    else setTimeout(() => setShow(false), 200); // Wait for animation
  }, [isOpen]);

  if (!show && !isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-barbie-neutral/30 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Content */}
      <div className={`
        relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden
        transform transition-all duration-300
        ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}
      `}>
        <div className="px-6 py-4 border-b border-barbie-cream flex items-center justify-between bg-gradient-to-r from-white to-barbie-cream">
          <h2 className="text-xl font-display font-bold text-barbie-deep">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-barbie-soft/20 text-barbie-muted hover:text-barbie-deep transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
