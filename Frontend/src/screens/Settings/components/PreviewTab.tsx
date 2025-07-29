import { motion } from "framer-motion";
import { useState, memo } from "react";
import {
  FiEdit3,
  FiMail,
  FiPhone,
  FiUser,
  FiCalendar,
  FiClock,
  FiShield,
  FiBriefcase,
  FiMapPin,
  FiGlobe,
  FiCheck,
  FiX,
  FiCamera,
} from "react-icons/fi";
import { SettingCard } from "./SettingCard";
import { useAuth } from "../../Authentication/Login-SignUp/components/hooks/useAuth";

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.2 },
};

const slideUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: "easeOut" },
};


const InfoField = memo(
  ({
    label,
    value,
    icon: Icon,
    editable = true,
    verified = false,
    placeholder = "Not set",
  }: {
    label: string;
    value: string | null | undefined;
    icon?: React.ComponentType<{ className?: string }>;
    editable?: boolean;
    verified?: boolean;
    placeholder?: string;
  }) => (
    <div className="group">
      <label className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
        {Icon && <Icon className="w-4 h-4 mr-2" />}
        {label}
        {verified && (
          <div className="ml-2 flex items-center text-emerald-500">
            <FiCheck className="w-3 h-3" />
            <span className="text-xs ml-1">Verified</span>
          </div>
        )}
      </label>
      <div className="relative">
        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50 font-medium text-gray-900 dark:text-gray-100 min-h-[44px] flex items-center">
          {value || (
            <span className="text-gray-400 dark:text-gray-500">
              {placeholder}
            </span>
          )}
        </div>
        {editable && (
          <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <FiEdit3 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
);

InfoField.displayName = "InfoField";

const StatusBadge = memo(
  ({
    status,
    variant = "default",
  }: {
    status: string;
    variant?: "default" | "success" | "warning" | "info";
  }) => {
    const variants = {
      default: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
      success:
        "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400",
      warning:
        "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400",
      info: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold ${variants[variant]}`}
      >
        {status}
      </span>
    );
  }
);

StatusBadge.displayName = "StatusBadge";

// Main component
const PreviewTabComponent = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  // Handle potential data structure variations
  const userData = user?.profile || user || {};
  const preferences = user?.preferences || {};

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Never";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return "Never";
    try {
      return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid date";
    }
  };

  const getUserTypeVariant = (userType: string | undefined) => {
    switch (userType?.toLowerCase()) {
      case "admin":
        return "warning";
      case "staff":
        return "info";
      case "client":
        return "success";
      default:
        return "default";
    }
  };

  return (
    <motion.div {...fadeIn} className="space-y-6">
      {/* Header */}
      <motion.div {...slideUp} className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            Profile Overview
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Review and manage your account information
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <StatusBadge
            status={userData.user_type || "Unknown"}
            variant={getUserTypeVariant(userData.user_type)}
          />
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors duration-200"
          >
            <FiEdit3 className="w-4 h-4 mr-2" />
            {isEditing ? "Done" : "Edit"}
          </button>
        </div>
      </motion.div>

      {/* Profile Header Card */}
      <motion.div {...slideUp} style={{ transitionDelay: "0.1s" }}>
        <SettingCard>
          <div className="flex items-start space-x-6">
            {/* Profile Picture */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                {userData.profile_picture_url ? (
                  <img
                    src={userData.profile_picture_url}
                    alt={userData.full_name || "Profile"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FiUser className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                )}
              </div>
              {isEditing && (
                <button className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <FiCamera className="w-5 h-5 text-white" />
                </button>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1 space-y-3">
              <div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                  {userData.full_name || "Name not set"}
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  {userData.email}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <FiCalendar className="w-4 h-4 mr-2" />
                  Joined {formatDate(userData.date_joined)}
                </div>
                {userData.last_login && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <FiClock className="w-4 h-4 mr-2" />
                    Last active {formatDateTime(userData.last_login)}
                  </div>
                )}
                <div className="flex items-center">
                  {userData.is_verified ? (
                    <div className="flex items-center text-emerald-600 dark:text-emerald-400 text-sm">
                      <FiShield className="w-4 h-4 mr-1" />
                      Verified Account
                    </div>
                  ) : (
                    <div className="flex items-center text-amber-600 dark:text-amber-400 text-sm">
                      <FiX className="w-4 h-4 mr-1" />
                      Unverified
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </SettingCard>
      </motion.div>

      {/* Personal Information */}
      <motion.div {...slideUp} style={{ transitionDelay: "0.2s" }}>
        <SettingCard>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <FiUser className="w-5 h-5 mr-2" />
            Personal Information
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoField
              label="First Name"
              value={userData.first_name}
              editable={isEditing}
            />
            <InfoField
              label="Last Name"
              value={userData.last_name}
              editable={isEditing}
            />
            <InfoField
              label="Bio"
              value={userData.bio}
              editable={isEditing}
              placeholder="Tell us about yourself"
            />
            <InfoField
              label="Timezone"
              value={userData.timezone}
              icon={FiGlobe}
              editable={isEditing}
            />
          </div>
        </SettingCard>
      </motion.div>

      {/* Contact Information */}
      <motion.div {...slideUp} style={{ transitionDelay: "0.3s" }}>
        <SettingCard>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <FiMail className="w-5 h-5 mr-2" />
            Contact Information
          </h4>

          <div className="space-y-6">
            <InfoField
              label="Email Address"
              value={userData.email}
              icon={FiMail}
              verified={userData.is_verified}
              editable={isEditing}
            />
            <InfoField
              label="Phone Number"
              value={userData.phone_number}
              icon={FiPhone}
              editable={isEditing}
            />
          </div>
        </SettingCard>
      </motion.div>

      {/* Professional Information */}
      <motion.div {...slideUp} style={{ transitionDelay: "0.4s" }}>
        <SettingCard>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <FiBriefcase className="w-5 h-5 mr-2" />
            Professional Information
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoField
              label="Job Title"
              value={userData.job_title}
              editable={isEditing}
              placeholder="Your role or position"
            />
            <InfoField
              label="Department"
              value={userData.department}
              editable={isEditing}
              placeholder="Department or team"
            />
            <div className="md:col-span-2">
              <InfoField
                label="Company"
                value={userData.company}
                editable={isEditing}
                placeholder="Company or organization"
              />
            </div>
          </div>
        </SettingCard>
      </motion.div>

      {/* Account Preferences */}
      <motion.div {...slideUp} style={{ transitionDelay: "0.5s" }}>
        <SettingCard>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Account Preferences
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">
                Language
              </label>
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50">
                <span className="font-medium">
                  {preferences.language === "en"
                    ? "English"
                    : preferences.language || "Not set"}
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">
                Theme
              </label>
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50">
                <span className="font-medium capitalize">
                  {preferences.theme || "System"}
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">
                Notifications
              </label>
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50">
                <StatusBadge
                  status={preferences.notifications ? "Enabled" : "Disabled"}
                  variant={preferences.notifications ? "success" : "default"}
                />
              </div>
            </div>
          </div>
        </SettingCard>
      </motion.div>

      {/* Account Status */}
      <motion.div {...slideUp} style={{ transitionDelay: "0.6s" }}>
        <SettingCard>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Account Status
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 p-4 rounded-xl border border-blue-200 dark:border-blue-800/30">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                ID: {userData.id || "N/A"}
              </div>
              <div className="text-sm text-blue-600/80 dark:text-blue-400/80">
                Account ID
              </div>
            </div>

            <div
              className={`p-4 rounded-xl border ${
                userData.is_verified
                  ? "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/10 dark:to-green-900/10 border-emerald-200 dark:border-emerald-800/30"
                  : "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border-amber-200 dark:border-amber-800/30"
              }`}
            >
              <div
                className={`text-2xl font-bold ${
                  userData.is_verified
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {userData.is_verified ? <FiCheck /> : <FiX />}
              </div>
              <div
                className={`text-sm ${
                  userData.is_verified
                    ? "text-emerald-600/80 dark:text-emerald-400/80"
                    : "text-amber-600/80 dark:text-amber-400/80"
                }`}
              >
                {userData.is_verified ? "Verified" : "Unverified"}
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 p-4 rounded-xl border border-purple-200 dark:border-purple-800/30">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {userData.user_type || "N/A"}
              </div>
              <div className="text-sm text-purple-600/80 dark:text-purple-400/80">
                Account Type
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700/50">
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {user?.syncedWithAuth ? <FiCheck /> : <FiX />}
              </div>
              <div className="text-sm text-gray-600/80 dark:text-gray-400/80">
                Sync Status
              </div>
            </div>
          </div>
        </SettingCard>
      </motion.div>

      {/* Action Buttons */}
      {isEditing && (
        <motion.div {...slideUp} style={{ transitionDelay: "0.7s" }}>
          <div className="flex justify-end space-x-4 pt-4">
            <button
              onClick={() => setIsEditing(false)}
              className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl">
              Save Changes
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

// Export the memoized component
export const PreviewTab = memo(PreviewTabComponent);
PreviewTab.displayName = "PreviewTab";
