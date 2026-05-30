import { useState } from "react";
import FeedPost from "./FeedPost";
import FeedPostSkeleton from "./FeedPostSkeleton";
import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from "@/components/animate-ui/components/animate/tabs";
import InfiniteScroll from "react-infinite-scroll-component";
import { QueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/spinner";
import { fetchWithRefresh } from "@/lib/api";
import { Card } from "@/components/ui/card";
import ErrorFallback from "@/components/ErrorFallback";
import NoTradesFallback from "./NoTradesFallback";

// ===== CONSTANTS =====
const SKELETON_POSTS = Array.from({ length: 3 }, (_, i) => i);

// ===== NAVBAR PREFETCH =====
export function prefetchFeedPosts(queryClient: QueryClient) {
  return Promise.all([
    queryClient.prefetchInfiniteQuery({
      queryKey: ["globalFeedPosts"],
      queryFn: ({ pageParam }) => fetchPosts("GLOBAL", pageParam),
      getNextPageParam: (lastPage: any) => lastPage.nextPage ?? undefined,
      initialPageParam: 0,
    }),
    queryClient.prefetchInfiniteQuery({
      queryKey: ["privateFeedPosts"],
      queryFn: ({ pageParam }) => fetchPosts("PRIVATE", pageParam),
      getNextPageParam: (lastPage: any) => lastPage.nextPage ?? undefined,
      initialPageParam: 0,
    }),
  ]);
}

// ===== API FUNCTIONS =====
async function fetchPosts(type: string, page: number = 0) {
  const response = await fetchWithRefresh(
    "http://localhost:5000/get_feedposts",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, page }),
      credentials: "include",
    },
  );

  if (!response.ok) throw await response.json();

  return await response.json();
}

// ===== TYPES =====
type FeedType = "GLOBAL" | "PRIVATE";

export default function FeedPostMenu() {
  // ===== STATE VARIABLES =====
  const [activeTab, setActiveTab] = useState<FeedType>("GLOBAL");

  // ===== REACT QUERY HOOKS =====
  const globalFeedQuery = useInfiniteQuery({
    queryKey: ["globalFeedPosts"],
    queryFn: ({ pageParam }) => fetchPosts("GLOBAL", pageParam),
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    initialPageParam: 0,
  });

  const privateFeedQuery = useInfiniteQuery({
    queryKey: ["privateFeedPosts"],
    queryFn: ({ pageParam }) => fetchPosts("PRIVATE", pageParam),
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    initialPageParam: 0,
  });

  // ===== ERROR STATE =====
  const errorState = (
    <Card className="p-6 mb-6 gap-4 min-h-205 flex items-center justify-center">
      <ErrorFallback
        title="Feed unavailable"
        description="Posts could not be loaded."
      />
    </Card>
  );

  // ===== DERIVED STATE =====
  const globalPostCount =
    globalFeedQuery.data?.pages.reduce(
      (acc, pg) => acc + (pg.data?.length ?? 0),
      0,
    ) ?? 0;
  const privatePostCount =
    privateFeedQuery.data?.pages.reduce(
      (acc, pg) => acc + (pg.data?.length ?? 0),
      0,
    ) ?? 0;

  return (
    <div>
      <Tabs
        onValueChange={(value) => setActiveTab(value as FeedType)}
        value={activeTab}
      >
        {/* ===== TABS LIST ===== */}
        <TabsList className="mb-2">
          <TabsTrigger
            className="text-xl cursor-pointer"
            value="GLOBAL"
            onClick={() => setActiveTab("GLOBAL")}
          >
            Global Feed
          </TabsTrigger>
          <TabsTrigger
            className="text-xl cursor-pointer"
            value="PRIVATE"
            onClick={() => setActiveTab("PRIVATE")}
          >
            My Feed
          </TabsTrigger>
        </TabsList>
        <TabsContents>
          {/* ===== GLOBAL FEED ===== */}
          <TabsContent value="GLOBAL">
            {globalFeedQuery.isLoading ? (
              SKELETON_POSTS.map((i) => <FeedPostSkeleton key={i} />)
            ) : globalFeedQuery.isError ? (
              errorState
            ) : globalPostCount === 0 ? (
              <Card className="p-6 mb-6 gap-4 min-h-135 flex items-center justify-center">
                <NoTradesFallback
                  title="No trades yet"
                  description="When other traders place trades, they'll show up here."
                />
              </Card>
            ) : (
              <InfiniteScroll
                dataLength={globalFeedQuery.data?.pages.length || 0}
                next={globalFeedQuery.fetchNextPage}
                hasMore={!!globalFeedQuery.hasNextPage}
                loader={<span></span>}
                endMessage={
                  <p style={{ textAlign: "center" }}>
                    <b>You're all caught up.</b>
                  </p>
                }
                className="pb-8"
              >
                {globalFeedQuery.data?.pages.flatMap((pg) =>
                  pg.data.map((post: any) => (
                    <FeedPost key={post.id} {...post} />
                  )),
                )}
                {globalFeedQuery.isFetchingNextPage && (
                  <div className="w-full flex justify-center">
                    <Spinner className="size-10" />
                  </div>
                )}
              </InfiniteScroll>
            )}
          </TabsContent>
          {/* ===== PRIVATE FEED ===== */}
          <TabsContent value="PRIVATE">
            {privateFeedQuery.isLoading ? (
              SKELETON_POSTS.map((i) => <FeedPostSkeleton key={i} />)
            ) : privateFeedQuery.isError ? (
              errorState
            ) : privatePostCount === 0 ? (
              <Card className="p-6 mb-6 gap-4 min-h-135 flex items-center justify-center">
                <NoTradesFallback
                  title="No trades yet"
                  description="Place your first trade to see it appear here."
                />
              </Card>
            ) : (
              <InfiniteScroll
                dataLength={privateFeedQuery.data?.pages.length || 0}
                next={privateFeedQuery.fetchNextPage}
                hasMore={!!privateFeedQuery.hasNextPage}
                loader={<span></span>}
                endMessage={
                  <p style={{ textAlign: "center" }}>
                    <b>You're all caught up.</b>
                  </p>
                }
                className="pb-8"
              >
                {privateFeedQuery.data?.pages.flatMap((pg) =>
                  pg.data.map((post: any) => (
                    <FeedPost key={post.id} {...post} />
                  )),
                )}
                {privateFeedQuery.isFetchingNextPage && (
                  <div className="w-full flex justify-center">
                    <Spinner className="size-10" />
                  </div>
                )}
              </InfiniteScroll>
            )}
          </TabsContent>
        </TabsContents>
      </Tabs>
    </div>
  );
}
