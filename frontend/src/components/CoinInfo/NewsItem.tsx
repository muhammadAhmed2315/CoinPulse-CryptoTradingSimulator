import type { NewsArticle } from "./NewsFeed";

// ===== TYPES =====
type NewsItemProps = {
  post: NewsArticle;
};

export default function NewsItem({ post }: NewsItemProps) {
  return (
    <div className="border-b border-border last:border-b-0">
      <a
        className="block"
        href={post.link}
        rel="noopener noreferrer"
        target="_blank"
      >
        <div className="flex gap-3.5 px-6 py-4.5 hover:bg-muted">
          {/* ===== THUMBNAIL ===== */}
          {post.image_url ? (
            <img
              src={post.image_url}
              className="size-21 shrink-0 rounded-[10px] border border-border bg-muted object-cover"
            />
          ) : (
            <div className="size-21 flex flex-col items-center justify-center gap-1.5 p-2 rounded-[10px] border border-border bg-muted shrink-0">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                xmlns="http://www.w3.org/2000/svg"
                className="w-6.5 h-6.5 text-muted-foreground/70"
              >
                <rect x="3" y="5" width="18" height="14" rx="2.5" />
                <circle cx="9" cy="10" r="1.4" />
                <path d="M21 16l-4.5-4.5a2 2 0 0 0-2.8 0L4 21" />
                <line x1="3" y1="3" x2="21" y2="21" />
              </svg>
              <span className="font-mono text-[8px] font-semibold tracking-[0.08em] uppercase text-muted-foreground text-center leading-[1.1]">
                No Image
              </span>
            </div>
          )}

          {/* ===== BODY ===== */}
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            {/* ===== META ===== */}
            <div className="flex items-center gap-2.5 font-mono text-[10px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
              <span>{post.source_name}</span>
              <span className="inline-block size-0.75 shrink-0 overflow-hidden rounded-full bg-muted-foreground text-transparent">
                .
              </span>
              <span>
                {post.pubDate} {post.pubDateTZ}
              </span>
            </div>

            {/* ===== TITLE ===== */}
            <div>
              <p className="line-clamp-2 text-[14px] leading-[1.4] font-semibold text-foreground">
                {post.title}
              </p>
            </div>

            {/* ===== DESCRIPTION ===== */}
            <p className="line-clamp-2 text-[12px] leading-[1.45] text-muted-foreground">
              {post.description}
            </p>

            {/* ===== SOURCE LINK ===== */}
            <span className="mt-0.5 font-mono text-[11px] font-medium text-muted-foreground w-fit hover:underline">
              Go to {post.source_name} →
            </span>
          </div>
        </div>
      </a>
    </div>
  );
}
