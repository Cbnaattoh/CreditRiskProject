import AppRoutes from "./components/utils/Routes";
import useAutoLogout from "./components/utils/hooks/useAutoLogout";
import { ToastContainer, useToast } from "./components/utils/Toast";

function App() {
  const { toasts, removeToast } = useToast();
  useAutoLogout();

  return (
    <>
      <div className="flex-1">
        <ToastContainer toasts={toasts} removeToast={removeToast}/>
        <AppRoutes />
      </div>
    </>
  );
}
export default App;
