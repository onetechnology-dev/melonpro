import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  AppUser, 
  UserRole, 
  FeaturePermission, 
  PermissionAction, 
  RolePermissionsMap, 
  DEFAULT_ROLE_PERMISSIONS, 
  INITIAL_DEMO_USERS 
} from '../types/auth';

const STORAGE_KEY_AUTH_USER = 'melonpro_auth_user_v1';
const STORAGE_KEY_USERS = 'melonpro_users_v1';
const STORAGE_KEY_PERMISSIONS = 'melonpro_role_permissions_v1';

interface AuthContextType {
  currentUser: AppUser | null;
  isAuthenticated: boolean;
  users: AppUser[];
  rolePermissions: RolePermissionsMap;
  login: (usernameOrEmail: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  switchUser: (userId: string) => void;
  quickLoginAsRole: (role: UserRole) => void;
  addUser: (userData: Omit<AppUser, 'id'>) => Promise<AppUser>;
  updateUser: (id: string, updates: Partial<AppUser>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  updateRolePermission: (role: UserRole, featureId: string, action: PermissionAction, value: boolean) => void;
  batchUpdateRolePermissions: (role: UserRole, permissions: Record<string, FeaturePermission>) => void;
  resetRolePermissionsToDefault: (role?: UserRole) => void;
  hasPermission: (featureId: string, action: PermissionAction) => boolean;
  canView: (featureId: string) => boolean;
  canAdd: (featureId: string) => boolean;
  canEdit: (featureId: string) => boolean;
  canDelete: (featureId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Users state
  const [users, setUsers] = useState<AppUser[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USERS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((u: AppUser) => {
            if (u.id === 'user-dev-01' && (u.name === 'Seng Davit' || !u.name)) {
              return { ...u, name: 'Meng Luk', nameKm: 'ម៉េង លុក' };
            }
            return u;
          });
        }
      }
    } catch (e) {
      console.warn('Failed to read users from localStorage', e);
    }
    return INITIAL_DEMO_USERS;
  });

  // 2. Role Permissions state
  const [rolePermissions, setRolePermissions] = useState<RolePermissionsMap>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PERMISSIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.developer && parsed.admin && parsed.farmer && parsed.team) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to read role permissions from localStorage', e);
    }
    return DEFAULT_ROLE_PERMISSIONS;
  });

  // 3. Current Authenticated User state
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_AUTH_USER);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id) {
          if (parsed.id === 'user-dev-01' && (parsed.name === 'Seng Davit' || !parsed.name)) {
            return { ...parsed, name: 'Meng Luk', nameKm: 'ម៉េង លុក' };
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to read auth user from localStorage', e);
    }
    // Default to Developer user for initial experience if stored
    return INITIAL_DEMO_USERS[0];
  });

  // Save users to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save users to localStorage', e);
    }
  }, [users]);

  // Save role permissions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PERMISSIONS, JSON.stringify(rolePermissions));
    } catch (e) {
      console.error('Failed to save role permissions to localStorage', e);
    }
  }, [rolePermissions]);

  // Save current user to localStorage
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEY_AUTH_USER);
      }
    } catch (e) {
      console.error('Failed to save current user to localStorage', e);
    }
  }, [currentUser]);

  // Login handler
  const login = useCallback(async (usernameOrEmail: string, password: string): Promise<{ success: boolean; message?: string }> => {
    const trimmedInput = usernameOrEmail.trim().toLowerCase();
    const trimmedPass = password.trim();

    const matchedUser = users.find(
      (u) => 
        (u.username.toLowerCase() === trimmedInput || u.email.toLowerCase() === trimmedInput) &&
        (u.password === trimmedPass || (!u.password && trimmedPass === '123'))
    );

    if (!matchedUser) {
      return { 
        success: false, 
        message: 'Invalid username, email, or password. Demo accounts use password: 123' 
      };
    }

    if (matchedUser.status === 'inactive') {
      return { 
        success: false, 
        message: 'This user account is currently deactivated. Please contact an Administrator.' 
      };
    }

    const updatedUser: AppUser = {
      ...matchedUser,
      lastLogin: 'Just now',
    };

    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    return { success: true };
  }, [users]);

  // Logout handler
  const logout = useCallback(() => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY_AUTH_USER);
    } catch {
      // ignore
    }
  }, []);

  // Switch user handler
  const switchUser = useCallback((userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      const updated: AppUser = { ...target, lastLogin: 'Just now' };
      setCurrentUser(updated);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    }
  }, [users]);

  // Quick login as a role
  const quickLoginAsRole = useCallback((role: UserRole) => {
    const userForRole = users.find((u) => u.role === role) || INITIAL_DEMO_USERS.find((u) => u.role === role);
    if (userForRole) {
      const updated: AppUser = { ...userForRole, lastLogin: 'Just now' };
      setCurrentUser(updated);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    }
  }, [users]);

  // Add User handler
  const addUser = useCallback(async (userData: Omit<AppUser, 'id'>): Promise<AppUser> => {
    const newUser: AppUser = {
      ...userData,
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString().split('T')[0],
      status: userData.status || 'active',
      password: userData.password || '123',
    };

    setUsers((prev) => [newUser, ...prev]);
    return newUser;
  }, []);

  // Update User handler
  const updateUser = useCallback(async (id: string, updates: Partial<AppUser>): Promise<void> => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const updated = { ...u, ...updates, updatedAt: new Date().toISOString() };
          if (currentUser && currentUser.id === id) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
  }, [currentUser]);

  // Delete User handler
  const deleteUser = useCallback(async (id: string): Promise<void> => {
    if (currentUser?.id === id) {
      throw new Error('Cannot delete currently logged-in user account.');
    }
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }, [currentUser]);

  // Update a single action permission for a role
  const updateRolePermission = useCallback((role: UserRole, featureId: string, action: PermissionAction, value: boolean) => {
    setRolePermissions((prev) => {
      const roleMap = prev[role] || {};
      const currentFeature = roleMap[featureId] || { view: false, add: false, edit: false, delete: false };
      return {
        ...prev,
        [role]: {
          ...roleMap,
          [featureId]: {
            ...currentFeature,
            [action]: value,
          },
        },
      };
    });
  }, []);

  // Batch update all permissions for a role
  const batchUpdateRolePermissions = useCallback((role: UserRole, permissions: Record<string, FeaturePermission>) => {
    setRolePermissions((prev) => ({
      ...prev,
      [role]: permissions,
    }));
  }, []);

  // Reset permissions to default
  const resetRolePermissionsToDefault = useCallback((role?: UserRole) => {
    if (role) {
      setRolePermissions((prev) => ({
        ...prev,
        [role]: JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS[role])),
      }));
    } else {
      setRolePermissions(JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS)));
    }
  }, []);

  // Permission Checker
  const hasPermission = useCallback((featureId: string, action: PermissionAction): boolean => {
    if (!currentUser) return false;

    // Check user-level custom permission override first
    if (currentUser.customPermissions && currentUser.customPermissions[featureId]) {
      const customAction = currentUser.customPermissions[featureId][action];
      if (typeof customAction === 'boolean') {
        return customAction;
      }
    }

    // Check role-level permission
    const role = currentUser.role;
    const roleFeaturePerms = rolePermissions[role]?.[featureId];
    if (roleFeaturePerms) {
      return Boolean(roleFeaturePerms[action]);
    }

    // Fallback to default
    const defaultFeaturePerms = DEFAULT_ROLE_PERMISSIONS[role]?.[featureId];
    return Boolean(defaultFeaturePerms?.[action]);
  }, [currentUser, rolePermissions]);

  const canView = useCallback((featureId: string) => hasPermission(featureId, 'view'), [hasPermission]);
  const canAdd = useCallback((featureId: string) => hasPermission(featureId, 'add'), [hasPermission]);
  const canEdit = useCallback((featureId: string) => hasPermission(featureId, 'edit'), [hasPermission]);
  const canDelete = useCallback((featureId: string) => hasPermission(featureId, 'delete'), [hasPermission]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: currentUser !== null,
        users,
        rolePermissions,
        login,
        logout,
        switchUser,
        quickLoginAsRole,
        addUser,
        updateUser,
        deleteUser,
        updateRolePermission,
        batchUpdateRolePermissions,
        resetRolePermissionsToDefault,
        hasPermission,
        canView,
        canAdd,
        canEdit,
        canDelete,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
