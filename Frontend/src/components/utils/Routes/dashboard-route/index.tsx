import type { RouteObject } from "react-router-dom";
import Dashboard from "../../../../screens/Home";
import MainLayout from "../../../../screens/components/layouts/MainLayout";
import Applications from "../../../../screens/Applications";
import PredictionOutcome from "../../../../screens/Risk-Analysis";
import PredictionExplainability from "../../../../screens/Explainability";
import AdminPanel from "../../../../screens/Admin-Panel";
import AccountSettings from "../../../../screens/Settings";
import Applicants from "../../../../screens/Applicants";

const dashboardRoutes: RouteObject[] = [
  {
    path: "/home",
    element: <MainLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "applicants", element: <Applicants /> },
      { path: "applications", element: <Applications /> },
      { path: "risk-analysis", element: <PredictionOutcome /> },
      { path: "explainability", element: <PredictionExplainability /> },
      { path: "admin-panel", element: <AdminPanel /> },
      { path: "settings", element: <AccountSettings /> },
    ],
  },
];

export default dashboardRoutes;
