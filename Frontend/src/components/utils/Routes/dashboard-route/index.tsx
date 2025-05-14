import type { RouteObject } from "react-router-dom";
import Dashboard from "../../../../screens/Home";
import MainLayout from "../../../../screens/components/layouts/MainLayout";
import Applications from "../../../../screens/Applications";
import PredictionOutcome from "../../../../screens/Risk-Analysis";

const dashboardRoutes: RouteObject[] = [
  {
    path: "/home",
    element: <MainLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "applications", element: <Applications /> },
      { path: "risk-analysis", element: <PredictionOutcome /> },
      // { path: "risk-analysis", element: <RiskAnalysis /> },
      // { path: "explainability", element: <Explainability /> },
      // { path: "admin-panel", element: <AdminPanel /> },
    ],
  },
];

export default dashboardRoutes;
