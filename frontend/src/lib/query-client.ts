import { QueryClient } from "@tanstack/react-query";

// Single shared QueryClient instance. Exported so it can be reached from
// outside the React tree (e.g. the axios/fetch refresh logic in api.ts) to
// purge cached private data on auth failure.
export const queryClient = new QueryClient();
