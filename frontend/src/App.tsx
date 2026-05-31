import AuthenticationBase from "./pages/AuthenticationBase";
import { Route, BrowserRouter, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import HomeRedirect from "./components/HomeRedirect";
import Dashboard from "./pages/Dashboard";

// Lazy-loaded route components that pull in heavy libs (AG Grid / Highcharts)
const MyTrades = lazy(() => import("./pages/MyTrades"));
const TopCoins = lazy(() => import("./pages/TopCoins"));
import Login from "./components/authentication/Login";
import RequestPasswordReset from "./components/authentication/RequestPasswordReset";
import ResetPassword from "./components/authentication/ResetPassword";
import AuthenticatedBase from "./pages/AuthenticatedBase";
import ActivationEmailSent from "./components/authentication/ActivationEmailSent";
import PickUsername from "./components/authentication/PickUsername";
import PasswordResetLinkSent from "./components/authentication/PasswordResetLinkSent";
import CreateAccount from "./components/authentication/Register";
import VerifyEmail from "./components/authentication/VerifyEmail";
import EmailVerificationSuccessful from "./components/authentication/EmailVerificationSuccessful";
import EmailVerificationUnsuccessful from "./components/authentication/EmailVerificationUnsuccessful";
import EmailVerificationForm from "./components/authentication/EmailVerificationForm";
import VerifyPasswordResetToken from "./components/authentication/VerifyPasswordResetToken";
import PasswordResetLinkInvalid from "./components/authentication/PasswordResetLinkInvalid";
import { AuthContextProvider, useAuth } from "./context/auth-context";
import { ThemeContextProvider } from "./context/theme-context";
import ProtectedRoute from "./components/ProtectedRoute";
import EmailAlreadyVerified from "./components/authentication/EmailAlreadyVerified";
import AuthenticationPageNotFound from "./components/authentication/AuthenticationPageNotFound.tsx";
import AuthenticatedPageNotFound from "./components/AuthenticatedPageNotFound.tsx";
import NavBar from "./components/NavBar";
const CoinInfo = lazy(() => import("./pages/CoinInfo.tsx"));

function NotFoundHandler() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  if (isAuthenticated) {
    return (
      <div>
        <NavBar />
        <AuthenticatedPageNotFound />
      </div>
    );
  }

  return <AuthenticationPageNotFound />;
}

function App() {
  return (
    <ThemeContextProvider>
      <AuthContextProvider>
        <BrowserRouter>
        <Suspense fallback={<div>Loading…</div>}>
        <Routes>
          {/* ===== HOME REDIRECT ===== */}
          <Route path="/" element={<HomeRedirect />} />

          {/* ===== AUTHENTICATION ROUTES ===== */}
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
              path="/email_already_verified"
              element={<EmailAlreadyVerified />}
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

          {/* ===== AUTHENTICATED ROUTES ===== */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AuthenticatedBase />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/my_trades" element={<MyTrades />} />
              <Route path="/top_coins" element={<TopCoins />} />
              <Route path="/coin_info" element={<CoinInfo />} />
            </Route>
          </Route>

          {/* ===== CATCH-ALL ===== */}
          <Route path="*" element={<NotFoundHandler />} />
        </Routes>
        </Suspense>
        </BrowserRouter>
      </AuthContextProvider>
    </ThemeContextProvider>
  );
}

export default App;
