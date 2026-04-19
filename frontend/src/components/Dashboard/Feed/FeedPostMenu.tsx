import { useState } from "react";
import FeedPost from "./FeedPost";
import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from "@/components/animate-ui/components/animate/tabs";
import InfiniteScroll from "react-infinite-scroll-component";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/spinner";

async function fetchPosts(type: string, page: number = 0) {
  const response = await fetch("http://localhost:5000/get_feedposts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, page }),
    credentials: "include",
  });

  if (!response.ok) throw await response.json();

  return await response.json();
}

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

  return (
    <div>
      <Tabs
        onValueChange={(value) => setActiveTab(value as FeedType)}
        value={activeTab}
      >
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
          <TabsContent value="GLOBAL">
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
                pg.data.map((post) => <FeedPost key={post.id} {...post} />),
              )}
              {globalFeedQuery.isFetching && (
                <div className="w-full flex justify-center">
                  <Spinner className="size-10" />
                </div>
              )}
            </InfiniteScroll>
          </TabsContent>
          <TabsContent value="PRIVATE">
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
                pg.data.map((post) => <FeedPost key={post.id} {...post} />),
              )}
              {privateFeedQuery.isFetching && (
                <div className="w-full flex justify-center">
                  <Spinner className="size-10" />
                </div>
              )}
            </InfiniteScroll>
          </TabsContent>
        </TabsContents>
      </Tabs>
    </div>
  );
}
