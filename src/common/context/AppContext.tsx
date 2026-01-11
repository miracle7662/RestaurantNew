import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Define the session data interface
interface SessionData {
  userId?: string | number;
  companyId?: string | number;
  yearId?: string | number;
  token?: string;
}

// Define the context interface
interface AppContextType {
  session: SessionData;
  setSession: (session: SessionData) => void;
  clearSession: () => void;
  isAuthenticated: boolean;
}

// Create the context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component props
interface AppProviderProps {
  children: ReactNode;
}

// Provider component
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [session, setSessionState] = useState<SessionData>({});

  // Check if user is authenticated based on session data
  const isAuthenticated = Boolean(session.userId && session.companyId && session.yearId && session.token);

  // Set session data
  const setSession = useCallback((newSession: SessionData) => {
    setSessionState(newSession);
  }, []);

  // Clear session data (for logout)
  const clearSession = useCallback(() => {
    setSessionState({});
  }, []);

  // Optional: Persist session in localStorage for page refresh (but not main state)
  useEffect(() => {
    const storedSession = localStorage.getItem('appSession');
    if (storedSession) {
      try {
        const parsedSession = JSON.parse(storedSession);
        setSessionState(parsedSession);
      } catch (error) {
        console.error('Error parsing stored session:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (Object.keys(session).length > 0) {
      localStorage.setItem('appSession', JSON.stringify(session));
    } else {
      localStorage.removeItem('appSession');
    }
  }, [session]);

  const value: AppContextType = {
    session,
    setSession,
    clearSession,
    isAuthenticated,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Hook to use the context
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// Export the context for advanced use cases
export { AppContext };
