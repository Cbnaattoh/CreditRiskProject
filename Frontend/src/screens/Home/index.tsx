import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  RiskDistributionChart,
  ApplicationTrendChart,
  RiskFactorsRadar,
  ApprovalRateChart,
  ChartContainer,
  CreditScoreDistributionChart,
  ComplianceViolationsTrendChart,
  SystemWideRiskDistributionChart,
  OverallApplicationTrendsChart,
  SystemWideRiskFactorsChart,
  PolicyComplianceMatrix,
  AuditCoverageAnalysis,
  ClientRiskProfileChart,
  ClientApplicationHistoryChart,
} from "./components/Charts";
// import AlertCard from "./components/AlertCard";
import { useGetRBACDashboardQuery, useGetAdminUsersListQuery } from "../../components/redux/features/api/RBAC/rbacApi";
import { useGetApplicationsQuery, useGetUserMLAssessmentSummaryQuery, useGetApplicationDashboardQuery } from "../../components/redux/features/api/applications/applicationsApi";
import { useGetRiskAnalyticsDashboardQuery } from "../../components/redux/features/api/risk/riskApi";
import { ProtectedComponent, AdminOnly, StaffOnly } from "../../components/redux/features/api/RBAC/ProtectedComponent";
import { 
  usePermissions, 
  useHasPermission, 
  useHasAnyPermission, 
  useIsClientUser, 
  useHighestRole,
  useIsAdministrator,
  useIsAnalyst,
  useIsAuditor,
  useIsManager,
  useDashboardAccess,
  useNavigationAccess
} from "../../components/utils/hooks/useRBAC";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../components/redux/features/auth/authSlice";
import { RBACStatsCard } from "./components/RBACStatsCard";
import { UserActivityWidget } from "./components/UserActivityWidget";
import { RoleDistributionChart } from "./components/RoleDistributionChart";
import { PermissionUsageChart } from "./components/PermissionUsageChart";
import { SystemAlertsWidget } from "./components/SystemAlertsWidget";
import MLCreditScoreWidget from "./components/MLCreditScoreWidget";

const Dashboard: React.FC = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [stableIsClientUser, setStableIsClientUser] = useState<boolean | null>(null);
  const { isAdmin, roles, permissions, isAuthenticated } = usePermissions();
  const user = useSelector(selectCurrentUser);
  const isClientUser = useIsClientUser();
  const highestRole = useHighestRole();
  const navigate = useNavigate();
  
  const isAdministrator = useIsAdministrator();
  const isAnalyst = useIsAnalyst();
  const isAuditor = useIsAuditor();
  const isManager = useIsManager();
  const dashboardAccess = useDashboardAccess();
  const navigationAccess = useNavigationAccess();

  const stableRoleDetection = useMemo(() => {
    if (!user || !isAuthenticated) {
      return { 
        isAdmin: false, 
        isClient: false, 
        isStaff: false, 
        isAnalyst: false,
        isAuditor: false,
        isManager: false
      };
    }

    // Admin detection
    const adminChecks = [
      isAdministrator,
      isAdmin,
      roles?.includes('Administrator'),
      user?.user_type === 'ADMIN',
      user?.role === 'ADMIN',
      user?.user_type?.toLowerCase() === 'admin',
      user?.role?.toLowerCase() === 'admin'
    ];
    const isDefinitelyAdmin = adminChecks.some(check => check === true);

    // Risk Analyst detection
    const analystChecks = [
      isAnalyst,
      roles?.includes('Risk Analyst'),
      user?.role === 'ANALYST',
      user?.role === 'Risk Analyst',
      user?.user_type === 'ANALYST'
    ];
    const isDefinitelyAnalyst = analystChecks.some(check => check === true);

    // Compliance Auditor detection
    const auditorChecks = [
      isAuditor,
      roles?.includes('Compliance Auditor'),
      user?.role === 'AUDITOR',
      user?.role === 'Compliance Auditor'
    ];
    const isDefinitelyAuditor = auditorChecks.some(check => check === true);

    // Manager detection
    const managerChecks = [
      isManager,
      roles?.includes('Manager'),
      user?.role === 'MANAGER',
      user?.role === 'Manager'
    ];
    const isDefinitelyManager = managerChecks.some(check => check === true);

    // Client detection
    const clientChecks = [
      isClientUser,
      roles?.includes('Client User'),
      user?.user_type === 'CLIENT_USER',
      user?.user_type === 'Client User',
      user?.user_type_display === 'Client User',
      user?.role === 'CLIENT'
    ];
    const isDefinitelyClient = clientChecks.some(check => check === true);

    // Staff detection (any non-client role)
    const isDefinitelyStaff = isDefinitelyAdmin || isDefinitelyAnalyst || isDefinitelyAuditor || isDefinitelyManager;

    return {
      isAdmin: isDefinitelyAdmin,
      isClient: isDefinitelyClient,
      isStaff: isDefinitelyStaff,
      isAnalyst: isDefinitelyAnalyst,
      isAuditor: isDefinitelyAuditor,
      isManager: isDefinitelyManager
    };
  }, [
    user, 
    isAuthenticated, 
    isAdministrator, 
    isAdmin, 
    isAnalyst, 
    isAuditor, 
    isManager, 
    isClientUser, 
    roles
  ]);

  // Use stable role detection for user type
  const userTypeDetection = useMemo(() => {
    return {
      type: stableRoleDetection.isAdmin ? 'ADMIN' : 
            stableRoleDetection.isClient ? 'CLIENT' : 
            stableRoleDetection.isStaff ? 'STAFF' : 'USER',
      ...stableRoleDetection
    };
  }, [stableRoleDetection]);

  // Permission checks - role-based
  const canViewRisk = useHasAnyPermission(['risk_view', 'risk_edit']);
  const canViewUsers = useHasAnyPermission(['user_view_all', 'user_manage', 'role_view']) || isAdmin;
  const canViewReports = useHasAnyPermission(['report_view', 'report_create']) && !stableRoleDetection.isClient;
  const canViewCompliance = useHasPermission('compliance_view');

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

  // Fetch user's applications
  const {
    data: applicationsData,
    isLoading: applicationsLoading,
    error: applicationsError
  } = useGetApplicationsQuery({
    page: 1,
    page_size: 100,
  });

  // Fetch user's ML assessment summary for client users
  const {
    data: mlAssessmentData,
    isLoading: mlAssessmentLoading,
    error: mlAssessmentError
  } = useGetUserMLAssessmentSummaryQuery(undefined, {
    skip: !stableRoleDetection.isClient
  });

  // Fetch risk analytics data for Risk Analysts and Auditors
  const {
    data: riskAnalyticsData,
    isLoading: riskAnalyticsLoading,
    error: riskAnalyticsError
  } = useGetRiskAnalyticsDashboardQuery(undefined, {
    skip: !stableRoleDetection.isAnalyst && !stableRoleDetection.isAuditor && !stableRoleDetection.isAdmin
  });

  // Fetch application dashboard data for Analysts and Admins
  const {
    data: applicationDashboardData,
    isLoading: applicationDashboardLoading,
    error: applicationDashboardError
  } = useGetApplicationDashboardQuery(undefined, {
    skip: !stableRoleDetection.isAnalyst && !stableRoleDetection.isAdmin
  });

  useEffect(() => {
    if (rbacError) {
      console.warn('🟡 RBAC Dashboard API failed - continuing with cached permissions:', rbacError);
    }
    if (usersError) {
      console.warn('🟡 Users List API failed - continuing with basic user data:', usersError);
    }
    if (applicationsError) {
      console.warn('🟡 Applications API failed - continuing with fallback data:', applicationsError);
    }
    if (mlAssessmentError) {
      console.warn('🟡 ML Assessment API failed - continuing with fallback data:', mlAssessmentError);
    }
    if (riskAnalyticsError) {
      console.warn('🟡 Risk Analytics API failed - continuing with fallback data:', riskAnalyticsError);
    }
  }, [rbacError, usersError, applicationsError, mlAssessmentError, riskAnalyticsError]);

  // Debug logging for applications data
  useEffect(() => {
    console.log('🔍 Applications Debug:', {
      isAuthenticated,
      hasUser: !!user,
      stableRoleDetection,
      isClientUser,
      applicationsLoading,
      applicationsData,
      applicationsError
    });
  }, [isAuthenticated, user, stableRoleDetection, isClientUser, applicationsLoading, applicationsData, applicationsError]);


  // Calculate application statistics
  const applicationStats = useMemo(() => {
    // Handle both paginated response and direct array
    const applications = applicationsData?.results || applicationsData || [];
    if (!Array.isArray(applications) && !applicationsData) {
      return {
        totalApplications: 0,
        thisMonthCount: 0,
        change: "No data",
        trend: "neutral" as const
      };
    }

    const totalCount = Array.isArray(applications) ? applications.length : (applicationsData?.count || 0);
    
    // Calculate applications from this month (only if we have an array to work with)
    let thisMonthCount = 0;
    if (Array.isArray(applications)) {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      const thisMonthApplications = applications.filter(app => {
        if (!app.submission_date && !app.last_updated) return false;
        const appDate = new Date(app.submission_date || app.last_updated);
        return appDate.getMonth() === currentMonth && appDate.getFullYear() === currentYear;
      });
      
      thisMonthCount = thisMonthApplications.length;
    }
    
    const change = thisMonthCount > 0 ? `+${thisMonthCount} this month` : totalCount > 0 ? "View all applications" : "No applications";
    const trend = thisMonthCount > 0 ? "up" as const : "neutral" as const;
    
    return {
      totalApplications: totalCount,
      thisMonthCount,
      change,
      trend
    };
  }, [applicationsData]);

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


  // Stabilize client user state to prevent flickering
  useEffect(() => {
    if (stableIsClientUser === null && roles.length > 0) {
      setStableIsClientUser(isClientUser);
    } else if (isClientUser && stableIsClientUser === false) {
      setStableIsClientUser(true);
    } else if (!isClientUser && stableIsClientUser === true && roles.length > 0) {
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
            {stableRoleDetection.isClient
              ? "Monitor your credit applications and risk assessments"
              : `${highestRole} Dashboard - Overview of system metrics and activities`
            }
          </p>
        </div>

        {/* CLIENT USER DASHBOARD */}
        {stableRoleDetection.isClient && (
          <>
            {/* Client User Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <RBACStatsCard
                title="My Applications"
                value={applicationStats.totalApplications.toString()}
                change={applicationStats.change}
                trend={applicationStats.trend}
                isLoading={applicationsLoading}
                onClick={() => navigate('/home/loan-applications')}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
                color="blue"
              />
              <RBACStatsCard
                title="Current Risk Score"
                value={mlAssessmentData?.latest_assessment?.credit_score?.toString() || "Not Available"}
                change={mlAssessmentData?.latest_assessment ? 
                  `${mlAssessmentData.latest_assessment.category} (${mlAssessmentData.latest_assessment.risk_level})` : 
                  "No assessment"
                }
                trend={mlAssessmentData?.latest_assessment?.risk_level === 'Low Risk' ? 'up' : 
                      mlAssessmentData?.latest_assessment?.risk_level === 'High Risk' ? 'down' : 'neutral'
                }
                isLoading={mlAssessmentLoading}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                }
                color={mlAssessmentData?.latest_assessment?.risk_level === 'Low Risk' ? 'green' : 
                      mlAssessmentData?.latest_assessment?.risk_level === 'High Risk' ? 'red' : 'yellow'
                }
              />
              <RBACStatsCard
                title="Model Confidence"
                value={mlAssessmentData?.latest_assessment?.confidence ? 
                  `${mlAssessmentData.latest_assessment.confidence.toFixed(2)}%` : 
                  "Not Available"
                }
                change={mlAssessmentData?.latest_assessment?.confidence ? 
                  `${mlAssessmentData.latest_assessment.confidence >= 90 ? 'High' : 
                     mlAssessmentData.latest_assessment.confidence >= 70 ? 'Good' : 'Moderate'} confidence` : 
                  "No assessment"
                }
                trend={mlAssessmentData?.latest_assessment?.confidence ? 
                  (mlAssessmentData.latest_assessment.confidence >= 80 ? 'up' : 
                   mlAssessmentData.latest_assessment.confidence >= 60 ? 'neutral' : 'down') : 'neutral'
                }
                isLoading={mlAssessmentLoading}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                color={mlAssessmentData?.latest_assessment?.confidence ? 
                  (mlAssessmentData.latest_assessment.confidence >= 80 ? 'green' : 
                   mlAssessmentData.latest_assessment.confidence >= 60 ? 'blue' : 'yellow') : 'gray'
                }
              />
            </div>

            {/* Client User Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 cursor-pointer"
                  onClick={() => navigate('/home/loan-applications')}
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
                  onClick={() => navigate('/home/risk-analysis')}
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
                  onClick={() => navigate('/home/explainability')}
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
        {stableRoleDetection.isAdmin && (
          <AdminOnly>
            {/* ML Model Status for Admins */}
            <div className="mb-6">
              <MLCreditScoreWidget userType="admin" />
            </div>

            
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

        {/* ROLE-SPECIFIC DASHBOARDS */}
        
        {/* RISK ANALYSIS DASHBOARD - Risk Analysts and Admins */}
        {(stableRoleDetection.isAnalyst || stableRoleDetection.isAdmin) && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Risk Analysis Dashboard
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <RBACStatsCard
                  title="Risk Assessments"
                  value={riskAnalyticsData?.risk_analyst.risk_assessments.count.toString() || "0"}
                  change={riskAnalyticsData ? 
                    `${riskAnalyticsData.risk_analyst.risk_assessments.change_percentage >= 0 ? '+' : ''}${riskAnalyticsData.risk_analyst.risk_assessments.change_percentage}%` : 
                    "Loading..."
                  }
                  trend={riskAnalyticsData?.risk_analyst.risk_assessments.trend || "neutral"}
                  isLoading={riskAnalyticsLoading}
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  }
                  color="blue"
                />
                <RBACStatsCard
                  title="High Risk Cases"
                  value={riskAnalyticsData?.risk_analyst.high_risk_cases.count.toString() || "0"}
                  change={riskAnalyticsData ? 
                    `${riskAnalyticsData.risk_analyst.high_risk_cases.change_percentage >= 0 ? '+' : ''}${riskAnalyticsData.risk_analyst.high_risk_cases.change_percentage}%` : 
                    "Loading..."
                  }
                  trend={riskAnalyticsData?.risk_analyst.high_risk_cases.trend || "neutral"}
                  isLoading={riskAnalyticsLoading}
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  }
                  color="red"
                />
                <RBACStatsCard
                  title="Model Accuracy"
                  value={riskAnalyticsData ? `${riskAnalyticsData.risk_analyst.model_accuracy.percentage}%` : "0%"}
                  change={riskAnalyticsData ? 
                    `${riskAnalyticsData.risk_analyst.model_accuracy.change_percentage >= 0 ? '+' : ''}${riskAnalyticsData.risk_analyst.model_accuracy.change_percentage}%` : 
                    "Loading..."
                  }
                  trend={riskAnalyticsData?.risk_analyst.model_accuracy.trend || "neutral"}
                  isLoading={riskAnalyticsLoading}
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  color="green"
                />
                <RBACStatsCard
                  title="Pending Reviews"
                  value={applicationDashboardData ? 
                    applicationDashboardData.stats.pending_review.toString() : 
                    riskAnalyticsData?.risk_analyst.pending_reviews.count.toString() || "0"
                  }
                  change={applicationDashboardData ? 
                    `${applicationDashboardData.stats.under_review} in progress` :
                    riskAnalyticsData ? 
                      `${riskAnalyticsData.risk_analyst.pending_reviews.change >= 0 ? '+' : ''}${riskAnalyticsData.risk_analyst.pending_reviews.change}` : 
                      "Loading..."
                  }
                  trend={applicationDashboardData ? 
                    (applicationDashboardData.stats.pending_review > 0 ? 'up' : 'neutral') :
                    riskAnalyticsData?.risk_analyst.pending_reviews.trend || "neutral"
                  }
                  isLoading={riskAnalyticsLoading || applicationDashboardLoading}
                  onClick={() => navigate('/home/loan-applications?filter=pending-review')}
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  color="yellow"
                />
              </div>
            </div>
        )}

        {/* COMPLIANCE & AUDIT DASHBOARD - Compliance Auditors and Admins */}
        {(stableRoleDetection.isAuditor || stableRoleDetection.isAdmin) && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Compliance & Audit Dashboard
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <RBACStatsCard
                  title="Compliance Score"
                  value={riskAnalyticsData ? `${riskAnalyticsData.compliance_auditor.compliance_score.percentage}%` : "0%"}
                  change={riskAnalyticsData ? 
                    `${riskAnalyticsData.compliance_auditor.compliance_score.change_percentage >= 0 ? '+' : ''}${riskAnalyticsData.compliance_auditor.compliance_score.change_percentage}%` : 
                    "Loading..."
                  }
                  trend={riskAnalyticsData?.compliance_auditor.compliance_score.trend || "neutral"}
                  isLoading={riskAnalyticsLoading}
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  color="green"
                />
                <RBACStatsCard
                  title="Audit Findings"
                  value={riskAnalyticsData?.compliance_auditor.audit_findings.count.toString() || "0"}
                  change={riskAnalyticsData ? 
                    `${riskAnalyticsData.compliance_auditor.audit_findings.change_percentage >= 0 ? '+' : ''}${riskAnalyticsData.compliance_auditor.audit_findings.change_percentage}%` : 
                    "Loading..."
                  }
                  trend={riskAnalyticsData?.compliance_auditor.audit_findings.trend || "neutral"}
                  isLoading={riskAnalyticsLoading}
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  color="orange"
                />
                <RBACStatsCard
                  title="Policy Violations"
                  value={riskAnalyticsData?.compliance_auditor.policy_violations.count.toString() || "0"}
                  change={riskAnalyticsData ? 
                    `${riskAnalyticsData.compliance_auditor.policy_violations.change_percentage >= 0 ? '+' : ''}${riskAnalyticsData.compliance_auditor.policy_violations.change_percentage}%` : 
                    "Loading..."
                  }
                  trend={riskAnalyticsData?.compliance_auditor.policy_violations.trend || "neutral"}
                  isLoading={riskAnalyticsLoading}
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  }
                  color="red"
                />
                <RBACStatsCard
                  title="Regulatory Reports"
                  value={riskAnalyticsData?.compliance_auditor.regulatory_reports.count.toString() || "0"}
                  change={riskAnalyticsData ? 
                    `${riskAnalyticsData.compliance_auditor.regulatory_reports.change >= 0 ? '+' : ''}${riskAnalyticsData.compliance_auditor.regulatory_reports.change}` : 
                    "Loading..."
                  }
                  trend={riskAnalyticsData?.compliance_auditor.regulatory_reports.trend || "neutral"}
                  isLoading={riskAnalyticsLoading}
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                  color="blue"
                />
              </div>
            </div>
        )}

        {/* MANAGEMENT DASHBOARD - Managers and Admins */}
        {(stableRoleDetection.isManager || stableRoleDetection.isAdmin) && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Management Dashboard
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <RBACStatsCard
                  title="Team Performance"
                  value="91.4%"
                  change="+5.2%"
                  trend="up"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  }
                  color="green"
                />
                <RBACStatsCard
                  title="Active Projects"
                  value="14"
                  change="+3"
                  trend="up"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  }
                  color="blue"
                />
                <RBACStatsCard
                  title="Resource Utilization"
                  value="87%"
                  change="+12%"
                  trend="up"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  }
                  color="purple"
                />
                <RBACStatsCard
                  title="Pending Approvals"
                  value="28"
                  change="+7"
                  trend="up"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  color="yellow"
                />
              </div>
            </div>
        )}

        {/* CHARTS SECTION FOR STAFF USERS (NON-CLIENT) */}
        {(stableRoleDetection.isAdmin || stableRoleDetection.isAnalyst || stableRoleDetection.isAuditor || stableRoleDetection.isManager) && (
            <div className="space-y-8 mb-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ChartContainer title="Risk Model Performance">
                  <RiskDistributionChart />
                </ChartContainer>
                <ChartContainer title="Credit Score Distribution">
                  <CreditScoreDistributionChart />
                </ChartContainer>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ChartContainer title="Risk Factors Radar Analysis">
                  <RiskFactorsRadar />
                </ChartContainer>
                <ChartContainer title="Compliance Violations Trend">
                  <ComplianceViolationsTrendChart />
                </ChartContainer>
              </div>
            </div>
        )}

        {/* COMPLIANCE AUDITOR CHARTS - ONLY FOR COMPLIANCE AUDITORS */}
        {stableRoleDetection.isAuditor && (
          <div className="space-y-8 mb-8">
            <div className="grid grid-cols-1 gap-8">
              <PolicyComplianceMatrix />
              <AuditCoverageAnalysis />
            </div>
          </div>
        )}

        {/* MANAGER CHARTS - ONLY FOR MANAGERS */}
        {stableRoleDetection.isManager && (
          <div className="space-y-8 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ChartContainer title="Team Productivity Metrics">
                <RiskDistributionChart />
              </ChartContainer>
              <ChartContainer title="Resource Allocation Overview">
                <ApplicationTrendChart />
              </ChartContainer>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ChartContainer title="Team Performance Radar">
                <RiskFactorsRadar />
              </ChartContainer>
              <ChartContainer title="Approval Rate Trends">
                <ApprovalRateChart />
              </ChartContainer>
            </div>
          </div>
        )}

        {/* ADMIN CHARTS - ONLY FOR ADMINISTRATORS */}
        {stableRoleDetection.isAdmin && (
          <div className="space-y-8 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ChartContainer title="System-wide Risk Distribution" subtitle="Advanced portfolio and geographic risk analysis">
                <SystemWideRiskDistributionChart />
              </ChartContainer>
              <ChartContainer title="Overall Application Trends" subtitle="Comprehensive application performance analytics with forecasting">
                <OverallApplicationTrendsChart />
              </ChartContainer>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ChartContainer title="System-wide Risk Factors" subtitle="Multi-dimensional risk analysis with advanced visualization modes">
                <SystemWideRiskFactorsChart />
              </ChartContainer>
              <ChartContainer title="Approval Rate Trends">
                <ApprovalRateChart />
              </ChartContainer>
            </div>
            {/* RBAC Charts (Admin Only) */}
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
          </div>
        )}

        {/* Role-Specific Quick Actions */}
        <div className="mb-8">
          {/* Risk Analyst Quick Actions */}
          {(stableRoleDetection.isAnalyst || stableRoleDetection.isAdmin) && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Risk Analysis Tools
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 cursor-pointer"
                  onClick={() => navigate('/home/risk-analysis')}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg">🎯</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Risk Model Tuning</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Adjust ML model parameters</p>
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 cursor-pointer"
                  onClick={() => navigate('/home/loan-applications?filter=high-risk')}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg">⚠️</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">High-Risk Review</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Review flagged applications</p>
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 cursor-pointer"
                  onClick={() => navigate('/home/reports?type=risk')}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg">📊</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Risk Reports</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Generate risk analysis reports</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {/* Compliance Auditor Quick Actions */}
          {(stableRoleDetection.isAuditor || stableRoleDetection.isAdmin) && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Compliance & Audit Tools
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 cursor-pointer"
                  onClick={() => navigate('/home/admin?tab=logs')}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg">🔍</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Audit Trail Review</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Review system audit logs</p>
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 cursor-pointer"
                  onClick={() => navigate('/home/compliance/violations')}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg">🚨</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Policy Violations</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Review compliance violations</p>
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 cursor-pointer"
                  onClick={() => navigate('/home/reports?type=compliance')}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg">📋</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Regulatory Reports</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Generate compliance reports</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {/* Manager Quick Actions */}
          {(stableRoleDetection.isManager || stableRoleDetection.isAdmin) && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Management Tools
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800 cursor-pointer"
                  onClick={() => navigate('/home/admin')}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg">👥</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Team Management</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Manage team members</p>
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800 cursor-pointer"
                  onClick={() => navigate('/home/loan-applications?status=pending-approval')}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-yellow-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg">✅</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Approval Queue</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Review pending approvals</p>
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 cursor-pointer"
                  onClick={() => navigate('/home/reports?type=management')}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg">📈</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Strategic Reports</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Generate management reports</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          )}
        </div>

        {/* Client User Charts */}
        {stableRoleDetection.isClient && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <ChartContainer title="Your Risk Profile">
              <ClientRiskProfileChart 
                mlAssessmentData={mlAssessmentData}
                isLoading={mlAssessmentLoading}
              />
            </ChartContainer>

            <ChartContainer title="Application History">
              <ClientApplicationHistoryChart 
                applicationsData={applicationsData}
                isLoading={applicationsLoading}
                onViewAll={() => navigate('/home/loan-applications')}
              />
            </ChartContainer>
          </div>
        )}


        {/* Recent Activity & Alerts */}
        <div className="space-y-8">
          {/* User Activity Widget - Admin Only*/}
          {stableRoleDetection.isAdmin && (
            <UserActivityWidget
              users={usersData?.results || (Array.isArray(usersData) ? usersData : basicUserActivity)}
              isLoading={usersLoading}
              title="Recent User Activity"
              showMLActivity={true}
            />
          )}

          {/* Enhanced System Alerts Widget*/}
          <SystemAlertsWidget
            userType={
              stableRoleDetection.isAdmin ? 'admin' :
                stableRoleDetection.isStaff ? 'staff' :
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
