import { useState, useCallback } from 'react';

export function useCameraTest() {
  const [testResults, setTestResults] = useState<{
    hasMediaDevices: boolean;
    hasGetUserMedia: boolean;
    hasEnumerateDevices: boolean;
    videoDevicesCount: number;
    permissions: string;
    error?: string;
  } | null>(null);

  const runCameraTest = useCallback(async () => {
    const results = {
      hasMediaDevices: !!navigator.mediaDevices,
      hasGetUserMedia: !!(navigator.mediaDevices?.getUserMedia),
      hasEnumerateDevices: !!(navigator.mediaDevices?.enumerateDevices),
      videoDevicesCount: 0,
      permissions: 'unknown' as string,
      error: undefined as string | undefined
    };

    try {
      // Test 1: Check basic API availability
      if (!navigator.mediaDevices) {
        results.error = 'navigator.mediaDevices not available';
        setTestResults(results);
        return results;
      }

      if (!navigator.mediaDevices.getUserMedia) {
        results.error = 'getUserMedia not available';
        setTestResults(results);
        return results;
      }

      // Test 2: Check permissions
      try {
        const permission = await navigator.permissions?.query({ name: 'camera' as PermissionName });
        results.permissions = permission?.state || 'unknown';
      } catch (e) {
        results.permissions = 'query_failed';
      }

      // Test 3: Enumerate devices
      if (navigator.mediaDevices.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(device => device.kind === 'videoinput');
          results.videoDevicesCount = videoDevices.length;
          
          if (videoDevices.length === 0) {
            results.error = 'No video devices found';
          }
        } catch (e) {
          results.error = `Device enumeration failed: ${e}`;
        }
      }

      // Test 4: Try basic camera access
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop()); // Clean up immediately
        results.error = undefined; // Camera works!
      } catch (e: any) {
        results.error = `Camera access failed: ${e.name} - ${e.message}`;
      }

    } catch (e: any) {
      results.error = `Test failed: ${e.message}`;
    }

    setTestResults(results);
    return results;
  }, []);

  return {
    testResults,
    runCameraTest
  };
}