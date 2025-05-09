import { useRoutes } from "react-router-dom";
import authRoutes from "./auth-route";
import dashboardRoutes from "./dashboard-route";

const allRoutes = [...authRoutes, ...dashboardRoutes];

const AppRoutes = () => {
  const routing = useRoutes(allRoutes);
  return routing;
};

export default AppRoutes;
