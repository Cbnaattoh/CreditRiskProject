import type { RouteObject } from "react-router-dom";
import Dashboard from "../../../../screens/Home";

const dashboardRoutes: RouteObject[] = [
  { path: "/dashboard", element: <Dashboard /> },
];

export default dashboardRoutes;
