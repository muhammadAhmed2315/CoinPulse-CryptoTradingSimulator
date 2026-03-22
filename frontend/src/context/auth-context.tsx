import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { getStrictContext } from "@/lib/get-strict-context";

interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const [AuthProvider, useAuth] = getStrictContext<AuthContextValue>("AuthContext");

function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const { data: user = null, isLoading } = useQuery<User | null>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      try {
        const res = await axios.get("http://localhost:5000/auth/me", {
          withCredentials: true,
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
