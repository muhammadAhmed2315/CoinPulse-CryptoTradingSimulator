import { Card } from "../ui/card";
import InfiniteScroll from "react-infinite-scroll-component";
import { Spinner } from "../ui/spinner";
import { QueryClient, useInfiniteQuery } from "@tanstack/react-query";
import NewsItem from "./NewsItem";
import { fetchWithRefresh, API_BASE } from "@/lib/api";
import CustomSkeleton from "../CustomSkeleton";
import ErrorFallback from "../ErrorFallback";
import EmptyFallback from "../EmptyFallback";

const SKELETON_ITEMS = Array.from({ length: 5 }, (_, i) => i);

function NewsItemSkeleton() {
  return (
    <div className="border-b border-border last:border-b-0">
      <div className="flex gap-3.5 px-6 py-4.5">
        <CustomSkeleton className="size-21 shrink-0 rounded-[10px]" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <CustomSkeleton className="h-3 w-40" />
          <CustomSkeleton className="h-9 w-full rounded-md" />
          <CustomSkeleton className="h-7 w-full rounded-md" />
          <CustomSkeleton className="h-3 w-24 mt-0.5" />
        </div>
      </div>
    </div>
  );
}

// ===== NAVBAR PREFETCH =====
export function prefetchNewsFeed(
  queryClient: QueryClient,
  coinName: string = "Bitcoin",
) {
  return Promise.all([
    queryClient.prefetchInfiniteQuery({
      queryKey: ["newsArticles", coinName],
      queryFn: ({ pageParam }) => getNewsArticles(coinName, pageParam),
      getNextPageParam: (lastPage: NewsArticlesPage) => lastPage.nextPage,
      initialPageParam: "",
    }),
  ]);
}

// ===== TYPES =====
type NewsFeedProps = {
  coinName: string;
};

export type NewsArticle = {
  title: string;
  image_url: string;
  pubDate: string;
  pubDateTZ: string;
  article_id: string;
  source_name: string;
  source_url: string;
  link: string;
  description: string;
};

type NewsArticlesPage = {
  results: NewsArticle[];
  nextPage: string | null;
  totalResults: number;
};

// ===== API FUNCTIONS =====
async function getNewsArticles(
  coinName: string,
  nextPage: string,
): Promise<NewsArticlesPage> {
  const response = await fetchWithRefresh(
    `${API_BASE}/get_news_articles`,
    {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: coinName, nextPage: nextPage }),
      credentials: "include",
    },
  );

  if (!response.ok) throw await response.json();

  return await response.json();
}

export default function NewsFeed({ coinName }: NewsFeedProps) {
  // ===== REACT QUERY HOOKS =====
  const newsArticlesQuery = useInfiniteQuery({
    queryKey: ["newsArticles", coinName],
    queryFn: ({ pageParam }) => getNewsArticles(coinName, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: "",
  });

  // ===== DERIVED STATE =====
  const numPosts = newsArticlesQuery.data
    ? newsArticlesQuery.data.pages[0].totalResults
    : 0;

  return (
    <Card className="flex-1 gap-0 overflow-hidden rounded-[18px] border-border p-0 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      {/* ===== HEADER ===== */}
      <div className="flex items-end justify-between gap-4 border-b border-border px-6 pt-5.5 pb-4.5">
        {/* ===== TITLE ===== */}
        <div className="flex flex-col gap-2">
          <p className="font-mono text-[11px] leading-none font-semibold tracking-[0.06em] text-muted-foreground uppercase">
            NEWS
          </p>
          <p className="text-[22px] leading-none font-bold text-foreground">
            Recent {coinName} News
          </p>
        </div>
        {/* ===== RESULTS COUNT ===== */}
        {newsArticlesQuery.isLoading ? (
          <CustomSkeleton className="h-5 w-20 rounded-md" />
        ) : newsArticlesQuery.isError ? null : (
          <p className="rounded-md bg-muted px-2 py-1 font-mono text-[10px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
            {numPosts} RESULTS
          </p>
        )}
      </div>

      {/* ===== ARTICLES LIST ===== */}
      {newsArticlesQuery.isLoading ? (
        <div className="flex flex-col pb-8">
          {SKELETON_ITEMS.map((i) => (
            <NewsItemSkeleton key={i} />
          ))}
        </div>
      ) : newsArticlesQuery.isError ? (
        <div className="relative">
          <div className="flex flex-col pb-8 invisible" aria-hidden>
            {SKELETON_ITEMS.map((i) => (
              <NewsItemSkeleton key={i} />
            ))}
          </div>
          <ErrorFallback
            title="Data unavailable"
            description="News articles could not be loaded."
            className="absolute inset-0"
          />
        </div>
      ) : numPosts === 0 ? (
        <div className="relative">
          <div className="flex flex-col pb-8 invisible" aria-hidden>
            {SKELETON_ITEMS.map((i) => (
              <NewsItemSkeleton key={i} />
            ))}
          </div>
          <EmptyFallback
            title="No news yet"
            description={`No recent news for ${coinName}.`}
            className="absolute inset-0"
          />
        </div>
      ) : (
        <InfiniteScroll
          dataLength={newsArticlesQuery.data?.pages.length || 0}
          next={newsArticlesQuery.fetchNextPage}
          hasMore={!!newsArticlesQuery.hasNextPage}
          loader={<span></span>}
          endMessage={
            <p className="pt-8 text-center font-bold">
              You're all caught up.
            </p>
          }
          className="flex flex-col pb-8"
        >
          {newsArticlesQuery.data?.pages.map((page) => {
            return page.results.map((artcl: any) => {
              return <NewsItem key={artcl.article_id} post={artcl} />;
            });
          })}
          {newsArticlesQuery.isFetchingNextPage && (
            <div className="pt-4 w-full flex justify-center">
              <Spinner className="size-10" />
            </div>
          )}
        </InfiniteScroll>
      )}
    </Card>
  );
}
