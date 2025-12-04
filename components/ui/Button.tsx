import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  className = '',
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-2xl font-display font-semibold transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-barbie-soft/50 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";
  
  const variants = {
    primary: "bg-gradient-to-r from-barbie-pink to-barbie-deep text-white shadow-lg shadow-barbie-pink/30 hover:shadow-xl hover:shadow-barbie-pink/40 hover:-translate-y-0.5",
    secondary: "bg-white text-barbie-deep border-2 border-barbie-soft hover:bg-barbie-cream hover:border-barbie-pink",
    ghost: "bg-transparent text-barbie-deep hover:bg-barbie-soft/20",
    icon: "p-2 rounded-full hover:bg-black/5 text-barbie-deep"
  };

  const sizes = {
    sm: "text-xs px-3 py-1.5",
    md: "text-sm px-5 py-2.5",
    lg: "text-base px-8 py-3.5",
  };

  const widthStyle = fullWidth ? "w-full" : "";

  // Override size for icon variant
  const finalSize = variant === 'icon' ? '' : sizes[size];

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${finalSize} ${widthStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
