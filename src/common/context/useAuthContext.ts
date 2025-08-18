import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the context and provider
interface AuthContextType {
  user: { userid: number; username: string; role_level: string } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ userid: number; username: string; role_level: string } | null>(null);

  useEffect(() => {
    // Fetch user data from local storage or API
    const fetchUser = async () => {
      // Simulate fetching user data
      const userData = await new Promise((resolve) => {
        setTimeout(() => {
          resolve({ userid: 1, username: 'admin', role_level: 'superadmin' });
        }, 1000);
      });
      setUser(userData);
    };

    fetchUser();
  }, []);

  return (
      <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
