import { Card } from "../ui/card";
import InfiniteScroll from "react-infinite-scroll-component";
import { Spinner } from "../ui/spinner";
import RedditPost from "./RedditPost";
import { QueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { fetchWithRefresh } from "@/lib/api";

// ===== NAVBAR PREFETCH =====
export function prefetchRedditFeed(
  queryClient: QueryClient,
  coinName: string = "Bitcoin",
) {
  return Promise.all([
    queryClient.prefetchInfiniteQuery({
      queryKey: ["redditPosts", coinName],
      queryFn: ({ pageParam }) => getRedditPosts(coinName, pageParam),
      getNextPageParam: (lastPage: any) => {
        return lastPage.length > 0 ? lastPage.at(-1)!.fullname : undefined;
      },
      initialPageParam: "",
    }),
  ]);
}

// ===== TYPES =====
type RedditFeedProps = {
  coinName: string;
};

export type RedditPost = {
  comment_count: number;
  content: string;
  fullname: string;
  id: string;
  score: number;
  subreddit: string;
  thumbnail: string;
  timestamp: string;
  title: string;
  url: string;
};

// ===== API FUNCTIONS =====
async function getRedditPosts(coinName: string, after: string) {
  const response = await fetchWithRefresh("http://localhost:5000/get_reddit_posts", {
    method: "post",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: coinName, after: after }),
    credentials: "include",
  });

  if (!response.ok) throw await response.json();

  return await response.json();
}

export default function RedditFeed({ coinName }: RedditFeedProps) {
  // ===== REACT QUERY HOOKS =====
  const redditPostsQuery = useInfiniteQuery({
    queryKey: ["redditPosts", coinName],
    queryFn: ({ pageParam }) => getRedditPosts(coinName, pageParam),
    getNextPageParam: (lastPage) => {
      return lastPage.length > 0 ? lastPage.at(-1)!.fullname : undefined;
    },
    initialPageParam: "",
  });

  // ===== DERIVED STATE =====
  const numPosts = redditPostsQuery.data
    ? redditPostsQuery.data.pages.flatMap((page) => page).length
    : 0;

  return (
    <Card className="flex-1 gap-0 overflow-hidden rounded-[18px] border-[#f0f0f0] p-0 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      {/* ===== HEADER ===== */}
      <div className="flex items-end justify-between gap-4 border-b border-[#f0f0f0] px-6 pt-5.5 pb-4.5">
        {/* ===== TITLE ===== */}
        <div className="flex flex-col gap-2">
          <p className="font-mono text-[11px] leading-none font-semibold tracking-[0.06em] text-[#71717a] uppercase">
            REDDIT
          </p>
          <p className="text-[22px] leading-none font-bold text-[#111111]">
            Recent Reddit Posts on {coinName}
          </p>
        </div>
        {/* ===== RESULTS COUNT ===== */}
        <p className="rounded-md bg-[#ececef] px-2 py-1 font-mono text-[10px] font-semibold tracking-[0.06em] text-[#71717a] uppercase">
          {numPosts} RESULTS
        </p>
      </div>

      {/* ===== POSTS LIST ===== */}
      <InfiniteScroll
        dataLength={redditPostsQuery.data?.pages.length || 0}
        next={redditPostsQuery.fetchNextPage}
        hasMore={!!redditPostsQuery.hasNextPage}
        loader={<span></span>}
        endMessage={
          <p style={{ textAlign: "center" }}>
            <b>You're all caught up.</b>
          </p>
        }
        className="flex flex-col pb-8"
      >
        {redditPostsQuery.data?.pages.map((page) =>
          page.map((pg) => <RedditPost key={pg.fullname} post={pg} />),
        )}
        {redditPostsQuery.isFetching && (
          <div className="pt-4 w-full flex justify-center">
            <Spinner className="size-10" />
          </div>
        )}
      </InfiniteScroll>
    </Card>
  );
}
