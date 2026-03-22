import AuthenticationBase from "./pages/AuthenticationBase";
import { Route, BrowserRouter, Routes } from "react-router-dom";
import HomeRedirect from "./components/HomeRedirect";
import Dashboard from "./pages/Dashboard";
import MyTrades from "./pages/MyTrades";
import TopCoins from "./pages/TopCoins";
import Login from "./components/authentication/Login";
import RequestPasswordReset from "./components/authentication/RequestPasswordReset";
import ResetPassword from "./components/authentication/ResetPassword";
import AuthenticatedBase from "./pages/AuthenticatedBase";
import ActivationEmailSent from "./components/authentication/ActivationEmailSent";
import PickUsername from "./components/authentication/PickUsername";
import CoinInfo from "./pages/CoinInfo";
import PasswordResetLinkSent from "./components/authentication/PasswordResetLinkSent";
import CreateAccount from "./components/authentication/Register";
import VerifyEmail from "./components/authentication/VerifyEmail";
import EmailVerificationSuccessful from "./components/authentication/EmailVerificationSuccessful";
import EmailVerificationUnsuccessful from "./components/authentication/EmailVerificationUnsuccessful";
import EmailVerificationForm from "./components/authentication/EmailVerificationForm";
import VerifyPasswordResetToken from "./components/authentication/VerifyPasswordResetToken";
import PasswordResetLinkInvalid from "./components/authentication/PasswordResetLinkInvalid";
import { AuthContextProvider } from "./context/auth-context";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <AuthContextProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />

          {/* Authentication routes */}
          <Route element={<AuthenticationBase />}>
            <Route path="/login" element={<Login />} />
            <Route path="/create_account" element={<CreateAccount />} />
            <Route
              path="/request_password_reset"
              element={<RequestPasswordReset />}
            />
            <Route path="/reset_password" element={<ResetPassword />} />
            <Route
              path="/activation_email_sent"
              element={<ActivationEmailSent />}
            />
            <Route path="/pick_username" element={<PickUsername />} />
            <Route
              path="/password_reset_link_sent"
              element={<PasswordResetLinkSent />}
            />
            <Route path="/verify_email/:token" element={<VerifyEmail />} />
            <Route
              path="/email_verification_successful"
              element={<EmailVerificationSuccessful />}
            />
            <Route
              path="/email_verification_unsuccessful"
              element={<EmailVerificationUnsuccessful />}
            />
            <Route
              path="/email_verification_form"
              element={<EmailVerificationForm />}
            />
            <Route
              path="/verify_password_reset_token/:token"
              element={<VerifyPasswordResetToken />}
            />
            <Route
              path="/password_reset_link_invalid"
              element={<PasswordResetLinkInvalid />}
            />
          </Route>

          {/* Authenticated routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AuthenticatedBase />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/my_trades" element={<MyTrades />} />
              <Route path="/top_coins" element={<TopCoins />} />
              <Route path="/coin_info" element={<CoinInfo />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthContextProvider>
  );
}

export default App;
