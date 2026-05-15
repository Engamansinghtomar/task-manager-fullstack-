import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export function Spinner({ className, size = 'md' }) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  return (
    <Loader2 
      className={cn("animate-spin text-primary", sizes[size], className)} 
    />
  );
}
