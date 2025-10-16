import React from 'react';
import { Lock, Shield, Zap, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TombIconProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'locked' | 'unlocked' | 'excavating' | 'discovered';
  animated?: boolean;
  className?: string;
}

const TombIcon: React.FC<TombIconProps> = ({ 
  size = 'md', 
  variant = 'locked', 
  animated = true,
  className 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const getIcon = () => {
    switch (variant) {
      case 'unlocked':
        return <Shield className="w-full h-full" />;
      case 'excavating':
        return <Zap className="w-full h-full" />;
      case 'discovered':
        return <Eye className="w-full h-full" />;
      default:
        return <Lock className="w-full h-full" />;
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'unlocked':
        return 'text-emerald glow-success';
      case 'excavating':
        return 'text-accent glow-accent animate-pulse-glow';
      case 'discovered':
        return 'text-destructive animate-glitch';
      default:
        return 'text-primary glow-primary';
    }
  };

  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-lg border-2 border-double egyptian-border p-2',
        sizeClasses[size],
        getVariantStyles(),
        animated && 'transition-all duration-300',
        className
      )}
    >
      {getIcon()}
      
      {/* Glow effect overlay */}
      <div className="absolute inset-0 rounded-lg bg-current opacity-10 pointer-events-none" />
      
      {/* Animated scanner line for excavating state */}
      {variant === 'excavating' && (
        <div className="absolute inset-0 overflow-hidden rounded-lg">
          <div className="w-full h-0.5 bg-accent animate-[slide-up_2s_ease-in-out_infinite] opacity-80" />
        </div>
      )}
    </div>
  );
};

export default TombIcon;
