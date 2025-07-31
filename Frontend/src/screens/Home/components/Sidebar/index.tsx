import React, { useState, memo, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiHome,
  FiFileText,
  FiSettings,
  FiUser,
  FiChevronLeft,
  FiMenu,
  FiSliders,
  FiShield,
  FiUsers,
  FiEye,
  FiDatabase,
} from "react-icons/fi";
import { RiUserSearchLine } from "react-icons/ri";
import { useAuth } from "../../../Authentication/Login-SignUp/components/hooks/useAuth";
import Logo from "../../../../components/utils/Logo";
import {
  ProtectedMenuItem,
  FeatureFlag,
  ProtectedComponent,
} from "../../../../components/redux/features/api/RBAC/ProtectedComponent";
import {
  usePermissions,
  useIsAdmin,
  useIsStaff,
  useCanAccessAdmin,
  checkCanAccess,
} from "../../../../components/utils/hooks/useRBAC";
import type {
  PermissionCode,
  RoleName,
} from "../../../../components/redux/features/api/RBAC/rbac";

interface NavItem {
  path: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  permissions?: PermissionCode[];
  roles?: RoleName[];
  requireAll?: boolean;
  featureFlag?: string;
}

const Sidebar: React.FC<{ isMobile: boolean }> = memo(({ isMobile }) => {
  const [isOpen, setIsOpen] = useState(!isMobile);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const { user, profileImage, userInitials, imageError, handleImageError } =
    useAuth();
  const { roles, permissions, isAuthenticated } = usePermissions();
  const isAdmin = useIsAdmin();
  const isStaff = useIsStaff();
  const canAccessAdmin = useCanAccessAdmin();

  const navItems: NavItem[] = useMemo(() => [
    {
      path: "/home",
      icon: <FiHome />,
      label: "Dashboard",
      description: "Overview & Analytics",
    },
    {
      path: "/home/customers",
      icon: <RiUserSearchLine />,
      label: "Customers",
      description: "Manage Client Base",
      permissions: ["client_view"],
      featureFlag: "client_management",
    },
    {
      path: "/home/loan-applications",
      icon: <FiFileText />,
      label: "Loan Applications",
      description: "Review Applications",
      permissions: ["risk_view"],
      featureFlag: "risk_management",
    },
    {
      path: "/home/reports",
      icon: <FiDatabase />,
      label: "Reports",
      description: "Analytics & Insights",
      permissions: ["report_view"],
      featureFlag: "reporting",
    },
    {
      path: "/home/admin",
      icon: <FiSettings />,
      label: "Admin Console",
      description: "System Management",
      permissions: ["user_view_all", "role_view", "system_settings"],
      requireAll: false,
      featureFlag: "admin_panel",
    },
    {
      path: "/home/settings",
      icon: <FiSliders />,
      label: "Account Settings",
      description: "Personal Preferences",
    },
  ], []);

  // Admin-only navigation items
  const adminNavItems: NavItem[] = useMemo(() => [
    {
      path: "/admin-panel",
      icon: <FiUsers />,
      label: "User Management",
      description: "Manage Users & Roles",
      permissions: ["user_view_all", "user_manage"],
      requireAll: false,
      featureFlag: "user_management",
    },
    {
      path: "/admin-panel?tab=roles",
      icon: <FiShield />,
      label: "Role Management", 
      description: "Configure Permissions",
      permissions: ["role_view", "role_manage"],
      requireAll: false,
      featureFlag: "role_management",
    },
    {
      path: "/admin-panel?tab=logs",
      icon: <FiEye />,
      label: "Audit Logs",
      description: "System Activity",
      permissions: ["audit_view", "security_logs_view"],
      requireAll: false,
      featureFlag: "audit_logs",
    },
  ], []);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  const SidebarProfilePicture = memo(() => {
    const getRoleColor = () => {
      if (isAdmin) return "from-red-500 to-pink-600";
      if (isStaff) return "from-blue-500 to-indigo-600";
      return "from-green-500 to-emerald-600";
    };

    const getRoleIndicator = () => {
      if (isAdmin) return "Admin";
      if (isStaff) return "Staff";
      return "User";
    };

    return (
      <div className="relative">
        <div
          className={`relative h-10 w-10 rounded-full bg-gradient-to-br ${getRoleColor()} dark:from-indigo-400 dark:to-purple-500 flex items-center justify-center overflow-hidden ring-2 ring-white/20 dark:ring-gray-700/50 shadow-lg`}
        >
          {profileImage && !imageError ? (
            <img
              src={profileImage}
              alt={user.name}
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
          ) : (
            <span className="text-white text-sm font-semibold">
              {userInitials || <FiUser className="text-white" />}
            </span>
          )}
        </div>
        {/* Role indicator dot */}
        <motion.span
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-gray-900 shadow-sm ${
            isAdmin ? "bg-red-500" : isStaff ? "bg-blue-500" : "bg-emerald-500"
          }`}
          title={getRoleIndicator()}
        />
      </div>
    );
  });

  SidebarProfilePicture.displayName = 'SidebarProfilePicture';

  // Component to render a navigation item with RBAC protection
  const RBACNavItem: React.FC<{
    item: NavItem;
    index: number;
    isSubItem?: boolean;
  }> = memo(({ item, index, isSubItem = false }) => {
    const isActive =
      location.pathname === item.path ||
      (item.path !== "/home" && location.pathname.startsWith(item.path));

    const canAccess = useMemo(() => {
      if (item.permissions || item.roles) {
        return checkCanAccess(permissions, roles, isAuthenticated, {
          permissions: item.permissions,
          roles: item.roles,
          requireAll: item.requireAll,
        });
      }
      return isAuthenticated;
    }, [item.permissions, item.roles, item.requireAll, permissions, roles, isAuthenticated]);

    if (!canAccess) {
      return null;
    }

    const content = (
      <motion.li
        key={item.path}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
        className={isSubItem ? "ml-4" : ""}
      >
        <Link
          to={item.path}
          className={`group flex items-center p-3 rounded-xl transition-all duration-200 relative overflow-hidden ${
            isSubItem ? "py-2 text-sm" : ""
          } ${
            isActive
              ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-[1.02]"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-indigo-600 dark:hover:text-indigo-400"
          }`}
          title={isCollapsed ? item.label : undefined}
        >
          {/* Active indicator */}
          {isActive && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl"
              initial={false}
              transition={{
                type: "spring",
                bounce: 0.2,
                duration: 0.6,
              }}
            />
          )}

          {/* Icon */}
          <span
            className={`${
              isSubItem ? "text-base" : "text-lg"
            } flex-shrink-0 z-10 transition-transform duration-200 ${
              isActive ? "scale-110" : "group-hover:scale-110"
            }`}
          >
            {item.icon}
          </span>

          {/* Label and description */}
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="ml-3 z-10"
            >
              <span
                className={`font-medium block ${
                  isSubItem ? "text-xs" : "text-sm"
                }`}
              >
                {item.label}
              </span>
              <span
                className={`opacity-70 ${isSubItem ? "text-xs" : "text-xs"} ${
                  isActive
                    ? "text-white/80"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {item.description}
              </span>
            </motion.div>
          )}

          {/* Hover effect */}
          {!isActive && (
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl" />
          )}
        </Link>
      </motion.li>
    );

    // Wrap with feature flag if specified
    return item.featureFlag ? (
      <FeatureFlag feature={item.featureFlag} fallback={null}>
        {content}
      </FeatureFlag>
    ) : (
      content
    );
  }, (prevProps, nextProps) => {
    return (
      prevProps.item.path === nextProps.item.path &&
      prevProps.index === nextProps.index &&
      prevProps.isSubItem === nextProps.isSubItem &&
      JSON.stringify(prevProps.item.permissions) === JSON.stringify(nextProps.item.permissions) &&
      JSON.stringify(prevProps.item.roles) === JSON.stringify(nextProps.item.roles)
    );
  });

  RBACNavItem.displayName = 'RBACNavItem';

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Mobile toggle button */}
      {isMobile && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 p-3 rounded-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg text-gray-700 dark:text-gray-200 shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200"
        >
          <FiMenu className="h-5 w-5" />
        </motion.button>
      )}

      {/* Overlay */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={isMobile ? { x: -300 } : { x: 0 }}
        animate={{
          x: isOpen ? 0 : -300,
          width: isCollapsed && !isMobile ? 80 : 280,
        }}
        transition={{ type: "spring", bounce: 0.1, duration: 0.5 }}
        className={`fixed lg:relative z-50 h-screen bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 shadow-2xl ${
          isMobile ? "" : "lg:translate-x-0"
        }`}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-purple-50/30 dark:from-indigo-900/20 dark:via-transparent dark:to-purple-900/10 pointer-events-none" />

        {/* Header */}
        <div className="relative p-6 flex items-center justify-between border-b border-gray-200/50 dark:border-gray-700/50">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center space-x-2"
            >
              <Logo />
              {/* Role badge */}
              {isAdmin && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                  Admin
                </span>
              )}
              {isStaff && !isAdmin && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  Staff
                </span>
              )}
            </motion.div>
          )}
          {!isMobile && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleCollapse}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm"
            >
              <FiChevronLeft
                className={`h-4 w-4 transition-transform duration-300 ${
                  isCollapsed ? "rotate-180" : ""
                }`}
              />
            </motion.button>
          )}
        </div>

        {/* Navigation */}
        <nav className="relative p-4 flex-1 overflow-y-auto">
          <ul className="space-y-2">
            {/* Main navigation items */}
            {navItems.map((item, index) => (
              <RBACNavItem key={item.path} item={item} index={index} />
            ))}

            {/* Admin section */}
            <FeatureFlag feature="admin_panel">
              <ProtectedComponent
                permissions={["user_view_all", "role_view", "system_settings"]}
                requireAll={false}
              >
                {!isCollapsed && (
                  <motion.li
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: navItems.length * 0.1 }}
                    className="pt-4"
                  >
                    <div className="px-3 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-200/30 dark:border-gray-700/30">
                      Administration
                    </div>
                  </motion.li>
                )}

                {adminNavItems.map((item, index) => (
                  <RBACNavItem
                    key={item.path}
                    item={item}
                    index={navItems.length + index + 1}
                    isSubItem={!isCollapsed}
                  />
                ))}
              </ProtectedComponent>
            </FeatureFlag>
          </ul>
        </nav>

        {/* User Profile Section */}
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative p-4 border-t border-gray-200/50 dark:border-gray-700/50"
          >
            <div className="flex items-center p-4 rounded-xl bg-gradient-to-r from-gray-50 to-indigo-50/50 dark:from-gray-800/50 dark:to-indigo-900/20 border border-gray-200/50 dark:border-gray-700/50 hover:from-indigo-50 hover:to-purple-50/50 dark:hover:from-gray-800/70 dark:hover:to-indigo-900/30 transition-all duration-200">
              <SidebarProfilePicture />
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {user.name}
                </p>
                <div className="flex items-center space-x-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {typeof user.user_type === 'string' ? user.user_type : user.user_type_display || 'USER'}
                  </p>
                  {roles.length > 0 && (
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                      • {roles.filter(role => typeof role === 'string').slice(0, 2).join(", ")}
                      {roles.filter(role => typeof role === 'string').length > 2 && ` +${roles.filter(role => typeof role === 'string').length - 2}`}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;