import React, { useState, useEffect } from "react";
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

const Dashboard: React.FC = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const { isAdmin, roles, permissions } = usePermissions();
  const user = useSelector(selectCurrentUser);
  const isClientUser = useIsClientUser();
  const highestRole = useHighestRole();

  // Permission checks - role-based
  const canViewRisk = useHasAnyPermission(['risk_view', 'risk_edit']);
  const canViewUsers = useHasAnyPermission(['user_view_all', 'user_manage', 'role_view']) || isAdmin;
  const canViewReports = useHasAnyPermission(['report_view', 'report_create']) && !isClientUser; // Explicitly exclude Client Users
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
    { page: 1, page_size: 5, sort_by: 'last_login' },
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
    }
  ];

  // Debug logging
  console.log('🔵 Dashboard Debug:', {
    canViewUsers,
    isAdmin,
    permissions,
    roles,
    usersData: usersData?.results?.length || 0,
    usersLoading,
    usersError,
    user: user?.email
  });

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
            {isClientUser 
              ? "Monitor your credit applications and risk assessments"
              : `${highestRole} Dashboard - Overview of system metrics and activities`
            }
          </p>
        </div>

        {/* CLIENT USER DASHBOARD */}
        {isClientUser && (
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

        {/* ANALYST/MANAGER DASHBOARD */}
        <ProtectedComponent roles={["Risk Analyst", "Compliance Auditor", "Manager"]} requireAuth={true}>
          {!isAdmin && !isClientUser && (
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
        {!isClientUser && (
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
                  <RoleDistributionChart />
                </ChartContainer>

                <ChartContainer title="Permission Usage">
                  <PermissionUsageChart />
                </ChartContainer>
              </div>
            </AdminOnly>
          </div>
        )}

        {/* Client User Charts */}
        {isClientUser && (
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Activity Widget - Admin Only */}
          <AdminOnly>
            <div className="lg:col-span-2">
              <UserActivityWidget 
                users={usersData?.results || basicUserActivity}
                isLoading={usersLoading}
                title="Recent User Activity"
              />
            </div>
          </AdminOnly>

          {/* Alerts Section - Role-based content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className={isAdmin ? "lg:col-span-1" : "lg:col-span-3"}
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {isClientUser ? "Your Notifications" : "System Alerts"}
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {isClientUser ? "Personal" : "System-wide"}
                </span>
              </div>
              <div className="space-y-4">
                {isAdmin ? (
                  <>
                    <AlertCard
                      severity="high"
                      title="System Maintenance Required"
                      description="Database backup scheduled for tonight at 2 AM"
                      time="System notification"
                    />
                    <AlertCard
                      severity="medium"
                      title="New User Registrations"
                      description="5 new users registered in the last 24 hours"
                      time="24 hours ago"
                    />
                  </>
                ) : canViewRisk && !isClientUser ? (
                  <>
                    <AlertCard
                      severity="high"
                      title="High-Risk Application Flagged"
                      description="Application exceeds risk threshold by 25%"
                      time="5 minutes ago"
                    />
                    <AlertCard
                      severity="medium"
                      title="Unusual Activity Detected"
                      description="Multiple applications from same region"
                      time="32 minutes ago"
                    />
                  </>
                ) : (
                  <>
                    <AlertCard
                      severity="medium"
                      title="Application Under Review"
                      description="Your application APP-001245 is being reviewed"
                      time="2 hours ago"
                    />
                    <AlertCard
                      severity="info"
                      title="Profile Complete"
                      description="Your profile is 100% complete - great job!"
                      time="1 day ago"
                    />
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
