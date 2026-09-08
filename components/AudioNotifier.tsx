'use client';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function AudioNotifier() {
  useEffect(() => {
    const supabase = createClient();
    
    // Listen for new bookings
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookings',
        },
        (payload) => {
          console.log('New booking inserted!', payload);
          // Play sound
          const audio = new Audio('/notification.mp3');
          audio.play().catch(err => {
            console.error('Audio playback failed (browser policy?):', err);
            // Fallback beep if no file or browser blocks it
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.5);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return null; // This component doesn't render anything
}
