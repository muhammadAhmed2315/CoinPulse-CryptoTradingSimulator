import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { getStrictContext } from "@/lib/get-strict-context";
import { API_BASE, AUTH_ME_QUERY_KEY, type AuthUser } from "@/lib/api";

// ===== TYPES =====
interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// ===== CONTEXT =====
const [AuthProvider, useAuth] =
  getStrictContext<AuthContextValue>("AuthContext");

function AuthContextProvider({ children }: { children: React.ReactNode }) {
  // ===== REACT QUERY HOOKS =====
  const { data: user = null, isLoading } = useQuery<AuthUser | null>({
    queryKey: AUTH_ME_QUERY_KEY,
    queryFn: async ({ signal }) => {
      try {
        const res = await axios.get(`${API_BASE}/auth/me`, {
          withCredentials: true,
          signal,
        });
        return res.data;
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          return null;
        }
        throw err;
      }
    },
    retry: false,
  });

  return (
    <AuthProvider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthProvider>
  );
}

export { AuthContextProvider, useAuth };
