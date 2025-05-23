import AppRoutes from "./components/utils/Routes";
import useAutoLogout from "./components/utils/hooks/useAutoLogout";

function App() {
  useAutoLogout();

  return (
    <>
      <div className="flex-1">
        <AppRoutes />
      </div>
    </>
  );
}
export default App;
