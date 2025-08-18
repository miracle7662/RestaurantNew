import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the context and provider
interface User {
  userid: number;
  username: string;
  role_level: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await new Promise<User>((resolve) => {
        setTimeout(() => {
          resolve({ userid: 1, username: 'admin', role_level: 'superadmin' });
        }, 1000);
      });
      setUser(userData);
    };

    fetchUser();
  }, []);

  return (
<AuthContext.Provider value={{ user, isAuthenticated: Boolean(user) }}>
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
