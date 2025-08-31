import { useRoutes } from "react-router-dom";
import authRoutes from "./auth-route";
import dashboardRoutes from "./dashboard-route";
import NotFoundPage from "../../../screens/NotFound";
import LandingPage from "../../../screens/LandingPage";

const allRoutes = [
  { path: "/", element: <LandingPage /> },
  { path: "/landing", element: <LandingPage /> },
  ...authRoutes,
  ...dashboardRoutes,
  { path: "*", element: <NotFoundPage /> },
];

const AppRoutes = () => {
  const routing = useRoutes(allRoutes);
  return routing;
};

export default AppRoutes;
