import { useState, useEffect } from 'react';
import { queryClient } from './queryClient';

// Feature flag configuration
interface FeatureFlags {
  'react-query-products': boolean;
  'react-query-sales': boolean;
  'react-query-accounts-payable': boolean;
  'react-query-accounts-receivable': boolean;
  'react-query-purchases': boolean;
  'react-query-recent-activity': boolean;
  'react-query-bank-register': boolean;
  'react-query-cash-register': boolean;
  'react-query-payments': boolean;
}

// Default feature flags - start with all disabled for safe rollout
const DEFAULT_FLAGS: FeatureFlags = {
  'react-query-products': true, // Start with products enabled
  'react-query-sales': true, // Enable sales
  'react-query-accounts-payable': true, // ✅ ENABLED - Week 1 Core Financial
  'react-query-accounts-receivable': true, // ✅ ENABLED - Week 1 Core Financial
  'react-query-purchases': true, // Enable purchases
  'react-query-recent-activity': false,
  'react-query-bank-register': true, // ✅ ENABLED - Week 1 Core Financial
  'react-query-cash-register': true, // ✅ ENABLED - Week 1 Core Financial
  'react-query-payments': true, // ✅ ENABLED - Week 1 Core Financial
};

// In-memory feature flag store (in production, this would come from a config service)
let featureFlags: FeatureFlags = { ...DEFAULT_FLAGS };

// Get feature flag value
export const getFeatureFlag = (flagKey: keyof FeatureFlags): boolean => {
  return featureFlags[flagKey] ?? false;
};

// Set feature flag value
export const setFeatureFlag = (flagKey: keyof FeatureFlags, value: boolean): void => {
  featureFlags[flagKey] = value;
  
  // Trigger re-render for components using this flag
  window.dispatchEvent(new CustomEvent('featureFlagChanged', { 
    detail: { flagKey, value } 
  }));
};

// React hook for using feature flags
export const useFeatureFlag = (flagKey: keyof FeatureFlags): boolean => {
  const [enabled, setEnabled] = useState(() => getFeatureFlag(flagKey));
  
  useEffect(() => {
    const handleFlagChange = (event: CustomEvent) => {
      if (event.detail.flagKey === flagKey) {
        setEnabled(event.detail.value);
      }
    };
    
    window.addEventListener('featureFlagChanged', handleFlagChange as EventListener);
    
    return () => {
      window.removeEventListener('featureFlagChanged', handleFlagChange as EventListener);
    };
  }, [flagKey]);
  
  return enabled;
};

// Emergency rollback function
export const emergencyRollback = (flagKey: keyof FeatureFlags): void => {
  console.warn(`Emergency rollback triggered for ${flagKey}`);
  setFeatureFlag(flagKey, false);
  
  // Clear React Query cache to force refetch with old implementation
  queryClient.clear();
  
  // Reload the page to ensure clean state
  window.location.reload();
};

// Batch enable/disable flags
export const setBatchFlags = (flags: Partial<FeatureFlags>): void => {
  Object.entries(flags).forEach(([key, value]) => {
    setFeatureFlag(key as keyof FeatureFlags, value);
  });
};

// Get all current flag states
export const getAllFlags = (): FeatureFlags => {
  return { ...featureFlags };
};