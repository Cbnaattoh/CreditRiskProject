import type { RouteObject } from "react-router-dom";
import Dashboard from "../../../../screens/Home";
import MainLayout from "../../../../screens/components/layouts/MainLayout";
import ApplyWrapper from "../../../../screens/Applications/ApplyWrapper";
import ApplicationsWrapper from "../../../../screens/Applications/ApplicationsWrapper";
import ApplicationRisk from "../../../../screens/Risk-Analysis/ApplicationRisk";
import ApplicationExplainability from "../../../../screens/Explainability/ApplicationExplainability";
import RiskAnalysisWrapper from "../../../../screens/Risk-Analysis/RiskAnalysisWrapper";
import ExplainabilityWrapper from "../../../../screens/Explainability/ExplainabilityWrapper";
import AdminPanel from "../../../../screens/Admin-Panel";
import AccountSettings from "../../../../screens/Settings";
import Customers from "../../../../screens/Applicants";
import CustomerManagement from "../../../../screens/Applicants/CustomerManagement";
import Reports from "../../../../screens/Reports";
import NotificationsPage from "../../../../screens/Notifications";
import WebSocketTest from "../../../../screens/WebSocketTest";
import Help from "../../../../screens/Help";
import SecurityPage from "../../../../screens/Security";
import ProtectedRoute from "../../ProtectedRoute";

const dashboardRoutes: RouteObject[] = [
  {
    path: "/home",
    element: <ProtectedRoute />,
    children: [
      {
        path: "",
        element: <MainLayout />,
        children: [
          { index: true, element: <Dashboard /> },
          
          // Applications routes - different components for different purposes
          { path: "apply", element: <ApplyWrapper /> }, // Direct application form for client users
          { path: "applications", element: <ApplicationsWrapper /> }, // My Applications (list view for client users)
          { path: "loan-applications", element: <Customers /> }, // All Applications (applications list for admin/staff)
          
          // Risk Analysis and Explainability - accessible to all authenticated users  
          { path: "risk-analysis", element: <RiskAnalysisWrapper /> },
          { path: "explainability", element: <ExplainabilityWrapper /> },

          // Customers route - redirect to all applications since they're the same
          { path: "customers", element: <Customers /> },
          
          // Reports - accessible to all authenticated users (RBAC handled in component)
          { path: "reports", element: <Reports /> },
          
          // Notifications - accessible to all authenticated users
          { path: "notifications", element: <NotificationsPage /> },
          
          // WebSocket Test - temporary for debugging
          { path: "websocket-test", element: <WebSocketTest /> },
          
          // Application-specific risk analysis and explainability routes
          { path: "risk-analysis/:applicationId", element: <ApplicationRisk /> },
          { path: "explainability/:applicationId", element: <ApplicationExplainability /> },
          
          // Admin Panel - accessible to all authenticated users (RBAC handled in component)
          { path: "admin", element: <AdminPanel /> },
          
          // Security Center - accessible to admin/staff users (RBAC handled in component)
          { path: "security", element: <SecurityPage /> },
          
          // Settings - accessible to all authenticated users
          { path: "settings", element: <AccountSettings /> },
          
          // Help Center - accessible to all authenticated users
          { path: "help", element: <Help /> },
        ],
      },
    ],
  },
];

export default dashboardRoutes;
