import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import SettingsService from '../api/settings';
import { useAuthContext } from './useAuthContext';

interface UIModeContextType {
  uiMode: string;
  loading: boolean;
  error: string | null;
  refetchUIMode: () => Promise<void>;
  updateUIMode: (newMode: string) => Promise<void>;
}

const UIModeContext = createContext<UIModeContextType | undefined>(undefined);

export const UIModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [uiMode, setUiMode] = useState('Orders'); // default
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthContext();

  const fetchUIMode = useCallback(async (outletid: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await SettingsService.getUIMode(outletid);
      setUiMode(response.ui_mode || 'Orders');
    } catch (err) {
      console.error('Failed to fetch UI mode:', err);
      setError('Failed to load UI mode');
      setUiMode('Orders'); // fallback
    } finally {
      setLoading(false);
    }
  }, []);

  const refetchUIMode = useCallback(async () => {
    if (user?.outletid) {
      await fetchUIMode(user.outletid);
    }
  }, [user?.outletid, fetchUIMode]);

  const updateUIMode = useCallback(async (newMode: string) => {
    if (!user?.outletid) {
      throw new Error('No outlet selected');
    }
    try {
      setLoading(true);
      // Optimistic update
      setUiMode(newMode);
      // Save to backend
      await SettingsService.saveUIMode({
        ui_mode: newMode,
        outletid: user.outletid,
        hotelid: user.hotelid || 1,
        created_by_id: user.id || 1
      });
    } catch (err) {
      console.error('Failed to update UI mode:', err);
      setError('Failed to save UI mode');
      // Revert on error (refetch)
      await refetchUIMode();
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, refetchUIMode]);

  // Auto-fetch on mount/user change
  useEffect(() => {
    if (user?.outletid && user.outletid > 0) {
      fetchUIMode(user.outletid);
    } else {
      setLoading(false);
    }
  }, [user?.outletid, fetchUIMode]);

  return (
    <UIModeContext.Provider value={{ uiMode, loading, error, refetchUIMode, updateUIMode }}>
      {children}
    </UIModeContext.Provider>
  );
};

export const useUIModeContext = () => {
  const context = useContext(UIModeContext);
  if (context === undefined) {
    throw new Error('useUIModeContext must be used within UIModeProvider');
  }
  return context;
};

