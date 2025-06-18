import { useRoutes } from "react-router-dom";
import authRoutes from "./auth-route";
import dashboardRoutes from "./dashboard-route";
import NotFoundPage from "../../../screens/NotFound";

const allRoutes = [
  ...authRoutes,
  ...dashboardRoutes,
  { path: "*", element: <NotFoundPage /> },
];

const AppRoutes = () => {
  const routing = useRoutes(allRoutes);
  return routing;
};

export default AppRoutes;
