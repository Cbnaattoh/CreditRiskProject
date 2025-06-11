// import type { RouteObject } from "react-router-dom";
// import Dashboard from "../../../../screens/Home";
// import MainLayout from "../../../../screens/components/layouts/MainLayout";
// import Applications from "../../../../screens/Applications";
// import PredictionOutcome from "../../../../screens/Risk-Analysis";
// import PredictionExplainability from "../../../../screens/Explainability";
// import AdminPanel from "../../../../screens/Admin-Panel";
// import AccountSettings from "../../../../screens/Settings";
// import Applicants from "../../../../screens/Applicants";

// const dashboardRoutes: RouteObject[] = [
//   {
//     path: "/home",
//     element: <MainLayout />,
//     children: [
//       { index: true, element: <Dashboard /> },
//       { path: "applicants", element: <Applicants /> },
//       { path: "applications", element: <Applications /> },
//       { path: "risk-analysis", element: <PredictionOutcome /> },
//       { path: "explainability", element: <PredictionExplainability /> },
//       { path: "admin-panel", element: <AdminPanel /> },
//       { path: "settings", element: <AccountSettings /> },
//     ],
//   },
// ];

// export default dashboardRoutes;

import type { RouteObject } from "react-router-dom";
import Dashboard from "../../../../screens/Home";
import MainLayout from "../../../../screens/components/layouts/MainLayout";
import LoanApplications from "../../../../screens/Applications";
import ApplicationRisk from "../../../../screens/Risk-Analysis";
import ApplicationExplainability from "../../../../screens/Explainability";
import AdminPanel from "../../../../screens/Admin-Panel";
import AccountSettings from "../../../../screens/Settings";
import Customers from "../../../../screens/Applicants";

const dashboardRoutes: RouteObject[] = [
  {
    path: "/home",
    element: <MainLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "customers", element: <Customers /> },
      { path: "loan-applications", element: <LoanApplications /> },
      {
        path: "loan-applications/:applicationId",
        children: [
          { path: "risk", element: <ApplicationRisk /> },
          { path: "explainability", element: <ApplicationExplainability /> },
        ],
      },
      { path: "admin", element: <AdminPanel /> },
      { path: "settings", element: <AccountSettings /> },
    ],
  },
];

export default dashboardRoutes;
