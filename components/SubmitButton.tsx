'use client';

import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function SubmitButton({ children, className, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      {...props}
      disabled={pending || props.disabled}
      className={`${className} ${pending ? 'opacity-70 cursor-not-allowed' : ''} flex items-center justify-center gap-2`}
    >
      {pending && <Loader2 className="animate-spin" size={16} />}
      {children}
    </button>
  );
}
