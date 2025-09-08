import { useEffect, useRef, useCallback } from 'react';
import { useAppSelector } from '../components/utils/hooks';
import { selectIsAuthenticated, selectCurrentUser } from '../components/redux/features/auth/authSlice';

interface MouseMovement {
  x: number;
  y: number;
  timestamp: number;
}

interface TypingPattern {
  key: string;
  dwellTime: number;
  flightTime: number;
  timestamp: number;
}

interface BehavioralData {
  mouse: MouseMovement[];
  typing: TypingPattern[];
  sessionStart: number;
  userAgent: string;
  screenResolution: string;
  timezone: string;
}

export const useBehavioralMonitoring = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const currentUser = useAppSelector(selectCurrentUser);
  
  const behavioralDataRef = useRef<BehavioralData>({
    mouse: [],
    typing: [],
    sessionStart: Date.now(),
    userAgent: navigator.userAgent,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
  
  const lastKeystrokeRef = useRef<number>(0);
  const keyDownTimeRef = useRef<{ [key: string]: number }>({});
  
  // Mouse movement tracking
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isAuthenticated) return;
    
    const mouseData = {
      x: event.clientX,
      y: event.clientY,
      timestamp: Date.now()
    };
    
    // Keep only last 100 mouse movements to prevent memory issues
    behavioralDataRef.current.mouse.push(mouseData);
    if (behavioralDataRef.current.mouse.length > 100) {
      behavioralDataRef.current.mouse = behavioralDataRef.current.mouse.slice(-50);
    }
  }, [isAuthenticated]);

  // Keystroke dynamics tracking
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isAuthenticated) return;
    
    const key = event.key;
    const timestamp = Date.now();
    keyDownTimeRef.current[key] = timestamp;
  }, [isAuthenticated]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (!isAuthenticated) return;
    
    const key = event.key;
    const timestamp = Date.now();
    const keyDownTime = keyDownTimeRef.current[key];
    
    if (keyDownTime) {
      const dwellTime = timestamp - keyDownTime;
      const flightTime = lastKeystrokeRef.current ? timestamp - lastKeystrokeRef.current : 0;
      
      const typingData = {
        key: key.length === 1 ? key : '[SPECIAL]', // Anonymize special keys
        dwellTime,
        flightTime,
        timestamp
      };
      
      behavioralDataRef.current.typing.push(typingData);
      
      // Keep only last 50 keystrokes
      if (behavioralDataRef.current.typing.length > 50) {
        behavioralDataRef.current.typing = behavioralDataRef.current.typing.slice(-25);
      }
      
      lastKeystrokeRef.current = timestamp;
      delete keyDownTimeRef.current[key];
    }
  }, [isAuthenticated]);

  // Process and send behavioral data
  const processBehavioralData = useCallback(() => {
    if (!isAuthenticated || !currentUser) return null;

    const data = behavioralDataRef.current;
    
    // Calculate derived metrics
    const processedData = {
      // Mouse metrics
      mouse: {
        movements: data.mouse.length,
        velocity: calculateMouseVelocity(data.mouse),
        trajectory: calculateMouseTrajectory(data.mouse),
        clickPatterns: extractClickPatterns(data.mouse),
        pausePatterns: extractPausePatterns(data.mouse)
      },
      
      // Typing metrics
      typing: {
        keystrokes: data.typing.length,
        wpm: calculateWPM(data.typing),
        rhythm: calculateTypingRhythm(data.typing),
        dwellTimes: data.typing.map(t => t.dwellTime),
        flightTimes: data.typing.map(t => t.flightTime),
        keystrokeDynamics: extractKeystrokeDynamics(data.typing)
      },
      
      // Session metrics
      session: {
        duration: Date.now() - data.sessionStart,
        userAgent: data.userAgent,
        screenResolution: data.screenResolution,
        timezone: data.timezone,
        timestamp: new Date().toISOString()
      }
    };

    return processedData;
  }, [isAuthenticated, currentUser]);

  // Send behavioral data to backend
  const sendBehavioralData = useCallback(async (data: any) => {
    if (!data) return;

    try {
      // Add behavioral data to request headers for middleware to capture
      const headers = new Headers();
      headers.append('Content-Type', 'application/json');
      headers.append('X-Mouse-Data', JSON.stringify(data.mouse));
      headers.append('X-Typing-Data', JSON.stringify(data.typing));
      headers.append('X-Session-Data', JSON.stringify(data.session));
      
      // Send to behavioral data submission endpoint
      const response = await fetch('/api/security/behavioral-data/submit/', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(data)
      });

      if (response.ok) {
        console.log('📊 Behavioral data submitted successfully');
      } else {
        console.warn('⚠️ Failed to submit behavioral data:', response.status);
      }
    } catch (error) {
      console.error('❌ Error submitting behavioral data:', error);
    }
  }, []);

  // Periodic data submission
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      const data = processBehavioralData();
      if (data) {
        sendBehavioralData(data);
      }
    }, 30000); // Send data every 30 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated, processBehavioralData, sendBehavioralData]);

  // Event listeners setup
  useEffect(() => {
    if (!isAuthenticated) return;

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('keydown', handleKeyDown, { passive: true });
    document.addEventListener('keyup', handleKeyUp, { passive: true });

    // Cleanup
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [isAuthenticated, handleMouseMove, handleKeyDown, handleKeyUp]);

  // Submit data when user becomes inactive or leaves
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleBeforeUnload = () => {
      const data = processBehavioralData();
      if (data) {
        // Use sendBeacon for reliable data transmission on page unload
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        navigator.sendBeacon('/api/security/behavioral-data/submit/', blob);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const data = processBehavioralData();
        if (data) {
          sendBehavioralData(data);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, processBehavioralData, sendBehavioralData]);

  return {
    isMonitoring: isAuthenticated,
    submitBehavioralData: () => {
      const data = processBehavioralData();
      if (data) sendBehavioralData(data);
    }
  };
};

// Helper functions for behavioral analysis
function calculateMouseVelocity(movements: MouseMovement[]): number[] {
  if (movements.length < 2) return [];
  
  const velocities = [];
  for (let i = 1; i < movements.length; i++) {
    const prev = movements[i - 1];
    const curr = movements[i];
    
    const distance = Math.sqrt(
      Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
    );
    const time = curr.timestamp - prev.timestamp;
    
    if (time > 0) {
      velocities.push(distance / time);
    }
  }
  
  return velocities;
}

function calculateMouseTrajectory(movements: MouseMovement[]): any {
  if (movements.length < 3) return {};
  
  const directions = [];
  const curvatures = [];
  
  for (let i = 2; i < movements.length; i++) {
    const p1 = movements[i - 2];
    const p2 = movements[i - 1];
    const p3 = movements[i];
    
    // Calculate direction change
    const angle1 = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const angle2 = Math.atan2(p3.y - p2.y, p3.x - p2.x);
    const directionChange = Math.abs(angle2 - angle1);
    
    directions.push(directionChange);
  }
  
  return {
    directionChanges: directions,
    avgDirectionChange: directions.length > 0 ? directions.reduce((a, b) => a + b, 0) / directions.length : 0,
    maxDirectionChange: directions.length > 0 ? Math.max(...directions) : 0
  };
}

function extractClickPatterns(movements: MouseMovement[]): any {
  // Simplified click pattern extraction
  // In a real implementation, you'd track actual click events
  return {
    estimatedClicks: Math.floor(movements.length / 20), // Very rough estimate
    clickIntervals: [] // Would need actual click event tracking
  };
}

function extractPausePatterns(movements: MouseMovement[]): any {
  if (movements.length < 2) return { pauses: 0, avgPauseDuration: 0 };
  
  const pauses = [];
  
  for (let i = 1; i < movements.length; i++) {
    const timeDiff = movements[i].timestamp - movements[i - 1].timestamp;
    if (timeDiff > 500) { // Pause longer than 500ms
      pauses.push(timeDiff);
    }
  }
  
  return {
    pauses: pauses.length,
    avgPauseDuration: pauses.length > 0 ? pauses.reduce((a, b) => a + b, 0) / pauses.length : 0
  };
}

function calculateWPM(typing: TypingPattern[]): number {
  if (typing.length < 2) return 0;
  
  const timeSpan = typing[typing.length - 1].timestamp - typing[0].timestamp;
  const timeInMinutes = timeSpan / 60000;
  
  // Rough WPM calculation (assuming 5 characters per word)
  const characters = typing.filter(t => t.key.length === 1).length;
  const words = characters / 5;
  
  return timeInMinutes > 0 ? words / timeInMinutes : 0;
}

function calculateTypingRhythm(typing: TypingPattern[]): any {
  if (typing.length < 3) return {};
  
  const flightTimes = typing.map(t => t.flightTime).filter(ft => ft > 0);
  const dwellTimes = typing.map(t => t.dwellTime);
  
  return {
    avgFlightTime: flightTimes.length > 0 ? flightTimes.reduce((a, b) => a + b, 0) / flightTimes.length : 0,
    avgDwellTime: dwellTimes.length > 0 ? dwellTimes.reduce((a, b) => a + b, 0) / dwellTimes.length : 0,
    rhythmVariance: calculateVariance(flightTimes)
  };
}

function extractKeystrokeDynamics(typing: TypingPattern[]): any {
  const dynamics = {
    dwellTimeVariance: calculateVariance(typing.map(t => t.dwellTime)),
    flightTimeVariance: calculateVariance(typing.map(t => t.flightTime).filter(ft => ft > 0)),
    typingSpeed: typing.length > 0 ? typing.length / ((typing[typing.length - 1].timestamp - typing[0].timestamp) / 1000) : 0
  };
  
  return dynamics;
}

function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
  
  return variance;
}