import { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  selectCurrentUser,
  selectIsAuthenticated,
  logout as logoutAction,
} from "../../../../../components/redux/features/auth/authSlice";
import {
  selectUserProfile,
  selectUserInitials,
  selectUserFullName,
} from "../../../../../components/redux/features/user/userSlice";
import { useLogoutMutation } from "../../../../../components/redux/features/auth/authApi";
import { useGetUserProfileQuery } from "../../../../../components/redux/features/user/userApi";

interface User {
  id?: string;
  name: string;
  email: string;
  role?: string;
  profile_picture?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  mfa_enabled?: boolean;
  is_verified?: boolean;
  mfa_fully_configured?: boolean;
  date_joined?: string;
  last_login?: string;
}

interface UseAuthReturn {
  // User data
  user: User;
  currentUser: User | null;
  userProfile: User | null;
  isAuthenticated: boolean;
  userInitials: string;
  userFullName: string | null;

  // Profile picture handling
  profileImage: string | null;
  profileImageUrl: string | null;
  imageLoaded: boolean;
  imageError: boolean;

  // Actions
  logout: () => Promise<void>;
  handleImageError: () => void;
  refreshProfile: () => void;

  // Utilities
  hasRole: (role: string) => boolean;
  isAdmin: boolean;
  isManager: boolean;

  // Loading states
  isLoggingOut: boolean;
  isProfileLoading: boolean;

  // Error states
  logoutError: string | null;
  profileError: string | null;
}

export const useAuth = (): UseAuthReturn => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state
  const currentUser = useSelector(selectCurrentUser);
  const userProfile = useSelector(selectUserProfile);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const selectorUserInitials = useSelector(selectUserInitials);
  const selectorUserFullName = useSelector(selectUserFullName);
  const userInitials = selectorUserInitials || "";
  const userFullName = selectorUserFullName || null;

  // Local state
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  // RTK Query mutation
  const [logoutMutation] = useLogoutMutation();
  const {
    data: profileData,
    isLoading: isProfileLoading,
    error: profileError,
    refetch: refreshProfile,
  } = useGetUserProfileQuery(undefined, {
    skip: !isAuthenticated,
    refetchOnMountOrArgChange: true,
  });

  // Helper function to construct full image URL
  const constructImageUrl = useCallback(
    (imagePath: string | null | undefined): string | null => {
      if (!imagePath) return null;

      if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
        return imagePath;
      }

      const baseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/";

      // Remove trailing slash from baseUrl and leading slash from imagePath
      const cleanBaseUrl = baseUrl.endsWith("/")
        ? baseUrl.slice(0, -1)
        : baseUrl;
      const cleanImagePath = imagePath.startsWith("/")
        ? imagePath
        : `/${imagePath}`;

      return `${cleanBaseUrl}${cleanImagePath}`;
    },
    []
  );

  // Generate initials from user name
  const getInitials = useCallback((name: string | null | undefined): string => {
    if (!name || typeof name !== "string") return "U";

    try {
      const trimmedName = name.trim();
      if (!trimmedName) return "U";

      return trimmedName
        .split(" ")
        .filter((word) => word.length > 0)
        .map((word) => word.charAt(0).toUpperCase())
        .join("")
        .substring(0, 2);
    } catch (error) {
      console.warn("Error generating initials:", error);
      return "U";
    }
  }, []);

  // Handle profile picture loading
  useEffect(() => {
    const profilePicture =
      userProfile?.profile_picture || currentUser?.profile_picture;

    if (profilePicture) {
      const imageUrl = constructImageUrl(profilePicture);
      setProfileImage(imageUrl);
      setImageError(false);

      // Preload the image
      if (imageUrl) {
        const img = new Image();
        img.onload = () => {
          setImageLoaded(true);
          setImageError(false);
        };
        img.onerror = () => {
          setImageLoaded(true);
          setImageError(true);
          setProfileImage(null);
        };
        img.src = imageUrl;
      }
    } else {
      setProfileImage(null);
      setImageLoaded(true);
      setImageError(false);
    }
  }, [
    userProfile?.profile_picture,
    currentUser?.profile_picture,
    constructImageUrl,
  ]);

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
    setImageError(true);
  }, []);

  // Safely construct user name with fallbacks
  const getUserName = useCallback(() => {
    if (userFullName) return userFullName;
    if (currentUser?.name) return currentUser.name;
    if (userProfile?.name) return userProfile.name;
    if (currentUser?.first_name && currentUser?.last_name) {
      return `${currentUser.first_name} ${currentUser.last_name}`;
    }
    if (userProfile?.first_name && userProfile?.last_name) {
      return `${userProfile.first_name} ${userProfile.last_name}`;
    }
    if (currentUser?.first_name) return currentUser.first_name;
    if (userProfile?.first_name) return userProfile.first_name;
    return "Guest User";
  }, [userFullName, currentUser, userProfile]);

  // Combine user data from auth and user profile
  const combinedUser: User = {
    ...currentUser,
    ...userProfile,
    name: getUserName(),
  };

  // Safe user object with fallback
  const user: User = isAuthenticated
    ? combinedUser
    : {
        name: "Guest User",
        email: "guest@example.com",
        role: "GUEST",
      };

  // Role checking utilities
  const hasRole = useCallback(
    (role: string): boolean => {
      if (!user?.role) return false;
      return user.role === role;
    },
    [user?.role]
  );

  const isAdmin = hasRole("ADMIN");
  const isManager = hasRole("MANAGER");

  const finalUserInitials = userInitials || getInitials(user.name);

  return {
    // User data
    user,
    currentUser,
    userProfile,
    isAuthenticated,
    userInitials: finalUserInitials,
    userFullName,

    // Profile picture
    profileImage,
    profileImageUrl: profileImage,
    imageLoaded,
    imageError,

    // Actions
    logout,
    handleImageError,
    refreshProfile,

    // Utilities
    hasRole,
    isAdmin,
    isManager,

    // Loading states
    isLoggingOut,
    isProfileLoading,

    // Error states
    logoutError,
    profileError: profileError ? String(profileError) : null,
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
