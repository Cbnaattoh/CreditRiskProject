import type { RouteObject } from "react-router-dom";
import Dashboard from "../../../../screens/Home";
import MainLayout from "../../../../screens/components/layouts/MainLayout";
import LoanApplications from "../../../../screens/Applications";
import ApplicationsWrapper from "../../../../screens/Applications/ApplicationsWrapper";
import ApplicationRisk from "../../../../screens/Risk-Analysis";
import ApplicationExplainability from "../../../../screens/Explainability";
import RiskAnalysisWrapper from "../../../../screens/Risk-Analysis/RiskAnalysisWrapper";
import ExplainabilityWrapper from "../../../../screens/Explainability/ExplainabilityWrapper";
import AdminPanel from "../../../../screens/Admin-Panel";
import AccountSettings from "../../../../screens/Settings";
import Customers from "../../../../screens/Applicants";
import CustomerManagement from "../../../../screens/Applicants/CustomerManagement";
import Reports from "../../../../screens/Reports";
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
          { path: "applications", element: <ApplicationsWrapper /> }, // My Applications (list view for client users)
          { path: "loan-applications", element: <Customers /> }, // All Applications (applications list for admin/staff)
          
          // Risk Analysis and Explainability - accessible to all authenticated users  
          { path: "risk-analysis", element: <RiskAnalysisWrapper /> },
          { path: "explainability", element: <ExplainabilityWrapper /> },

          // Customers route - redirect to all applications since they're the same
          { path: "customers", element: <Customers /> },
          
          // Reports - accessible to all authenticated users (RBAC handled in component)
          { path: "reports", element: <Reports /> },
          
          // Application-specific routes
          {
            path: "loan-applications/:applicationId",
            children: [
              { path: "risk", element: <ApplicationRisk /> },
              { path: "explainability", element: <ApplicationExplainability /> },
            ],
          },
          
          // Admin Panel - accessible to all authenticated users (RBAC handled in component)
          { path: "admin", element: <AdminPanel /> },
          
          // Settings - accessible to all authenticated users
          { path: "settings", element: <AccountSettings /> },
        ],
      },
    ],
  },
];

export default dashboardRoutes;
