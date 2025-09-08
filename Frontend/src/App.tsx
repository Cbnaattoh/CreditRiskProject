import AppRoutes from "./components/utils/Routes";
import useAutoLogout from "./components/utils/hooks/useAutoLogout";
import { useAuthSync } from "./components/utils/hooks/useAuthSync";
import { useBehavioralMonitoring } from "./hooks/useBehavioralMonitoring";
import { ToastContainer, useToast } from "./components/utils/Toast";
import ScrollToTop from "./components/common/ScrollToTop";

function App() {
  const { toasts, removeToast } = useToast();
  useAutoLogout();
  useAuthSync(); // Automatically fetch permissions when authenticated
  useBehavioralMonitoring(); // Monitor user behavior for security

  return (
    <>
      <ScrollToTop />
      <ToastContainer
        toasts={toasts}
        removeToast={removeToast}
        position="top-right"
      />
      <div className="flex-1">
        <AppRoutes />
      </div>
    </>
  );
}
export default App;
