import FlickeringGrid from "@/components/authentication/FlickeringGrid";
import { Outlet } from "react-router-dom";

export default function AuthenticationBase() {
  return (
    <FlickeringGrid color="#ffffff" backgroundColor="#000000">
      <Outlet />
    </FlickeringGrid>
  );
}

// rgb(16, 185, 129)
