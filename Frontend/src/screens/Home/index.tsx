import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  RiskDistributionChart,
  ApplicationTrendChart,
  RiskFactorsRadar,
  ApprovalRateChart,
  ChartContainer,
} from "./components/Charts";
import AlertCard from "./components/AlertCard";
import { useGetRBACDashboardQuery, useGetAdminUsersListQuery } from "../../components/redux/features/api/RBAC/rbacApi";
import { ProtectedComponent, AdminOnly, StaffOnly } from "../../components/redux/features/api/RBAC/ProtectedComponent";
import { usePermissions, useHasPermission, useHasAnyPermission, useIsClientUser, useHighestRole } from "../../components/utils/hooks/useRBAC";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../components/redux/features/auth/authSlice";
import { RBACStatsCard } from "./components/RBACStatsCard";
import { UserActivityWidget } from "./components/UserActivityWidget";
import { RoleDistributionChart } from "./components/RoleDistributionChart";
import { PermissionUsageChart } from "./components/PermissionUsageChart";
import { SystemAlertsWidget } from "./components/SystemAlertsWidget";

const Dashboard: React.FC = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [stableIsClientUser, setStableIsClientUser] = useState<boolean | null>(null);
  const { isAdmin, roles, permissions, isAuthenticated } = usePermissions();
  const user = useSelector(selectCurrentUser);
  const isClientUser = useIsClientUser();
  const highestRole = useHighestRole();

  // COMPREHENSIVE USER TYPE DETECTION
  const userTypeDetection = useMemo(() => {
    if (!user || !isAuthenticated) {
      return { type: 'GUEST', isAdmin: false, isClient: false, isStaff: false };
    }

    console.log('🔥 COMPREHENSIVE USER DETECTION:', {
      userObject: user,
      rolesArray: roles,
      isAdminHook: isAdmin,
      userType: user?.user_type,
      userRole: user?.role
    });

    // Admin detection - multiple ways
    const adminChecks = [
      isAdmin,
      roles?.includes('Administrator'),
      user?.user_type === 'ADMIN',
      user?.role === 'ADMIN',
      user?.user_type?.toLowerCase() === 'admin',
      user?.role?.toLowerCase() === 'admin'
    ];
    const isDefinitelyAdmin = adminChecks.some(check => check === true);

    // Client detection - multiple ways  
    const clientChecks = [
      roles?.includes('Client User'),
      user?.user_type === 'CLIENT_USER',
      user?.user_type === 'Client User',
      user?.user_type_display === 'Client User',
      user?.role === 'CLIENT',
      user?.user_type === 'CLIENT',
      user?.user_type?.toLowerCase().includes('client'),
      user?.role?.toLowerCase() === 'client'
    ];
    const isDefinitelyClient = clientChecks.some(check => check === true);

    // Staff detection
    const staffRoles = ['Risk Analyst', 'Compliance Auditor', 'Manager'];
    const isDefinitelyStaff = roles?.some(r => staffRoles.includes(r)) || false;

    const result = {
      type: isDefinitelyAdmin ? 'ADMIN' : isDefinitelyClient ? 'CLIENT' : isDefinitelyStaff ? 'STAFF' : 'USER',
      isAdmin: isDefinitelyAdmin,
      isClient: isDefinitelyClient,
      isStaff: isDefinitelyStaff,
      adminChecks,
      clientChecks
    };

    console.log('🔥 USER TYPE RESULT:', result);
    return result;
  }, [user, roles, isAdmin, isAuthenticated]);

  // Permission checks - role-based
  const canViewRisk = useHasAnyPermission(['risk_view', 'risk_edit']);
  const canViewUsers = useHasAnyPermission(['user_view_all', 'user_manage', 'role_view']) || isAdmin;
  const canViewReports = useHasAnyPermission(['report_view', 'report_create']) && !userTypeDetection.isClient; // Explicitly exclude Client Users
  const canViewCompliance = useHasPermission('compliance_view');
  
  // RBAC data fetching
  const { 
    data: rbacData, 
    isLoading: rbacLoading, 
    error: rbacError 
  } = useGetRBACDashboardQuery(undefined, {
    skip: !useHasAnyPermission(['view_dashboard', 'user_view_all'])
  });
  
  const { 
    data: usersData, 
    isLoading: usersLoading,
    error: usersError 
  } = useGetAdminUsersListQuery(
    { page: 1, page_size: 10, sort_by: 'last_login' },
    { skip: !canViewUsers }
  );


  // Create basic user activity data for non-admin users
  const basicUserActivity = canViewUsers ? [] : [
    {
      id: 1,
      email: user?.email || "current.user@example.com",
      full_name: user?.full_name || user?.name || "Current User",
      last_login: new Date().toISOString(),
      active_roles: [{ 
        name: typeof user?.user_type === 'string' 
          ? user.user_type 
          : (user?.user_type?.name || user?.user_type_display || "User"), 
        assigned_at: new Date().toISOString() 
      }],
      is_active: true,
      mfa_enabled: user?.mfa_enabled || false,
      status: "active",
    }
  ];

  // COMPREHENSIVE DEBUG LOGGING
  console.log('🔴 FULL DEBUG - Dashboard:', {
    // User object inspection
    userObject: user,
    userEmail: user?.email,
    userType: user?.user_type,
    userTypeDisplay: user?.user_type_display,
    userName: user?.name,
    userId: user?.id,
    
    // Roles array inspection
    rolesArray: roles,
    rolesLength: roles?.length,
    rolesAsString: JSON.stringify(roles),
    hasClientUserRole: roles?.includes('Client User'),
    hasClientUserRoleExact: roles?.some(r => r === 'Client User'),
    
    // Permission checks
    isAdmin,
    isAuthenticated,
    permissions: permissions?.slice(0, 5), // First 5 permissions
    
    // Hook results
    isClientUserHook: isClientUser,
    stableIsClientUser,
    
    // Computed conditions
    condition1: roles?.includes('Client User'),
    condition2: user?.user_type === 'CLIENT_USER',
    condition3: user?.user_type_display === 'Client User',
    finalClientCheck: (roles?.includes('Client User') || user?.user_type === 'CLIENT_USER' || user?.user_type_display === 'Client User'),
    
    // Authentication state
    authLoading: !user || !roles,
    canShowClientActions: !!(roles?.includes('Client User') || user?.user_type === 'CLIENT_USER' || user?.user_type_display === 'Client User'),
    
    // NEW COMPREHENSIVE CHECK
    userTypeDetection: userTypeDetection
  });

  // Stabilize client user state to prevent flickering
  useEffect(() => {
    // Initialize stable state when we have role information
    if (stableIsClientUser === null && roles.length > 0) {
      setStableIsClientUser(isClientUser);
    } else if (isClientUser && stableIsClientUser === false) {
      // If we were not client user but now we are, update
      setStableIsClientUser(true);
    } else if (!isClientUser && stableIsClientUser === true && roles.length > 0) {
      // Only change from client user to non-client if we have other roles
      const hasOtherRoles = roles.some(role => 
        ['Administrator', 'Risk Analyst', 'Compliance Auditor', 'Manager'].includes(role)
      );
      if (hasOtherRoles) {
        setStableIsClientUser(false);
      }
    }
  }, [isClientUser, roles, stableIsClientUser]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Dashboard Content */}
      <main className="overflow-y-auto p-6">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.name || user?.first_name || 'User'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {userTypeDetection.isClient
              ? "Monitor your credit applications and risk assessments"
              : `${highestRole} Dashboard - Overview of system metrics and activities`
            }
          </p>
        </div>

        {/* CLIENT USER DASHBOARD */}
        {userTypeDetection.isClient && (
          <>
            {/* Client User Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <RBACStatsCard
                title="My Applications"
                value="3"
                change="+1 this month"
                trend="up"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
                color="blue"
              />
              <RBACStatsCard
                title="Current Risk Score"
                value="742"
                change="Good standing"
                trend="stable"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                }
                color="green"
              />
              <RBACStatsCard
                title="Next Review"
                value="14 days"
                change="Upcoming"
                trend="neutral"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
                color="orange"
              />
            </div>

            {/* Client User Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">New Application</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Submit a credit application</p>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">View Risk Analysis</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Check your risk assessment</p>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800 cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">AI Explainability</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Understand your results</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </>
        )}

        {/* ADMIN DASHBOARD */}
        {userTypeDetection.isAdmin && (
          <AdminOnly>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <RBACStatsCard
              title="Total Users"
              value={rbacData?.summary.total_users || 0}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              }
              isLoading={rbacLoading}
              color="blue"
            />
            <RBACStatsCard
              title="Active Roles"
              value={rbacData?.summary.total_roles || 0}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              }
              isLoading={rbacLoading}
              color="green"
            />
            <RBACStatsCard
              title="Role Assignments"
              value={rbacData?.summary.active_assignments || 0}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
              isLoading={rbacLoading}
              color="purple"
            />
            <RBACStatsCard
              title="Expiring Soon"
              value={rbacData?.summary.expiring_soon || 0}
              change={rbacData?.summary.expired ? `+${rbacData.summary.expired}` : undefined}
              trend="up"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              isLoading={rbacLoading}
              color="yellow"
            />
          </div>
          </AdminOnly>
        )}

        {/* ANALYST/MANAGER DASHBOARD */}
        <ProtectedComponent roles={["Risk Analyst", "Compliance Auditor", "Manager"]} requireAuth={true}>
          {userTypeDetection.isStaff && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <RBACStatsCard
                title="Risk Assessments"
                value="1,248"
                change="+12%"
                trend="up"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                }
                color="indigo"
              />
              {canViewReports && (
                <RBACStatsCard
                  title="Reports Generated"
                  value="342"
                  change="+8%"
                  trend="up"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                  color="green"
                />
              )}
              {canViewCompliance && (
                <RBACStatsCard
                  title="Compliance Score"
                  value="94%"
                  change="+2%"
                  trend="up"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  color="green"
                />
              )}
              <RBACStatsCard
                title="Active Cases"
                value="87"
                change="+5"
                trend="up"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
                color="blue"
              />
            </div>
          )}
        </ProtectedComponent>

        {/* Charts and Activities Section */}
        {!userTypeDetection.isClient && (
          <div className="space-y-8 mb-8">
            {/* First Row - Main Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Risk Charts - Admin & Analysts Only */}
              <ProtectedComponent roles={["Administrator", "Risk Analyst", "Compliance Auditor", "Manager"]} requireAuth={true}>
                <ChartContainer title="Risk Distribution">
                  <RiskDistributionChart />
                </ChartContainer>
              </ProtectedComponent>

              {/* Application Trends - Admin & Analysts Only */}
              <ProtectedComponent roles={["Administrator", "Risk Analyst", "Manager"]} requireAuth={true}>
                <ChartContainer title="Application Trends">
                  <ApplicationTrendChart />
                </ChartContainer>
              </ProtectedComponent>
            </div>

            {/* Second Row - Additional Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Risk Factors Radar - Admin & Analysts Only */}
              <ProtectedComponent roles={["Administrator", "Risk Analyst", "Compliance Auditor", "Manager"]} requireAuth={true}>
                <ChartContainer title="Risk Factors Analysis">
                  <RiskFactorsRadar />
                </ChartContainer>
              </ProtectedComponent>

              {/* Approval Rate Chart - Admin & Analysts Only */}
              <ProtectedComponent roles={["Administrator", "Risk Analyst", "Manager"]} requireAuth={true}>
                <ChartContainer title="Approval Rate Trends">
                  <ApprovalRateChart />
                </ChartContainer>
              </ProtectedComponent>
            </div>

            {/* Third Row - RBAC Charts (Admin Only) */}
            <AdminOnly>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ChartContainer title="Role Distribution">
                  <RoleDistributionChart 
                    data={rbacData?.popular_roles || []}
                    isLoading={rbacLoading}
                  />
                </ChartContainer>

                <ChartContainer title="Permission Usage">
                  <PermissionUsageChart 
                    data={rbacData?.recent_activity}
                    isLoading={rbacLoading}
                  />
                </ChartContainer>
              </div>
            </AdminOnly>
          </div>
        )}

        {/* Client User Charts */}
        {userTypeDetection.isClient && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <ChartContainer title="Your Risk Profile">
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p>Your personalized risk analysis will appear here</p>
                </div>
              </div>
            </ChartContainer>

            <ChartContainer title="Application History">
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>Your application timeline will appear here</p>
                </div>
              </div>
            </ChartContainer>
          </div>
        )}

        {/* Recent Activity & Alerts */}
        <div className="space-y-8">
          {/* User Activity Widget - Admin Only - FULL WIDTH */}
          <AdminOnly>
            <UserActivityWidget 
              users={usersData?.results || (Array.isArray(usersData) ? usersData : basicUserActivity)}
              isLoading={usersLoading}
              title="Recent User Activity"
            />
          </AdminOnly>

          {/* Enhanced System Alerts Widget - FULL WIDTH */}
          <SystemAlertsWidget 
            userType={
              userTypeDetection.isAdmin ? 'admin' : 
              userTypeDetection.isStaff ? 'staff' : 
              'client'
            }
            isLoading={rbacLoading}
          />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
