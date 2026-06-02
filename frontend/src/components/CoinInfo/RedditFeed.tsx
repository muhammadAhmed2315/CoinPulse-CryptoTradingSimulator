import { Card } from "../ui/card";
import InfiniteScroll from "react-infinite-scroll-component";
import { Spinner } from "../ui/spinner";
import RedditPost from "./RedditPost";
import { QueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { fetchWithRefresh, API_BASE } from "@/lib/api";
import CustomSkeleton from "../CustomSkeleton";
import ErrorFallback from "../ErrorFallback";
import EmptyFallback from "../EmptyFallback";

const SKELETON_ITEMS = Array.from({ length: 6 }, (_, i) => i);

function RedditPostSkeleton() {
  return (
    <div className="border-b border-border last:border-b-0">
      <div className="flex gap-3.5 px-6 py-4.5">
        <CustomSkeleton className="size-21 shrink-0 rounded-[10px]" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <CustomSkeleton className="h-3 w-40" />
          <CustomSkeleton className="h-9 w-full rounded-md" />
          <CustomSkeleton className="h-3 w-32 mt-0.5" />
        </div>
      </div>
    </div>
  );
}

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
  const response = await fetchWithRefresh(
    `${API_BASE}/get_reddit_posts`,
    {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: coinName, after: after }),
      credentials: "include",
    },
  );

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
    <Card className="flex-1 gap-0 overflow-hidden rounded-[18px] border-border p-0 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      {/* ===== HEADER ===== */}
      <div className="flex items-end justify-between gap-4 border-b border-border px-6 pt-5.5 pb-4.5">
        {/* ===== TITLE ===== */}
        <div className="flex flex-col gap-2">
          <p className="font-mono text-[11px] leading-none font-semibold tracking-[0.06em] text-muted-foreground uppercase">
            REDDIT
          </p>
          <p className="text-[22px] leading-none font-bold text-foreground">
            Recent Reddit Posts on {coinName}
          </p>
        </div>
        {/* ===== RESULTS COUNT ===== */}
        {redditPostsQuery.isLoading ? (
          <CustomSkeleton className="h-5 w-20 rounded-md" />
        ) : redditPostsQuery.isError ? null : (
          <p className="rounded-md bg-muted px-2 py-1 font-mono text-[10px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
            {numPosts} RESULTS
          </p>
        )}
      </div>

      {/* ===== POSTS LIST ===== */}
      {redditPostsQuery.isLoading ? (
        <div className="flex flex-col pb-8">
          {SKELETON_ITEMS.map((i) => (
            <RedditPostSkeleton key={i} />
          ))}
        </div>
      ) : redditPostsQuery.isError ? (
        <div className="relative">
          <div className="flex flex-col pb-8 invisible" aria-hidden>
            {SKELETON_ITEMS.map((i) => (
              <RedditPostSkeleton key={i} />
            ))}
          </div>
          <ErrorFallback
            title="Data unavailable"
            description="Reddit posts could not be loaded."
            className="absolute inset-0"
          />
        </div>
      ) : numPosts === 0 ? (
        <div className="relative">
          <div className="flex flex-col pb-8 invisible" aria-hidden>
            {SKELETON_ITEMS.map((i) => (
              <RedditPostSkeleton key={i} />
            ))}
          </div>
          <EmptyFallback
            title="No posts yet"
            description={`No recent Reddit posts about ${coinName}.`}
            className="absolute inset-0"
          />
        </div>
      ) : (
        <InfiniteScroll
          dataLength={redditPostsQuery.data?.pages.length || 0}
          next={redditPostsQuery.fetchNextPage}
          hasMore={!!redditPostsQuery.hasNextPage}
          loader={<span></span>}
          endMessage={
            <p className="pt-8 text-center font-bold">
              You're all caught up.
            </p>
          }
          className="flex flex-col pb-8"
        >
          {redditPostsQuery.data?.pages.map((page) =>
            page.map((pg: any) => <RedditPost key={pg.fullname} post={pg} />),
          )}
          {redditPostsQuery.isFetchingNextPage && (
            <div className="pt-4 w-full flex justify-center">
              <Spinner className="size-10" />
            </div>
          )}
        </InfiniteScroll>
      )}
    </Card>
  );
}
