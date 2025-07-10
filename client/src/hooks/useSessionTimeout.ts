import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';

const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const WARNING_TIME_MS = 2 * 60 * 1000; // 2 minutes before timeout

export function useSessionTimeout() {
  const { isAuthenticated } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const logout = useCallback(() => {
    // Redirect to logout endpoint which will handle the logout process
    window.location.href = '/api/auth/logout';
  }, []);

  const showWarning = useCallback(() => {
    // Show a warning that session will expire soon
    const remainingTime = Math.ceil((SESSION_TIMEOUT_MS - (Date.now() - lastActivityRef.current)) / 1000 / 60);
    if (confirm(`Votre session va expirer dans ${remainingTime} minute(s). Voulez-vous rester connecté ?`)) {
      // User wants to stay logged in, reset the timer
      resetTimer();
    } else {
      // User chose to logout or didn't respond
      logout();
    }
  }, [logout]);

  const resetTimer = useCallback(() => {
    if (!isAuthenticated) return;

    lastActivityRef.current = Date.now();

    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // Set warning timeout (2 minutes before expiration)
    warningTimeoutRef.current = setTimeout(showWarning, SESSION_TIMEOUT_MS - WARNING_TIME_MS);

    // Set logout timeout
    timeoutRef.current = setTimeout(logout, SESSION_TIMEOUT_MS);
  }, [isAuthenticated, logout, showWarning]);

  const handleActivity = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    if (!isAuthenticated) {
      // Clear timeouts if user is not authenticated
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      return;
    }

    // Start the timer when component mounts or user becomes authenticated
    resetTimer();

    // Activity events to monitor
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Add event listeners for user activity
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [isAuthenticated, handleActivity, resetTimer]);

  return {
    resetTimer,
    timeRemaining: () => Math.max(0, SESSION_TIMEOUT_MS - (Date.now() - lastActivityRef.current))
  };
}