import { useState } from "react";
import FeedPost from "./FeedPost";
import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from "@/components/animate-ui/components/animate/tabs";
import { useInfiniteQuery } from "@tanstack/react-query";

import CustomSkeleton from "@/components/CustomSkeleton";

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
  const [globalPage, setGlobalPage] = useState(0);
  const [privatePage, setPrivatePage] = useState(0);

  // ===== REACT QUERY HOOKS =====
  const globalFeedQuery = useInfiniteQuery({
    queryKey: ["globalFeedPosts"],
    queryFn: () => fetchPosts("GLOBAL", globalPage),
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    initialPageParam: 0,
  });

  const privateFeedQuery = useInfiniteQuery({
    queryKey: ["privateFeedPosts"],
    queryFn: () => fetchPosts("PRIVATE", privatePage),
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    initialPageParam: 0,
  });

  if (globalFeedQuery) console.log(globalFeedQuery.data);

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
            {globalFeedQuery.data?.pages.flatMap((pg) =>
              pg.data.map((post) => <FeedPost key={post.id} {...post} />),
            )}
            {globalFeedQuery.isFetching &&
              Array.from({ length: 5 }).map((_, i) => (
                <CustomSkeleton key={i} className="h-40 w-full mb-8" />
              ))}
          </TabsContent>
          <TabsContent value="PRIVATE">
            {privateFeedQuery.data?.pages.flatMap((pg) =>
              pg.data.map((post) => <FeedPost key={post.id} {...post} />),
            )}
            {privateFeedQuery.isFetching &&
              Array.from({ length: 5 }).map((_, i) => (
                <CustomSkeleton key={i} className="h-40 w-full mb-8" />
              ))}
          </TabsContent>
        </TabsContents>
      </Tabs>
    </div>
  );
}
