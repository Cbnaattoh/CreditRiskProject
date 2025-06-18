import type { RouteObject } from "react-router-dom";
import Dashboard from "../../../../screens/Home";
import MainLayout from "../../../../screens/components/layouts/MainLayout";
import LoanApplications from "../../../../screens/Applications";
import ApplicationRisk from "../../../../screens/Risk-Analysis";
import ApplicationExplainability from "../../../../screens/Explainability";
import AdminPanel from "../../../../screens/Admin-Panel";
import AccountSettings from "../../../../screens/Settings";
import Customers from "../../../../screens/Applicants";
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
          { path: "customers", element: <Customers /> },
          { path: "loan-applications", element: <LoanApplications /> },
          {
            path: "loan-applications/:applicationId",
            children: [
              { path: "risk", element: <ApplicationRisk /> },
              {
                path: "explainability",
                element: <ApplicationExplainability />,
              },
            ],
          },
          { path: "admin", element: <AdminPanel /> },
          { path: "settings", element: <AccountSettings /> },
        ],
      },
    ],
  },
];

export default dashboardRoutes;
