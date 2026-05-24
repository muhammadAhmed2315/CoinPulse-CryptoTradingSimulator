import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatRelativeOrAbsoluteDate, numToMoney } from "@/utils";
import BannerFlickerGrid from "./BannerFlickerGrid";
import ProfileAvatar from "./ProfileAvatar";
import TradePill from "./TradePill";
import LikeButton from "./LikeButton";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { fetchWithRefresh } from "@/lib/api";

// ===== API FUNCTIONS =====
async function updateLikes(transactionID: string, isIncrement: boolean) {
  const response = await fetchWithRefresh("http://localhost:5000/update_likes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transactionID, isIncrement }),
    credentials: "include",
  });

  if (!response.ok) throw await response.json();

  return await response.json();
}

// ===== TYPES =====
type FeedPostProps = {
  coin_id: string;
  comment: string;
  curr_user_liked: boolean;
  id: string;
  likes: number;
  order_type: string;
  price_per_unit: number;
  quantity: number;
  timestamp: number;
  transaction_type: string;
  username: string;
};

export default function FeedPost({
  coin_id,
  comment,
  curr_user_liked,
  id,
  likes,
  order_type,
  price_per_unit,
  quantity,
  timestamp,
  transaction_type,
  username,
}: FeedPostProps) {
  const [currentlyLiked, setCurrentlyLiked] = useState(curr_user_liked);
  const [currLikes, setCurrLikes] = useState(likes);

  // ===== INTERSECTION OBSERVER API =====
  const [ref, inView] = useInView();

  // ===== REACT QUERY HOOKS =====
  const queryClient = useQueryClient();

  const likeButtonQuery = useMutation({
    mutationFn: (isIncrement: boolean) => updateLikes(id, isIncrement),

    onMutate: (isIncrement: boolean) => {
      const prevLiked = currentlyLiked;
      const prevLikes = currLikes;

      setCurrentlyLiked(isIncrement);
      setCurrLikes((prev) => (isIncrement ? prev + 1 : prev - 1));

      return { prevLiked, prevLikes }; // this becomes `context`
    },

    onError: (_err, _vars, context) => {
      if (context) {
        setCurrentlyLiked(context.prevLiked);
        setCurrLikes(context.prevLikes);
      }
    },

    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["globalFeedPosts"] }),
        queryClient.invalidateQueries({ queryKey: ["privateFeedPosts"] }),
      ]);
    },
  });

  return (
    <Card className="p-6 mb-6 gap-4" ref={ref}>
      {/* ===== HEADER ===== */}
      <CardHeader className="p-0">
        <div className="flex gap-4 items-center">
          {inView && <ProfileAvatar letter={username} />}
          <div>
            <b>{username}</b>
            <p className="text-[#b4b4b4] font-mono">
              {formatRelativeOrAbsoluteDate(timestamp)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* ===== TRADE BANNER ===== */}
        <div className="relative h-13 rounded-md bg-[#fafafa] mb-4">
          {inView && (
            <BannerFlickerGrid
              squareSize={3}
              gridGap={4}
              flickerChance={0.3}
              maxOpacity={0.1}
            />
          )}
          <div className="relative z-1 flex items-center h-full px-4 justify-between">
            <div className="flex gap-2 items-center ">
              {transaction_type && (
                <TradePill
                  side={transaction_type.toUpperCase() as "BUY" | "SELL"}
                  type={order_type}
                />
              )}
              <p
                className={`text-lg font-semibold font-mono ${transaction_type?.toUpperCase() === "BUY" ? "text-emerald-500" : "text-rose-500"}`}
              >
                {transaction_type?.toUpperCase() === "BUY" ? "+" : "-"}
                {quantity?.toFixed(4)}
              </p>
              <p className="text-[#71717a] font-medium capitalize">
                {coin_id && coin_id} @ ${numToMoney(price_per_unit)}
              </p>
            </div>
            <p
              className={`font-mono text-base font-semibold ${transaction_type?.toUpperCase() === "BUY" ? "text-emerald-500" : "text-rose-500"}`}
            >
              ≈ ${numToMoney(price_per_unit * quantity)}
            </p>
          </div>
        </div>
        {/* ===== COMMENT ===== */}
        {comment && <p className="text-lg text-[#3f3f46]">{comment}</p>}
        {!comment && (
          <p className="text-lg text-[#a0a0a0] italic">
            This trade has no description.
          </p>
        )}
      </CardContent>
      <Separator />
      {/* ===== FOOTER ===== */}
      <CardFooter className="p-0 flex justify-end">
        <LikeButton
          liked={currentlyLiked}
          count={currLikes}
          onToggle={() => likeButtonQuery.mutate(!currentlyLiked)}
        />
      </CardFooter>
    </Card>
  );
}
