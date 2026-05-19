import { Card } from "../ui/card";
import InfiniteScroll from "react-infinite-scroll-component";
import { Spinner } from "../ui/spinner";
import { useInfiniteQuery } from "@tanstack/react-query";
import NewsItem from "./NewsItem";

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

// ===== API FUNCTIONS =====
async function getNewsArticles(coinName: string, nextPage: string) {
  const response = await fetch("http://localhost:5000/get_news_articles", {
    method: "post",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: coinName, nextPage: nextPage }),
    credentials: "include",
  });

  if (!response.ok) {
    throw foo;
  }

  return await response.json();
}

export default function NewsFeed({ coinName }: NewsFeedProps) {
  // ===== REACTQUERY HOOKS =====
  const newsArticlesQuery = useInfiniteQuery({
    queryKey: ["news-articles", coinName],
    queryFn: ({ pageParam }) => getNewsArticles(coinName, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: "",
  });

  // ===== DERIVED STATE =====
  const numPosts = newsArticlesQuery.data
    ? newsArticlesQuery.data.pages[0].totalResults
    : 0;

  return (
    <Card className="flex-1 gap-0 overflow-hidden rounded-[18px] border-[#f0f0f0] p-0 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      {/* ===== HEADER ===== */}
      <div className="flex items-end justify-between gap-4 border-b border-[#f0f0f0] px-6 pt-5.5 pb-4.5">
        {/* ===== TITLE ===== */}
        <div className="flex flex-col gap-2">
          <p className="font-mono text-[11px] leading-none font-semibold tracking-[0.06em] text-[#71717a] uppercase">
            NEWS
          </p>
          <p className="text-[22px] leading-none font-bold text-[#111111]">
            Recent {coinName} News
          </p>
        </div>
        {/* ===== RESULTS COUNT ===== */}
        <p className="rounded-md bg-[#ececef] px-2 py-1 font-mono text-[10px] font-semibold tracking-[0.06em] text-[#71717a] uppercase">
          {numPosts} RESULTS
        </p>
      </div>

      {/* ===== ARTICLES LIST ===== */}
      <InfiniteScroll
        dataLength={newsArticlesQuery.data?.pages.length || 0}
        next={newsArticlesQuery.fetchNextPage}
        hasMore={!!newsArticlesQuery.hasNextPage}
        loader={<span></span>}
        endMessage={
          <p style={{ textAlign: "center" }}>
            <b>You're all caught up.</b>
          </p>
        }
        className="flex flex-col pb-8"
      >
        {newsArticlesQuery.data?.pages.map((page) => {
          return page.results.map((artcl) => {
            return <NewsItem key={artcl.article_id} post={artcl} />;
          });
        })}
        {newsArticlesQuery.isFetching && (
          <div className="pt-4 w-full flex justify-center">
            <Spinner className="size-10" />
          </div>
        )}
      </InfiniteScroll>
    </Card>
  );
}
