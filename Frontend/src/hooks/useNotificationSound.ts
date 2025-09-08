import { useCallback, useRef, useEffect } from 'react';
import { useAppSelector } from '../components/utils/hooks';
import { selectIsAuthenticated } from '../components/redux/features/auth/authSlice';
import { useGetUserPreferencesQuery } from '../components/redux/features/api/settings/settingsApi';

// Web Audio API-based notification sounds
export const useNotificationSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  
  // Only make API call if user is authenticated to prevent premature requests
  const { data: userPreferences, isError } = useGetUserPreferencesQuery(undefined, {
    skip: !isAuthenticated, // Skip API call if not authenticated
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });
  
  // Check if sound is enabled in user preferences, default to true if error
  const isSoundEnabled = isError ? true : (userPreferences?.custom_settings?.sound_enabled ?? true);

  // Initialize Audio Context
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.warn('Web Audio API not supported', error);
        return null;
      }
    }
    return audioContextRef.current;
  }, []);

  // Create notification sound using Web Audio API
  const playNotificationSound = useCallback((type: 'default' | 'success' | 'warning' | 'error' = 'default') => {
    if (!isSoundEnabled) return;

    const context = initAudioContext();
    if (!context) return;

    try {
      // Unlock audio context on user interaction (required by browsers)
      if (context.state === 'suspended') {
        context.resume();
      }

      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      // Connect audio nodes
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      // Configure sound based on notification type
      const soundConfig = {
        default: { frequency: 800, duration: 0.2, type: 'sine' as OscillatorType },
        success: { frequency: 600, duration: 0.15, type: 'triangle' as OscillatorType },
        warning: { frequency: 900, duration: 0.25, type: 'square' as OscillatorType },
        error: { frequency: 400, duration: 0.3, type: 'sawtooth' as OscillatorType }
      };

      const config = soundConfig[type];
      
      // Set oscillator properties
      oscillator.type = config.type;
      oscillator.frequency.setValueAtTime(config.frequency, context.currentTime);

      // Create envelope for smooth sound
      gainNode.gain.setValueAtTime(0, context.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, context.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + config.duration);

      // Play sound
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + config.duration);

      // Clean up
      oscillator.onended = () => {
        oscillator.disconnect();
        gainNode.disconnect();
      };

    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }, [isSoundEnabled, initAudioContext]);

  // Alternative: Play system notification sound
  const playSystemNotificationSound = useCallback(() => {
    if (!isSoundEnabled) return;

    try {
      // Create a short data URL audio for a simple beep
      const audioContext = initAudioContext();
      if (!audioContext) {
        // Fallback: Try to use a simple audio element with data URL
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzmO2PbkdSACLojK79maQwsVUaXr8LJhGAg+ltrywnkpBSl+zPLaizsIGGe57+OaSwwVUarm7bJfGgg2jdXzzn0vBSF+yvLZjzwIG2rA7+ScSAwZUqPr6blgGQU');
        audio.play().catch(() => {
          // Silent fail - browser might block autoplay
        });
        return;
      }

      // Use Web Audio API for more control
      playNotificationSound('default');
    } catch (error) {
      console.warn('Failed to play system notification sound:', error);
    }
  }, [isSoundEnabled, initAudioContext, playNotificationSound]);

  // Clean up audio context on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  return {
    playNotificationSound,
    playSystemNotificationSound,
    isSoundEnabled
  };
};