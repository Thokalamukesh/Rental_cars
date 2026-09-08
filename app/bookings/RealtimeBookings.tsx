'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function RealtimeBookings() {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element for the "Ding" sound
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    
    const supabase = createClient();

    // Subscribe to new insertions on the 'bookings' table
    const channel = supabase
      .channel('realtime_bookings')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookings',
        },
        (payload) => {
          console.log('New booking received!', payload);
          
          // Play the sound
          if (audioRef.current) {
            audioRef.current.play().catch(err => {
              console.error("Browser blocked autoplay. User must interact with the page first.", err);
            });
          }

          // Refresh the page data
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return (
    <div className="bg-indigo-50 border-b border-indigo-100 px-8 py-2 flex items-center justify-between text-sm text-indigo-700">
      <div className="flex items-center gap-2">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
        </span>
        Listening for new bookings...
      </div>
      <button 
        onClick={() => {
          if (audioRef.current) {
            audioRef.current.play().catch(console.error);
            alert("Notification sounds enabled!");
          }
        }}
        className="text-indigo-600 hover:text-indigo-800 font-medium underline"
      >
        Enable Notification Sound
      </button>
    </div>
  );
}
