import Login from "./screens/Authentication/Login-SignUp";
import ForgotPassword from "./screens/Authentication/PasswordRecovery/ForgotPassword";
import ResetPassword from "./screens/Authentication/PasswordRecovery/ResetPassword";
import Dashboard from "./screens/Home";
import { Routes, Route } from "react-router-dom";
import AppRoutes from "./components/utils/Routes";

function App() {
  return (
    <>
      <div className="flex-1">
        {/* <Routes>
          <Route path="/" element={<Dashboard/>}/>
        </Routes>
        {/* <Login /> */}
        {/* <ForgotPassword />
        <ResetPassword /> */}
        {/* <Dashboard /> */}
        <AppRoutes />
      </div>
    </>
  );
}
export default App;
