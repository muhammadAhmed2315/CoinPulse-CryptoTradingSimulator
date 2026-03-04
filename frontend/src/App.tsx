import AuthenticationBase from "./pages/AuthenticationBase";
import { Route, BrowserRouter, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import MyTrades from "./pages/MyTrades";
import TopCoins from "./pages/TopCoins";
import Login from "./components/authentication/Login";
import Register from "./components/authentication/Register";
import RequestPasswordReset from "./components/authentication/RequestPasswordReset";
import InvalidResetLinkPage from "./components/authentication/InvalidResetLinkPage";
import ResetPassword from "./components/authentication/ResetPassword";
import AuthenticatedBase from "./pages/AuthenticatedBase";
import VerificationSent from "./components/authentication/VerificationSent";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Authentication routes */}
        <Route element={<AuthenticationBase />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset_password" element={<RequestPasswordReset />} />
          <Route
            path="/invalid_reset_link"
            element={<InvalidResetLinkPage />}
          />
          <Route path="/change_password" element={<ResetPassword />} />
          <Route path="/verification_sent" element={<VerificationSent />} />
        </Route>

        {/* Authenticated routes */}
        <Route element={<AuthenticatedBase />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/my_trades" element={<MyTrades />} />
          <Route path="/top_coins" element={<TopCoins />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
