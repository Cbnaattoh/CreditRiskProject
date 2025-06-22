import { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  selectCurrentUser,
  selectIsAuthenticated,
  logout as logoutAction,
} from "../../../../../components/redux/features/auth/authSlice";
import { useLogoutMutation } from "../../../../../components/redux/features/auth/authApi";

interface User {
  id?: string;
  name: string;
  email: string;
  role?: string;
  profilePictureUrl?: string;
}

interface UseAuthReturn {
  // User data
  user: User;
  currentUser: User | null;
  isAuthenticated: boolean;
  userInitials: string;

  // Profile picture handling
  profileImage: string | null;
  imageLoaded: boolean;

  // Actions
  logout: () => Promise<void>;
  handleImageError: () => void;

  // Utilities
  hasRole: (role: string) => boolean;
  isAdmin: boolean;
  isManager: boolean;

  // Loading states
  isLoggingOut: boolean;

  // Error states
  logoutError: string | null;
}

export const useAuth = (): UseAuthReturn => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state
  const currentUser = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // Local state
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  // RTK Query mutation
  const [logoutMutation] = useLogoutMutation();

  // Generate initials from user name
  const getInitials = useCallback((name: string): string => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .join("")
      .substring(0, 2);
  }, []);

  // Fetch profile picture when user changes
  useEffect(() => {
    if (currentUser?.id) {
      const fetchProfilePicture = async () => {
        try {
          setProfileImage(currentUser.profilePictureUrl || null);
          setImageLoaded(true);
        } catch (error) {
          console.error("Error fetching profile picture:", error);
          setProfileImage(null);
          setImageLoaded(true);
        }
      };
      fetchProfilePicture();
    } else {
      setProfileImage(null);
      setImageLoaded(false);
    }
  }, [currentUser]);

  // Handle logout
  const logout = useCallback(async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    setLogoutError(null);

    try {
      await logoutMutation().unwrap();
      dispatch(logoutAction());
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      setLogoutError(error instanceof Error ? error.message : "Logout failed");
      dispatch(logoutAction());
      navigate("/", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  }, [logoutMutation, dispatch, navigate, isLoggingOut]);

  // Handle profile image error
  const handleImageError = useCallback(() => {
    setProfileImage(null);
  }, []);

  // Safe user object with fallback
  const user: User = currentUser || {
    name: "Guest User",
    email: "guest@example.com",
    role: "GUEST",
  };

  // Role checking utilities
  const hasRole = useCallback(
    (role: string): boolean => {
      if (!currentUser?.role) return false;
      return currentUser.role === role;
    },
    [currentUser?.role]
  );

  const isAdmin = hasRole("ADMIN");
  const isManager = hasRole("MANAGER");

  const userInitials = getInitials(user.name);

  return {
    // User data
    user,
    currentUser,
    isAuthenticated,
    userInitials,

    // Profile picture
    profileImage,
    imageLoaded,

    // Actions
    logout,
    handleImageError,

    // Utilities
    hasRole,
    isAdmin,
    isManager,

    // Loading states
    isLoggingOut,

    // Error states
    logoutError,
  };
};

// // Optional: Create a hook specifically for protected routes
// export const useAuthGuard = (requiredRole?: string) => {
//   const { isAuthenticated, hasRole, currentUser } = useAuth();
//   const navigate = useNavigate();

//   useEffect(() => {
//     if (!isAuthenticated) {
//       navigate("/login", { replace: true });
//       return;
//     }

//     if (requiredRole && !hasRole(requiredRole)) {
//       navigate("/unauthorized", { replace: true });
//       return;
//     }
//   }, [isAuthenticated, hasRole, requiredRole, navigate]);

//   return {
//     isAuthorized: isAuthenticated && (!requiredRole || hasRole(requiredRole)),
//     user: currentUser,
//   };
// };

// // Optional: Type-safe role checker hook
// export const useRoles = () => {
//   const { hasRole, currentUser } = useAuth();

//   return {
//     isAdmin: hasRole("ADMIN"),
//     isManager: hasRole("MANAGER"),
//     isUser: hasRole("USER"),
//     isGuest: hasRole("GUEST"),
//     hasAnyRole: (roles: string[]) => roles.some((role) => hasRole(role)),
//     hasAllRoles: (roles: string[]) => roles.every((role) => hasRole(role)),
//     currentRole: currentUser?.role || null,
//   };
// };
