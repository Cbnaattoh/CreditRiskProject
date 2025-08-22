import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiHome,
  FiBriefcase,
  FiCalendar,
  FiLink,
  FiShield,
  FiCamera,
  FiEdit3,
  FiSave,
  FiX,
  FiTrendingUp,
  FiAward,
  FiLogOut,
  FiActivity,
  FiAlertCircle,
  FiCheck,
  FiCheckCircle,
} from "react-icons/fi";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../../components/redux/features/auth/authSlice";
import { useAuth } from "../../Authentication/Login-SignUp/components/hooks/useAuth";
import { 
  useGetEnhancedUserProfileQuery,
  useUpdateUserProfileMutation,
  useUploadProfilePictureMutation 
} from "../../../components/redux/features/user/userApi";
import SignoutModal from "../../Home/components/SignoutModal";
import { useToast } from "../../../components/utils/Toast";
import { useOptimizedRealTime } from "../../../hooks/useRealTimeSettings";
import { RealTimeIndicator } from "../../../components/ui/RealTimeIndicator";
import {
  useGetUserSessionsQuery,
  useTerminateAllOtherSessionsMutation,
  useGetSettingsOverviewQuery
} from "../../../components/redux/features/api/settings/settingsApi";

interface ProfileField {
  key: string;
  label: string;
  icon: React.ReactNode;
  type: 'text' | 'email' | 'tel' | 'date' | 'url' | 'textarea';
  required?: boolean;
  placeholder: string;
  category: 'basic' | 'professional' | 'contact' | 'emergency';
  priority: 'high' | 'medium' | 'low';
}

export const EnhancedAccountTab: React.FC = () => {
  const { user, logout, isLoggingOut, logoutError } = useAuth();
  const { showToast } = useToast();

  const realTimeData = useOptimizedRealTime(['account'], 120000); // Reduced to 2 minutes to prevent form data loss

  // State management - moved before API queries to avoid reference errors
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showSignoutModal, setShowSignoutModal] = useState(false);
  const [activeSection, setActiveSection] = useState<'overview' | 'profile' | 'security'>('overview');
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
  const [imageError, setImageError] = useState(false);

  // API queries - using userApi for user-related operations
  // Only enable polling when actively editing to prevent unnecessary sidebar re-renders
  const { data: enhancedProfile, isLoading: profileLoading, refetch: refetchProfile } = useGetEnhancedUserProfileQuery(undefined, {
    // Only poll when user is actively editing to get fresh data
    pollingInterval: isEditingProfile ? 60000 : 0, // Poll every minute only when editing
    refetchOnFocus: false, // Disabled to prevent data loss
    refetchOnReconnect: true,
  });
  const [uploadProfilePicture, { isLoading: isUploading }] = useUploadProfilePictureMutation();
  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateUserProfileMutation();
  
  // Settings-related queries
  const { data: userSessions, isLoading: sessionsLoading } = useGetUserSessionsQuery();
  const { data: settingsOverview, isLoading: overviewLoading } = useGetSettingsOverviewQuery();
  const [terminateAllOthers, { isLoading: isTerminatingAll }] = useTerminateAllOtherSessionsMutation();
  
  // Auto-save state
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveTimeoutId, setAutoSaveTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Form data for editable fields only - ensure all fields are present
  const [profileData, setProfileData] = useState({
    company: '',
    job_title: '',
    department: '',
    bio: '',
    phone_secondary: '',
    address: '',
    linkedin_url: '',
    portfolio_url: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    date_of_birth: '',
  });

  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  // Sync profile data when loaded - only when NOT editing AND no unsaved changes to prevent data loss
  useEffect(() => {
    if (enhancedProfile && !isEditingProfile && !hasUnsavedChanges) {
      const newProfileData = {
        company: enhancedProfile.company || '',
        job_title: enhancedProfile.job_title || '',
        department: enhancedProfile.department || '',
        bio: enhancedProfile.bio || '',
        phone_secondary: enhancedProfile.phone_secondary || '',
        address: enhancedProfile.address || '',
        linkedin_url: enhancedProfile.linkedin_url || '',
        portfolio_url: enhancedProfile.portfolio_url || '',
        emergency_contact_name: enhancedProfile.emergency_contact_name || '',
        emergency_contact_phone: enhancedProfile.emergency_contact_phone || '',
        date_of_birth: enhancedProfile.date_of_birth || '',
      };
      
      // Only update if data actually changed to prevent unnecessary re-renders
      const hasChanged = Object.keys(newProfileData).some(
        key => newProfileData[key as keyof typeof newProfileData] !== profileData[key as keyof typeof profileData]
      );
      
      if (hasChanged) {
        setProfileData(newProfileData);
      }
    }
  }, [enhancedProfile, isEditingProfile, hasUnsavedChanges]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutId) {
        clearTimeout(autoSaveTimeoutId);
      }
    };
  }, [autoSaveTimeoutId]);

  // Helper function for safe date formatting
  const formatDate = (dateString: string | null | undefined, fallback: string = '') => {
    if (!dateString) return fallback;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return fallback;
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return fallback;
    }
  };

  const formatDateTime = (dateString: string | null | undefined, fallback: string = 'Never') => {
    if (!dateString) return fallback;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return fallback;
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch {
      return fallback;
    }
  };


  // READ-ONLY field definitions (cannot be edited for security)
  const readOnlyFields = [
    { key: 'first_name', label: 'First Name', icon: <FiUser className="h-4 w-4" />, value: user?.first_name || '', category: 'identity', description: 'Legal first name - cannot be modified' },
    { key: 'last_name', label: 'Last Name', icon: <FiUser className="h-4 w-4" />, value: user?.last_name || '', category: 'identity', description: 'Legal last name - cannot be modified' },
    { key: 'email', label: 'Email Address', icon: <FiMail className="h-4 w-4" />, value: user?.email || '', category: 'identity', description: 'Primary email - contact support to change' },
    { key: 'phone_number', label: 'Primary Phone', icon: <FiPhone className="h-4 w-4" />, value: user?.phone_number || '', category: 'identity', description: 'Verified phone number - contact support to change' },
    { key: 'ghana_card_number', label: 'Ghana Card Number', icon: <FiShield className="h-4 w-4" />, value: user?.ghana_card_number ? `GHA-****-****-${user.ghana_card_number.slice(-4)}` : 'Not provided', category: 'identity', description: 'Government ID - cannot be modified' },
    { key: 'user_type', label: 'Account Type', icon: <FiShield className="h-4 w-4" />, value: user?.user_type?.replace('_', ' ').toUpperCase() || '', category: 'identity', description: 'Account classification - managed by admin' },
    { key: 'date_joined', label: 'Account Created', icon: <FiCalendar className="h-4 w-4" />, value: formatDate(enhancedProfile?.date_joined || user?.date_joined), category: 'identity', description: 'Account creation date - system generated' },
    { key: 'last_login', label: 'Last Login', icon: <FiActivity className="h-4 w-4" />, value: formatDateTime(enhancedProfile?.last_login || user?.last_login), category: 'identity', description: 'Last successful login - system tracked' },
  ];

  const profileFields: ProfileField[] = [
    // Critical fields for credit assessment (Priority: HIGH)
    { key: 'company', label: 'Company', icon: <FiHome className="h-4 w-4" />, type: 'text', required: true, placeholder: 'Enter your company name', category: 'professional', priority: 'high' },
    { key: 'job_title', label: 'Job Title', icon: <FiBriefcase className="h-4 w-4" />, type: 'text', required: true, placeholder: 'Enter your job title', category: 'professional', priority: 'high' },
    { key: 'address', label: 'Complete Address', icon: <FiMapPin className="h-4 w-4" />, type: 'textarea', placeholder: 'Enter your complete residential address', category: 'contact', priority: 'high' },
    { key: 'date_of_birth', label: 'Date of Birth', icon: <FiCalendar className="h-4 w-4" />, type: 'date', placeholder: 'Select your date of birth', category: 'basic', priority: 'high' },

    // Important fields for credit assessment (Priority: MEDIUM)
    { key: 'department', label: 'Department', icon: <FiBriefcase className="h-4 w-4" />, type: 'text', placeholder: 'Enter your department', category: 'professional', priority: 'medium' },
    { key: 'bio', label: 'Professional Background', icon: <FiEdit3 className="h-4 w-4" />, type: 'textarea', placeholder: 'Describe your professional background and experience...', category: 'basic', priority: 'medium' },
    { key: 'phone_secondary', label: 'Secondary Phone', icon: <FiPhone className="h-4 w-4" />, type: 'tel', placeholder: 'Enter secondary phone number', category: 'contact', priority: 'medium' },
    { key: 'emergency_contact_name', label: 'Emergency Contact Name', icon: <FiUser className="h-4 w-4" />, type: 'text', placeholder: 'Enter emergency contact name', category: 'emergency', priority: 'medium' },
    { key: 'emergency_contact_phone', label: 'Emergency Contact Phone', icon: <FiPhone className="h-4 w-4" />, type: 'tel', placeholder: 'Enter emergency contact phone', category: 'emergency', priority: 'medium' },

    // Additional professional information (Priority: LOW)
    { key: 'linkedin_url', label: 'LinkedIn Profile', icon: <FiLink className="h-4 w-4" />, type: 'url', placeholder: 'https://linkedin.com/in/yourprofile', category: 'contact', priority: 'low' },
    { key: 'portfolio_url', label: 'Professional Website', icon: <FiLink className="h-4 w-4" />, type: 'url', placeholder: 'https://yourwebsite.com', category: 'contact', priority: 'low' },
  ];

  // Get priority indicator styles
  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10 pl-4';
      case 'medium':
        return 'border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-900/10 pl-4';
      case 'low':
        return 'border-l-4 border-green-500 bg-green-50 dark:bg-green-900/10 pl-4';
      default:
        return '';
    }
  };
  
  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return <span className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20 px-2 py-1 rounded-full ml-2">Critical</span>;
      case 'medium':
        return <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/20 px-2 py-1 rounded-full ml-2">Important</span>;
      case 'low':
        return <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded-full ml-2">Optional</span>;
      default:
        return null;
    }
  };

  // URL validation helper
  const isValidURL = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  // Auto-save handler
  const handleAutoSave = async () => {
    try {
      setIsAutoSaving(true);
      
      // Only save if there are no validation errors
      const hasErrors = Object.values(fieldErrors).some(error => error !== '');
      if (hasErrors) {
        return;
      }
      
      await updateProfile(profileData).unwrap();
      setLastSaved(new Date());
      setHasUnsavedChanges(false); // Clear unsaved changes flag
      
      showToast('Changes saved automatically', {
        duration: 2000,
        type: 'success'
      });
      
    } catch (error: any) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsAutoSaving(false);
    }
  };

  // Form field change handler with validation
  const handleChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Mark as having unsaved changes
    setHasUnsavedChanges(true);

    // Real-time validation
    const errors: { [key: string]: string } = {};
    
    // Field-specific validation
    switch (field) {
      case 'linkedin_url':
        if (value && !isValidURL(value)) {
          errors[field] = 'Please enter a valid URL';
        } else if (value && !value.includes('linkedin.com')) {
          errors[field] = 'Please enter a valid LinkedIn URL';
        }
        break;
      
      case 'portfolio_url':
        if (value && !isValidURL(value)) {
          errors[field] = 'Please enter a valid website URL';
        }
        break;
      
      case 'emergency_contact_name':
        if (profileData.emergency_contact_phone && !value.trim()) {
          errors[field] = 'Name is required when phone is provided';
        }
        break;
      
      case 'emergency_contact_phone':
        if (profileData.emergency_contact_name && !value.trim()) {
          errors[field] = 'Phone is required when name is provided';
        }
        break;
    }
    
    // Update field errors
    setFieldErrors(prev => ({
      ...prev,
      [field]: errors[field] || ''
    }));
    
    // Auto-save after 2 seconds of inactivity
    if (autoSaveTimeoutId) {
      clearTimeout(autoSaveTimeoutId);
    }
    
    const timeoutId = setTimeout(() => {
      if (!errors[field] && value.trim()) {
        handleAutoSave();
      }
    }, 2000);
    
    setAutoSaveTimeoutId(timeoutId);
  };

  const handleProfileSave = async () => {
    try {
      await updateProfile(profileData).unwrap();
      showToast('Profile updated successfully!', 'success');
      setHasUnsavedChanges(false); // Clear unsaved changes flag
      setIsEditingProfile(false);
      refetchProfile();
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      
      // Handle backend validation errors
      if (error?.data?.errors) {
        const backendErrors: { [key: string]: string } = {};
        Object.keys(error.data.errors).forEach(field => {
          if (Array.isArray(error.data.errors[field])) {
            backendErrors[field] = error.data.errors[field][0];
          } else {
            backendErrors[field] = error.data.errors[field];
          }
        });
        setFieldErrors(backendErrors);
        
        showToast('Please fix the form errors and try again', 'error');
      } else if (error?.data?.detail) {
        showToast(error.data.detail, 'error');
      } else {
        showToast('Failed to update profile. Please try again.', 'error');
      }
    }
  };

  const handleLogout = async () => {
    setShowSignoutModal(false);
    await logout();
    showToast("You have been logged out successfully", "success");
  };

  const handleTerminateAllSessions = async () => {
    try {
      const result = await terminateAllOthers().unwrap();
      showToast(result.message, 'success');
    } catch (error) {
      showToast('Failed to terminate sessions', 'error');
    }
  };

  const getLastActivity = () => {
    if (userSessions && userSessions.length > 0) {
      const currentSession = userSessions.find(session => session.is_current_session);
      return currentSession?.time_since_login || '2 minutes ago';
    }
    return '2 minutes ago';
  };

  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return user.name
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getProfilePictureUrl = () => {
    if (user?.profile_picture_url) return user.profile_picture_url;
    if (user?.profile_picture) {
      if (user.profile_picture.startsWith('http')) return user.profile_picture;
      return user.profile_picture;
    }
    return null;
  };

  const shouldShowProfilePicture = () => {
    const profileUrl = getProfilePictureUrl();
    return profileUrl && !imageError;
  };

  const completionScore = enhancedProfile?.completion_score || 0;
  const missingFields = enhancedProfile?.missing_fields || [];
  const requiredMissing = missingFields.filter(field => field.required).length;

  // Handle profile picture upload with enhanced validation
  const handleProfilePictureUpload = async (file: File) => {
    // Enhanced file validation for industry-grade security
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      showToast('Please select a valid image file (JPEG, PNG, or WebP)', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size must be less than 5MB', 'error');
      return;
    }

    // Additional security checks
    if (file.name.length > 100) {
      showToast('File name is too long', 'error');
      return;
    }

    try {
      console.log('Uploading profile picture:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      const formData = new FormData();
      formData.append('profile_picture', file);

      const result = await uploadProfilePicture(formData).unwrap();
      console.log('Upload result:', result);

      setImageError(false);
      await refetchProfile();
      showToast('Profile picture updated successfully!', 'success');

    } catch (error: any) {
      console.error('Upload error:', error);
      
      // Enhanced error handling
      let errorMessage = 'Failed to upload profile picture';
      
      if (error?.data?.detail) {
        errorMessage = error.data.detail;
      } else if (error?.data?.profile_picture) {
        errorMessage = Array.isArray(error.data.profile_picture) 
          ? error.data.profile_picture[0] 
          : error.data.profile_picture;
      } else if (error?.status === 413) {
        errorMessage = 'File is too large. Please choose a smaller image.';
      } else if (error?.status === 415) {
        errorMessage = 'Unsupported file type. Please use JPEG, PNG, or WebP.';
      }
      
      showToast(errorMessage, 'error');
    }
  };

  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center h-64"
      >
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Please log in to view your account
          </p>
        </div>
      </motion.div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        duration: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 200
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Real-time Status Indicator */}
      <div className="flex justify-end mb-4">
        <RealTimeIndicator
          position="inline"
          showDetails={true}
          onRefresh={realTimeData.refreshAll}
        />
      </div>
      {/* Profile Header */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden bg-gradient-to-br from-white/95 via-indigo-50/30 to-purple-50/40 dark:from-gray-800/95 dark:via-indigo-900/20 dark:to-purple-900/20 backdrop-blur-3xl rounded-3xl shadow-2xl border border-white/40 dark:border-gray-700/40"
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-2xl"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          <motion.div
            className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-tr from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [360, 180, 0]
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </div>

        <div className="relative z-10 p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-8">
              {/* Professional Profile Picture */}
              <motion.div
                className="relative group"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", damping: 20 }}
              >
                {/* Main Profile Picture Container */}
                <motion.div
                  className="relative w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center shadow-2xl ring-4 ring-white/40 dark:ring-gray-800/40 overflow-hidden"
                  whileHover={{
                    boxShadow: "0 25px 50px -12px rgba(99, 102, 241, 0.4)",
                    y: -2,
                    scale: 1.05
                  }}
                  transition={{ type: "spring", damping: 15 }}
                >
                  {/* Profile Picture or Initials */}
                  {shouldShowProfilePicture() ? (
                    <>
                      {/* Profile Image */}
                      <motion.img
                        src={getProfilePictureUrl()!}
                        alt={`${user.name || 'User'}'s profile`}
                        className="w-full h-full object-cover rounded-full relative z-10"
                        onError={() => setImageError(true)}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                      />
                      {/* Subtle Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-black/15 rounded-full z-20"></div>

                      {/* Hover Overlay */}
                      <motion.div
                        className="absolute inset-0 bg-black/30 rounded-full z-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                      >
                        <FiCamera className="h-6 w-6 text-white" />
                      </motion.div>
                    </>
                  ) : (
                    <>
                      {/* Gradient Background for Initials */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-full"></div>

                      {/* User Initials */}
                      <motion.span
                        className="text-4xl font-bold text-white relative z-10 tracking-wide"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", damping: 15 }}
                      >
                        {getUserInitials()}
                      </motion.span>

                      {/* Animated Glow Effect */}
                      <motion.div
                        className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-400/20 to-purple-400/20"
                        animate={{
                          scale: [1, 1.1, 1],
                          opacity: [0.2, 0.4, 0.2]
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    </>
                  )}

                  {/* Professional Border Ring */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-white/20 dark:border-gray-700/30"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  />
                </motion.div>

                {/* Upload Button */}
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 15 }}
                  whileTap={{ scale: 0.9 }}
                  disabled={isUploading}
                  className={`absolute -bottom-2 -right-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 p-3 rounded-2xl shadow-2xl border-3 border-white dark:border-gray-800 group-hover:shadow-indigo-500/50 transition-all duration-300 z-50 ${isUploading ? 'opacity-75 cursor-not-allowed' : ''}`}
                  title={isUploading ? "Uploading..." : "Upload new profile picture"}
                  onClick={() => {
                    if (isUploading) return;

                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {

                        handleProfilePictureUpload(file);
                      }
                    };
                    input.click();
                  }}
                >
                  <motion.div
                    animate={isUploading ? { rotate: 360 } : { rotate: [0, 10, -10, 0] }}
                    transition={isUploading ? { duration: 1, repeat: Infinity, ease: "linear" } : { duration: 0.5, repeat: 0 }}
                  >
                    <FiCamera className="h-4 w-4 text-white" />
                  </motion.div>
                </motion.button>

                {/* Online Status Indicator */}
                <motion.div
                  className="absolute -top-1 -right-1 w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-3 border-white dark:border-gray-800 shadow-lg flex items-center justify-center z-50"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <motion.div
                    className="w-3 h-3 bg-white rounded-full shadow-inner"
                    animate={{ scale: [1, 0.8, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </motion.div>

                {/* Professional Badge */}
                {enhancedProfile?.job_title && (
                  <motion.div
                    className="absolute -bottom-1 -left-1 bg-gradient-to-r from-amber-500 to-orange-500 p-1.5 rounded-xl shadow-lg border-2 border-white dark:border-gray-800 z-50"
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.5, type: "spring", damping: 15 }}
                    title={`${enhancedProfile.job_title} at ${enhancedProfile.company || 'Company'}`}
                  >
                    <FiAward className="h-3 w-3 text-white" />
                  </motion.div>
                )}

                {/* Hover Tooltip */}
                <AnimatePresence>
                  <motion.div
                    className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                  >
                    Click to update profile picture
                  </motion.div>
                </AnimatePresence>
              </motion.div>

              {/* Enhanced User Info */}
              <div className="space-y-4">
                <div>
                  <motion.h3
                    className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent mb-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {user.name || 'User'}
                  </motion.h3>

                  <div className="flex flex-wrap items-center gap-4">
                    <motion.div
                      className="flex items-center text-gray-600 dark:text-gray-400"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="p-2 bg-indigo-100/50 dark:bg-indigo-900/30 rounded-xl mr-3">
                        <FiMail className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <span className="font-medium">{user.email}</span>
                    </motion.div>

                    {enhancedProfile?.job_title && (
                      <motion.div
                        className="flex items-center"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <div className="p-2 bg-purple-100/50 dark:bg-purple-900/30 rounded-xl mr-3">
                          <FiBriefcase className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="px-4 py-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-800 dark:text-indigo-300 rounded-2xl text-sm font-semibold border border-indigo-200 dark:border-indigo-800">
                          {enhancedProfile.job_title}
                        </span>
                      </motion.div>
                    )}

                  </div>
                </div>

                {/* Activity & Stats Row */}
                <motion.div
                  className="flex flex-wrap items-center gap-3 sm:gap-4 md:gap-6 pt-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex items-center space-x-2 text-sm whitespace-nowrap">
                    <motion.div
                      className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="text-gray-600 dark:text-gray-400 truncate">Last active: {getLastActivity()}</span>
                  </div>

                  <div className="flex items-center space-x-2 whitespace-nowrap">
                    <FiTrendingUp className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-green-600 dark:text-green-400 font-semibold">
                      Profile {completionScore}% complete
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 whitespace-nowrap">
                    <FiActivity className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                      {userSessions?.length || 0} active session{(userSessions?.length || 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Actions */}
            <motion.div
              className="flex flex-col space-y-4 mt-6 lg:mt-0 lg:items-end"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                <motion.button
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="group flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 backdrop-blur-2xl border border-indigo-200/50 dark:border-indigo-700/50 rounded-2xl text-indigo-700 dark:text-indigo-300 hover:from-indigo-500/20 hover:to-purple-500/20 transition-all duration-300 font-semibold shadow-xl hover:shadow-2xl hover:shadow-indigo-500/20"
                >
                  <div className="p-1.5 bg-indigo-500/20 rounded-lg group-hover:bg-indigo-500/30 transition-colors">
                    <FiEdit3 className="h-4 w-4" />
                  </div>
                  <span>Edit Profile</span>
                  <motion.div
                    className="w-1 h-1 bg-indigo-500 rounded-full"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.button>

                <motion.button
                  onClick={() => setShowSignoutModal(true)}
                  disabled={isLoggingOut}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="group flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-red-400 disabled:to-red-500 text-white rounded-2xl font-semibold shadow-2xl hover:shadow-3xl hover:shadow-red-500/30 transition-all duration-300 disabled:cursor-not-allowed"
                >
                  <div className="p-1.5 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                    {isLoggingOut ? (
                      <motion.div
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    ) : (
                      <FiLogOut className="h-4 w-4" />
                    )}
                  </div>
                  <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
                </motion.button>
              </div>

              {/* Profile Completeness Bar */}
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '100%', opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="w-full max-w-xs bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner"
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completionScore}%` }}
                  transition={{ delay: 1, duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full relative overflow-hidden"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-white/30 via-white/10 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                </motion.div>
              </motion.div>
            </motion.div>
          </div>

          {logoutError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-2xl"
            >
              <p className="text-red-800 dark:text-red-300 text-sm font-medium">
                {logoutError}
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Profile Insights & Analytics */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
      >
        {/* Profile Completion Insights */}
        <motion.div
          whileHover={{ scale: 1.02, y: -4 }}
          className="relative overflow-hidden bg-gradient-to-br from-white/95 via-green-50/20 to-emerald-50/20 dark:from-gray-800/95 dark:via-green-900/10 dark:to-emerald-900/10 backdrop-blur-3xl rounded-3xl shadow-2xl border border-white/40 dark:border-gray-700/40 p-6"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-green-500/10 to-transparent rounded-full blur-2xl"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl">
                <FiCheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                {completionScore}%
              </span>
            </div>

            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Profile Complete
            </h4>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {requiredMissing > 0
                ? `${requiredMissing} required fields missing`
                : 'All required fields completed'
              }
            </p>

            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                className="h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${completionScore}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </div>
          </div>
        </motion.div>

        {/* Security Score */}
        <motion.div
          whileHover={{ scale: 1.02, y: -4 }}
          className="relative overflow-hidden bg-gradient-to-br from-white/95 via-blue-50/20 to-indigo-50/20 dark:from-gray-800/95 dark:via-blue-900/10 dark:to-indigo-900/10 backdrop-blur-3xl rounded-3xl shadow-2xl border border-white/40 dark:border-gray-700/40 p-6"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full blur-2xl"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-2xl">
                <FiShield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {settingsOverview?.security_score || 0}%
              </span>
            </div>

            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Security Score
            </h4>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {settingsOverview?.mfa_enabled ? 'MFA Active' : 'Enable MFA to boost security'}
            </p>

            <div className="relative w-12 h-12 mx-auto">
              <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-gray-200 dark:text-gray-700"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <motion.path
                  className="text-blue-500"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={`${settingsOverview?.security_score || 0}, 100`}
                  initial={{ strokeDasharray: "0, 100" }}
                  animate={{ strokeDasharray: `${settingsOverview?.security_score || 0}, 100` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
            </div>
          </div>
        </motion.div>

        {/* Active Sessions */}
        <motion.div
          whileHover={{ scale: 1.02, y: -4 }}
          className="relative overflow-hidden bg-gradient-to-br from-white/95 via-purple-50/20 to-pink-50/20 dark:from-gray-800/95 dark:via-purple-900/10 dark:to-pink-900/10 backdrop-blur-3xl rounded-3xl shadow-2xl border border-white/40 dark:border-gray-700/40 p-6"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-full blur-2xl"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl">
                <FiActivity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {userSessions?.length || 0}
              </span>
            </div>

            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Active Sessions
            </h4>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Devices currently signed in
            </p>

            <motion.button
              onClick={handleTerminateAllSessions}
              disabled={isTerminatingAll || (userSessions?.length || 0) <= 1}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full px-4 py-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border border-purple-200 dark:border-purple-800 rounded-xl text-purple-700 dark:text-purple-300 font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isTerminatingAll ? 'Terminating...' : 'End All Others'}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>

      {/* Profile Edit Form */}
      <AnimatePresence>
        {isEditingProfile && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: "auto", scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative overflow-hidden bg-gradient-to-br from-white/95 via-indigo-50/20 to-purple-50/20 dark:from-gray-900/95 dark:via-indigo-900/10 dark:to-purple-900/10 backdrop-blur-3xl rounded-3xl shadow-2xl border border-white/40 dark:border-gray-700/40"
          >
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                className="absolute -top-4 -right-4 w-32 h-32 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-full blur-3xl"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              />
            </div>

            <div className="relative z-10 p-8">
              <motion.div
                className="flex items-center justify-between mb-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl">
                    <FiEdit3 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                      Edit Profile Information
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Update your professional and personal details</p>
                  </div>
                </div>

                <motion.button
                  onClick={() => setIsEditingProfile(false)}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <FiX className="h-5 w-5" />
                </motion.button>
              </motion.div>

              {/* Enhanced Missing Fields Alert */}
              {(requiredMissing > 0 || completionScore < 80) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl"
                >
                  <div className="flex items-start space-x-3">
                    <FiAlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div className="flex-1">
                      <h5 className="font-semibold text-amber-800 dark:text-amber-300 mb-2">
                        {requiredMissing > 0 ? 'Complete Critical Fields' : 'Enhance Your Profile'}
                      </h5>
                      {requiredMissing > 0 ? (
                        <p className="text-sm text-amber-600 dark:text-amber-400">
                          {requiredMissing} critical field{requiredMissing !== 1 ? 's' : ''} required for credit assessment.
                        </p>
                      ) : (
                        <p className="text-sm text-amber-600 dark:text-amber-400">
                          Complete more fields to improve your profile score ({completionScore}%).
                        </p>
                      )}
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span>Critical fields boost credit score</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                          <span>Important fields add credibility</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Optional fields for completeness</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Read-Only Identity Fields */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-red-500/10 to-orange-500/10 text-red-600 dark:text-red-400 rounded-xl">
                    <FiShield className="h-5 w-5" />
                  </div>
                  <h5 className="text-lg font-bold text-gray-900 dark:text-white">
                    Identity Information
                  </h5>
                  <span className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20 px-2 py-1 rounded-full">
                    Protected
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {readOnlyFields.map((field, fieldIndex) => (
                    <motion.div
                      key={field.key}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + fieldIndex * 0.05 }}
                      className="space-y-2 p-4 rounded-lg border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10"
                    >
                      <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        <span className="text-red-600 dark:text-red-400">{field.icon}</span>
                        <span>{field.label}</span>
                        <FiShield className="h-3 w-3 text-red-500" title="Protected field" />
                      </label>

                      <div className="relative">
                        <input
                          type="text"
                          value={field.value}
                          readOnly
                          disabled
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed font-medium"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <FiShield className="h-4 w-4 text-red-500" />
                        </div>
                      </div>

                      <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                        {field.description}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Separator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center my-8"
              >
                <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600"></div>
                <div className="px-4">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700">
                    Editable Information
                  </span>
                </div>
                <div className="flex-1 h-px bg-gradient-to-l from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600"></div>
              </motion.div>

              {/* Priority Information */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800"
              >
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-indigo-500/10 rounded-xl">
                    <FiEdit3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <h6 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-2">
                      Field Priority Guide
                    </h6>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                        <span className="text-gray-700 dark:text-gray-300">Critical - Required for credit assessment</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
                        <span className="text-gray-700 dark:text-gray-300">Important - Enhances profile completeness</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                        <span className="text-gray-700 dark:text-gray-300">Optional - Additional professional information</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Editable Form Fields by Category */}
              <div className="space-y-8" data-form-section>
                {['professional', 'contact', 'basic', 'emergency'].map((category, categoryIndex) => {
                  const categoryFields = profileFields.filter(field => field.category === category);
                  if (categoryFields.length === 0) return null;

                  const categoryTitles = {
                    professional: 'Professional Information (Editable)',
                    contact: 'Contact Details (Editable)',
                    basic: 'Personal Information (Editable)',
                    emergency: 'Emergency Contact (Editable)'
                  };

                  const categoryIcons = {
                    professional: <FiBriefcase className="h-5 w-5" />,
                    contact: <FiPhone className="h-5 w-5" />,
                    basic: <FiUser className="h-5 w-5" />,
                    emergency: <FiShield className="h-5 w-5" />
                  };

                  const categoryColors = {
                    professional: 'from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400',
                    contact: 'from-green-500/10 to-emerald-500/10 text-green-600 dark:text-green-400',
                    basic: 'from-purple-500/10 to-pink-500/10 text-purple-600 dark:text-purple-400',
                    emergency: 'from-red-500/10 to-orange-500/10 text-red-600 dark:text-red-400'
                  };

                  return (
                    <motion.div
                      key={category}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + categoryIndex * 0.1 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 bg-gradient-to-r ${categoryColors[category]} rounded-xl`}>
                          {categoryIcons[category]}
                        </div>
                        <h5 className="text-lg font-bold text-gray-900 dark:text-white">
                          {categoryTitles[category]}
                        </h5>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {categoryFields.map((field, fieldIndex) => (
                          <motion.div
                            key={field.key}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + categoryIndex * 0.1 + fieldIndex * 0.05 }}
                            className={`space-y-2 p-4 rounded-lg ${getPriorityStyles(field.priority)} ${field.type === 'textarea' ? 'md:col-span-2' : ''}`}
                          >
                            <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                              <span className="text-indigo-600 dark:text-indigo-400 mr-2">{field.icon}</span>
                              <span>{field.label}</span>
                              {field.required && <span className="text-red-500 ml-1">*</span>}
                              {getPriorityLabel(field.priority)}
                            </label>

                            <div className="relative group">
                              {field.type === 'textarea' ? (
                                <textarea
                                  value={profileData[field.key] || ''}
                                  onChange={(e) => handleChange(field.key, e.target.value)}
                                  className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 dark:border-gray-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl text-gray-900 dark:text-white transition-all duration-300 placeholder-gray-500 dark:placeholder-gray-400 shadow-lg focus:shadow-xl resize-none h-24"
                                  placeholder={field.placeholder}
                                  rows={3}
                                />
                              ) : (
                                <input
                                  type={field.type}
                                  value={profileData[field.key] || ''}
                                  onChange={(e) => handleChange(field.key, e.target.value)}
                                  className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 dark:border-gray-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl text-gray-900 dark:text-white transition-all duration-300 placeholder-gray-500 dark:placeholder-gray-400 shadow-lg focus:shadow-xl group-hover:shadow-lg"
                                  placeholder={field.placeholder}
                                />
                              )}

                              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/5 to-purple-500/5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </div>
                            
                            {/* Field Error Display */}
                            {fieldErrors[field.key] && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center"
                              >
                                <FiAlertCircle className="h-4 w-4 mr-1" />
                                {fieldErrors[field.key]}
                              </motion.div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Auto-save Status Indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isAutoSaving || lastSaved ? 1 : 0 }}
                className="flex items-center justify-center mb-4 text-sm"
              >
                {isAutoSaving ? (
                  <div className="flex items-center text-amber-600 dark:text-amber-400">
                    <motion.div
                      className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full mr-2"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    Auto-saving...
                  </div>
                ) : lastSaved ? (
                  <div className="flex items-center text-emerald-600 dark:text-emerald-400">
                    <FiCheck className="w-4 h-4 mr-2" />
                    Last saved {new Date(lastSaved).toLocaleTimeString()}
                  </div>
                ) : null}
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700"
              >
                <motion.button
                  onClick={() => {
                    if (hasUnsavedChanges) {
                      if (window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
                        setHasUnsavedChanges(false);
                        setIsEditingProfile(false);
                      }
                    } else {
                      setIsEditingProfile(false);
                    }
                  }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-3 px-8 py-4 rounded-2xl border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-300 font-semibold shadow-xl hover:shadow-2xl backdrop-blur-xl"
                >
                  <FiX className="h-4 w-4" />
                  <span>Cancel</span>
                </motion.button>

                <motion.button
                  onClick={handleProfileSave}
                  disabled={isUpdatingProfile || isAutoSaving || Object.keys(fieldErrors).some(key => fieldErrors[key])}
                  whileHover={!isUpdatingProfile && !isAutoSaving ? { scale: 1.05, y: -2 } : {}}
                  whileTap={!isUpdatingProfile && !isAutoSaving ? { scale: 0.95 } : {}}
                  className={`group relative overflow-hidden flex items-center space-x-3 px-8 py-4 rounded-2xl font-semibold text-white transition-all duration-300 ${
                    isUpdatingProfile || isAutoSaving || Object.keys(fieldErrors).some(key => fieldErrors[key])
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl transform hover:scale-105'
                  } shadow-2xl`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>

                  {isUpdatingProfile ? (
                    <motion.div
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full relative z-10"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  ) : (
                    <FiSave className="h-4 w-4 relative z-10" />
                  )}

                  <span className="relative z-10">
                    {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                  </span>

                  <motion.div
                    className="w-1 h-1 bg-white rounded-full relative z-10"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SignoutModal
        isOpen={showSignoutModal}
        onClose={() => setShowSignoutModal(false)}
        onConfirm={handleLogout}
        showSuccessToast={(message) => showToast(message, "info")}
        variant="default"
        size="md"
        showSessionInfo={true}
      />
    </motion.div>
  );
};