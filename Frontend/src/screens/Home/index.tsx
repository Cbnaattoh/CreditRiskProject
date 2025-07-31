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
import { usePermissions, useHasPermission, useHasAnyPermission } from "../../components/utils/hooks/useRBAC";
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

  // Permission checks - must be declared before being used
  const canViewRisk = useHasAnyPermission(['risk_view', 'risk_edit']);
  const canViewUsers = useHasAnyPermission(['user_view_all', 'user_manage', 'role_view']) || isAdmin;
  const canViewReports = useHasAnyPermission(['report_view', 'report_create']);
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
        {/* RBAC Stats Cards - Admin Only */}
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

        {/* Regular Stats Cards - For non-admin users */}
        <ProtectedComponent permissions={[]} roles={[]} requireAuth={true} fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {canViewRisk && (
              <RBACStatsCard
                title="Risk Assessments"
                value="1,248"
                change="+12%"
                trend="up"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                }
                color="indigo"
              />
            )}
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
              title="My Applications"
              value="12"
              change="+1"
              trend="up"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
              color="blue"
            />
          </div>
        }>
          {/* This content shows when user is NOT admin */}
          {!isAdmin && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {canViewRisk && (
                <RBACStatsCard
                  title="Risk Assessments"
                  value="1,248"
                  change="+12%"
                  trend="up"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  }
                  color="indigo"
                />
              )}
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
                title="My Applications"
                value="12"
                change="+1"
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

        {/* RBAC Charts - Admin Only */}
        <AdminOnly>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <ChartContainer title="Role Distribution">
                <RoleDistributionChart 
                  data={rbacData?.popular_roles || []} 
                  isLoading={rbacLoading} 
                />
              </ChartContainer>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <ChartContainer title="Recent Activity (24h)">
                <PermissionUsageChart 
                  data={rbacData?.recent_activity || { assignments_24h: 0, permission_checks_24h: 0 }} 
                  isLoading={rbacLoading} 
                />
              </ChartContainer>
            </motion.div>
          </div>
        </AdminOnly>

        {/* Regular Charts - For non-admin users */}
        <StaffOnly fallback={
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <ChartContainer title="My Activity Trends">
                <ApplicationTrendChart />
              </ChartContainer>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <ChartContainer title="My Risk Portfolio">
                <RiskDistributionChart />
              </ChartContainer>
            </motion.div>
          </div>
        }>
          {!isAdmin && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <ChartContainer title="Application Trends">
                  <ApplicationTrendChart />
                </ChartContainer>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <ChartContainer title="Risk Distribution">
                  <RiskDistributionChart />
                </ChartContainer>
              </motion.div>
            </div>
          )}
        </StaffOnly>

        {/* Secondary Charts - Role-based content */}
        <ProtectedComponent permissions={['risk_view', 'report_view']} requireAll={false}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <ChartContainer title={canViewRisk ? "Approval Rate Trend" : "My Submissions"}>
                <ApprovalRateChart />
              </ChartContainer>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <ChartContainer title={canViewRisk ? "Key Risk Factors" : "Personal Analytics"}>
                <RiskFactorsRadar />
              </ChartContainer>
            </motion.div>
          </div>
        </ProtectedComponent>

        {/* Alerts and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Activity Widget - Admin Only */}
          <AdminOnly>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="lg:col-span-2"
            >
              <UserActivityWidget 
                users={canViewUsers ? (usersData?.results || []) : basicUserActivity} 
                isLoading={canViewUsers ? usersLoading : false}
                error={canViewUsers ? usersError : null}
                onViewAll={() => window.location.href = '/admin-panel'}
              />
            </motion.div>
          </AdminOnly>

          {/* Regular Activity Feed - Non-admin users */}
          <ProtectedComponent permissions={[]} roles={[]} requireAuth={true} fallback={null}>
            {!canViewUsers && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="lg:col-span-2"
              >
                <UserActivityWidget 
                  users={basicUserActivity} 
                  isLoading={false}
                  error={null}
                  onViewAll={() => window.location.href = '/home/settings'}
                />
              </motion.div>
            )}
          </ProtectedComponent>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 p-6 transition-colors duration-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {isAdmin ? 'System Alerts' : canViewRisk ? 'Risk Alerts' : 'My Alerts'}
                </h3>
                <button className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300">
                  View all
                </button>
              </div>
              <div className="space-y-5">
                {isAdmin ? (
                  <>
                    <AlertCard
                      severity="high"
                      title="Role Assignment Expiring"
                      description={`${rbacData?.summary.expiring_soon || 0} role assignments expire within 7 days`}
                      time="System notification"
                    />
                    <AlertCard
                      severity="medium"
                      title="New User Registrations"
                      description="5 new users registered in the last 24 hours"
                      time="24 hours ago"
                    />
                  </>
                ) : canViewRisk ? (
                  <>
                    <AlertCard
                      severity="high"
                      title="High-Risk Application Flagged"
                      description="Applicant John Doe exceeds risk threshold by 25%"
                      time="5 minutes ago"
                    />
                    <AlertCard
                      severity="medium"
                      title="Unusual Activity Detected"
                      description="Multiple applications from same IP address"
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
                      severity="low"
                      title="Profile Update Required"
                      description="Please update your contact information"
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