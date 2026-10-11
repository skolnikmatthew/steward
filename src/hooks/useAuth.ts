import { useState, useEffect, useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const authenticate = useCallback(async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        // No biometrics available or configured on this device — allow access.
        setIsAuthenticated(true);
        setIsChecking(false);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Steward',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
      });

      setIsAuthenticated(result.success);
    } catch (e) {
      // Fail closed: an error here means we couldn't verify identity,
      // so keep the app locked rather than granting access.
      setIsAuthenticated(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    authenticate();
  }, [authenticate]);

  return { isAuthenticated, isChecking, authenticate };
}
