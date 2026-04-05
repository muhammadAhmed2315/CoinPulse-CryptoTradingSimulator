import { useEffect, useState } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";
import formatCompactValue, { numToMoney, toTitleCase } from "@/utils";
import SparklineGraph from "./SparklineGraph";
import { Spinner } from "./ui/spinner";
import { Separator } from "./ui/separator";
import PlayUSD from "@/assets/play-usd.svg";
import CustomTooltip from "./CustomTooltip";
import { Field } from "./ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group";
import { Textarea } from "./ui/textarea";
import {
  RippleButton,
  RippleButtonRipples,
} from "./animate-ui/components/buttons/ripple";
import { Switch } from "./ui/switch";
import PriceChangeBox from "./PriceChangeBox";
import CustomSkeleton from "./CustomSkeleton";

type OrderSide = "BUY" | "SELL";
type OrderType = "MARKET" | "LIMIT" | "STOP";
type BalancePercentage = 0.1 | 0.25 | 0.5 | 0.75 | 1 | undefined;

async function getCoinInfo(coinId: string = "bitcoin") {
  const response = await fetch(
    `http://localhost:5000/get_coin_data/${coinId}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!response.ok) throw await response.json();

  return await response.json();
}

async function getCoinSparkline(coinId: string = "bitcoin") {
  const response = await fetch(
    `http://localhost:5000/get_coin_sparkline/${coinId}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!response.ok) throw await response.json();

  return await response.json();
}

async function getUserBalance() {
  const response = await fetch("http://localhost:5000/get_user_balance", {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) throw await response.json();

  return await response.json();
}

async function getCoinBalance(coinId: string = "bitcoin") {
  const response = await fetch(
    `http://localhost:5000/get_coin_balance/${coinId}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!response.ok) throw await response.json();

  return await response.json();
}

async function placeOrder(
  orderSide: OrderSide,
  orderType: OrderType,
  quantity: string,
  coin_id: string,
  pricePerUnit: number,
  visibility: boolean,
  comment: string,
) {
  const data = {
    transactionType: orderSide.toLowerCase(),
    orderType: orderType.toLowerCase(),
    quantity: parseFloat(quantity),
    coin_id: coin_id,
    price_per_unit: pricePerUnit,
    visibility: visibility,
    comment: comment,
  };

  const response = await fetch("http://localhost:5000/process_order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });

  if (!response.ok) throw await response.json();

  return await response.json();
}

export default function NewTradeCard() {
  const [coinTicker, setCoinTicker] = useState("BTC");
  const [coinName, setCoinName] = useState("Bitcoin");
  const [orderSide, setOrderSide] = useState<OrderSide>("BUY");
  const [orderType, setOrderType] = useState<OrderType>("MARKET");
  const [balancePercentage, setBalancePercentage] =
    useState<BalancePercentage>();
  const [usdAmount, setUsdAmount] = useState("");
  const [coinAmount, setCoinAmount] = useState("");
  const [shareOnTimeline, setShareOnTimeline] = useState(false);
  const [timelineMsg, setTimelineMsg] = useState("");
  const [orderPrice, setOrderPrice] = useState("");
  const [orderPriceTouched, setOrderPriceTouched] = useState(false);
  const [successTimer, setSuccessTimer] = useState(-1);
  const [errorTimer, setErrorTimer] = useState(-1);

  const invalidTimelineMsg = shareOnTimeline && timelineMsg === "";

  const amountZero = usdAmount !== "" && parseFloat(usdAmount) === 0;

  const orderPriceEmpty =
    (orderType === "LIMIT" || orderType === "STOP") &&
    orderPriceTouched &&
    orderPrice === "";
  const orderPriceZero =
    (orderType === "LIMIT" || orderType === "STOP") &&
    orderPriceTouched &&
    orderPrice !== "" &&
    parseFloat(orderPrice) === 0;

  const placeOrderMutation = useMutation({
    mutationFn: () =>
      placeOrder(
        orderSide,
        orderType,
        coinAmount,
        "bitcoin",
        coinDataQuery.data[0].current_price,
        shareOnTimeline,
        timelineMsg,
      ),

    onSuccess: () => {
      setSuccessTimer(2);
      setOrderSide("BUY");
      setOrderType("MARKET");
      setUsdAmount("");
      setCoinAmount("");
      setOrderPrice("");
      setBalancePercentage(undefined);
    },

    onError: (e) => {
      setErrorTimer(5);
    },
  });

  useEffect(() => {
    if (successTimer === 0) return;
    const id = setTimeout(() => setSuccessTimer((s) => s - 1), 1_000);
    return () => clearTimeout(id);
  }, [successTimer]);

  useEffect(() => {
    if (errorTimer === 0) return;
    const id = setTimeout(() => setErrorTimer((s) => s - 1), 1_000);
    return () => clearTimeout(id);
  }, [errorTimer]);

  const coinDataQuery = useQuery({
    queryKey: ["coin-info"],
    queryFn: () => getCoinInfo(),
  });

  const sparklineQuery = useQuery({
    queryKey: ["coin-sparkline"],
    queryFn: () => getCoinSparkline(),
  });

  const userBalanceQuery = useQuery({
    queryKey: ["user-balance"],
    queryFn: () => getUserBalance(),
  });

  const coinBalanceQuery = useQuery({
    queryKey: ["coin-balance"],
    queryFn: () => getCoinBalance(),
  });

  const placeOrderBtnDisabled =
    usdAmount >= userBalanceQuery.data ||
    (orderType !== "MARKET" && orderPrice === "") ||
    parseFloat(orderPrice) === 0 ||
    parseFloat(usdAmount) === 0 ||
    usdAmount === "" ||
    parseFloat(coinAmount) === 0 ||
    coinAmount === "";

  function handleUsdAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setBalancePercentage(undefined);
    if (val === "") {
      setUsdAmount("");
      setCoinAmount("");
    } else if (/^\d*\.?\d{0,2}$/.test(val)) {
      setUsdAmount(val);
      setCoinAmount(
        String(parseFloat(val) / coinDataQuery.data[0].current_price),
      );

      const res = [0.1, 0.25, 0.5, 0.75, 1].filter(
        (x) =>
          parseFloat((x * userBalanceQuery.data).toFixed(2)) ===
          parseFloat(val),
      );
      if (res.length > 0) {
        setBalancePercentage(res.at(0) as BalancePercentage);
      }
    }
  }

  function handleCoinAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setBalancePercentage(undefined);
    if (val === "") {
      setCoinAmount("");
      setUsdAmount("");
    } else if (/^\d*\.?\d{0,8}$/.test(val)) {
      const usdValue = parseFloat(val) * coinDataQuery.data[0].current_price;
      setCoinAmount(val);
      setUsdAmount(String(usdValue.toFixed(2)));

      const res = [0.1, 0.25, 0.5, 0.75, 1].filter(
        (x) =>
          parseFloat((x * userBalanceQuery.data).toFixed(2)) ===
          parseFloat(usdValue.toFixed(2)),
      );
      if (res.length > 0) {
        setBalancePercentage(res.at(0) as BalancePercentage);
      }
    }
  }

  function handleShareOnTimelineChange(value: boolean) {
    setShareOnTimeline(value);
    if (!value) {
      setTimelineMsg("");
    }
  }

  function handleBalancePercentageBtnClick(num: BalancePercentage) {
    const currBalancePercentage = balancePercentage;

    if (currBalancePercentage === num) {
      setBalancePercentage(undefined);
      setCoinAmount("");
      setUsdAmount("");
    } else {
      setBalancePercentage(num);
      const usdValue = num! * userBalanceQuery.data;
      setUsdAmount(String(usdValue.toFixed(2)));
      setCoinAmount(
        String((usdValue / coinDataQuery.data[0].current_price).toFixed(8)),
      );
    }
  }

  function handleOrderTypeChange(type: OrderType) {
    setOrderType(type);
    setOrderPrice("");
    setOrderPriceTouched(false);
  }

  function handleOrderPriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    if (/^\d*\.?\d{0,2}$/.test(val)) setOrderPrice(val);
  }

  return (
    <>
      {/* ================ LEFT PANEL ================ */}
      <div className="flex-1 bg-[#fafafa] border-r-gray-100 border-r rounded-l-md p-4">
        <div className="mb-4">
          <h1>SEARCH BOX GOES HERE</h1>
        </div>

        {/* Price + price change */}
        <p className="text-xs tracking-wider text-gray-400">PRICE</p>
        <div className="flex items-center justify-between mb-4">
          <p className="text-3xl font-bold ">
            $
            {coinDataQuery.data
              ? numToMoney(coinDataQuery.data[0].current_price)
              : "Undefined"}
          </p>
          <div className="w-fit ">
            {!coinDataQuery.data ? (
              "Undefined"
            ) : (
              <PriceChangeBox
                priceChange={coinDataQuery.data[0].price_change_percentage_24h}
                fontSize="sm"
              />
            )}
          </div>
        </div>

        {/* Sparkline graph */}
        <div className="flex items-center justify-center h-16 w-80 mb-4">
          {sparklineQuery.isLoading ? (
            <Spinner className="size-7" />
          ) : (
            <SparklineGraph data={sparklineQuery.data} width={320} />
          )}
        </div>

        {/* Information grid (4 boxes) */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-sm bg-white border border-gray-200 p-2">
            <p className="text-xs font-semibold">24H HIGH</p>
            <p className="font-bold">
              $
              {coinDataQuery.data
                ? numToMoney(coinDataQuery.data[0].high_24h)
                : "Undefined"}
            </p>
          </div>
          <div className="rounded-sm bg-white border border-gray-200 p-2">
            <p className="text-xs font-semibold">24H LOW</p>
            <p className="font-bold">
              $
              {coinDataQuery.data
                ? numToMoney(coinDataQuery.data[0].low_24h)
                : "Undefined"}
            </p>
          </div>
          <div className="rounded-sm bg-white border border-gray-200 p-2">
            <p className="text-xs font-semibold">MARKET CAP</p>
            <p className="font-bold">
              {coinDataQuery.data
                ? formatCompactValue(coinDataQuery.data[0].market_cap)
                : "Undefined"}
            </p>
          </div>
          <div className="rounded-sm bg-white border border-gray-200 p-2">
            <p className="text-xs font-semibold">VOLUME</p>
            <p className="font-bold">
              {coinDataQuery.data
                ? formatCompactValue(coinDataQuery.data[0].total_volume)
                : "Undefined"}
            </p>
          </div>
        </div>

        <Separator className="my-4" />

        {/* User's current PlayUSD balance */}
        <div className="flex justify-between items-center mb-2">
          <div>
            <p className="text-xs text-gray-400 ">USD BALANCE</p>
            <p className="font-bold">
              {userBalanceQuery.isLoading ? (
                <CustomSkeleton className="h-6 w-25" />
              ) : (
                `$${numToMoney(userBalanceQuery.data)}`
              )}
            </p>
          </div>
          <img src={PlayUSD} className="size-6.5" />
        </div>

        {/* User's current coin balance */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-400">{coinTicker} BALANCE</p>
            <p className="font-bold">
              {coinBalanceQuery.isLoading ? (
                <CustomSkeleton className="w-25 h-6" />
              ) : (
                <CustomTooltip
                  trigger={`${coinBalanceQuery.data.toFixed(8)}...`}
                  content={coinBalanceQuery.data}
                />
              )}
            </p>
          </div>
          <img src={PlayUSD} className="size-6.5" />
        </div>
      </div>
      {/* ================ RIGHT PANEL ================ */}
      <div className="flex-2 p-4">
        <p className="text-xs tracking-widest mt-2 mb-1 text-gray-400">
          ORDER ENTRY
        </p>
        <p className="font-bold text-xl mb-4">
          {toTitleCase(orderSide)} {coinTicker}
        </p>

        {/* Buy/Sell toggle group */}
        <div className="relative flex w-full py-1.5 mb-4 cursor-pointer bg-[#f5f5f5] rounded-sm overflow-hidden">
          <div
            className={`absolute inset-y-0 w-1/2 rounded-sm transition-all duration-300 ease-in-out ${orderSide === "BUY" ? "left-0 bg-black" : "left-1/2 bg-orange-500"}`}
          />
          <div
            className={`relative flex-1 text-center rounded-sm font-semibold z-10 transition-colors duration-300 ${orderSide === "BUY" ? "text-white" : "text-gray-500"}`}
            onClick={() => setOrderSide("BUY")}
          >
            Buy
          </div>
          <div
            className={`relative flex-1 text-center rounded-sm font-semibold z-10 transition-colors duration-300 ${orderSide === "SELL" ? "text-white" : "text-gray-500"}`}
            onClick={() => setOrderSide("SELL")}
          >
            Sell
          </div>
        </div>

        {/* Market/Limit/Stop toggle group */}
        <div className="flex gap-2 mb-4">
          {["↯ Market", "◎ Limit", "◈ Stop"].map((typeRaw) => {
            const type = typeRaw.slice(2).toUpperCase();
            return (
              <RippleButton
                variant={orderType === type ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => handleOrderTypeChange(type as OrderType)}
              >
                {typeRaw}
                <RippleButtonRipples />
              </RippleButton>
            );
          })}
        </div>

        {/* PlayUSD input */}
        <p className="text-xs text-gray-400 mb-2">TOTAL (USD)</p>
        <Field
          data-invalid={amountZero || usdAmount > userBalanceQuery.data}
          className="bg-[#fafafa] mb-1 gap-1"
        >
          <InputGroup className="h-10">
            <InputGroupInput
              id="inline-start-input"
              placeholder="0.00"
              value={usdAmount}
              onChange={handleUsdAmountChange}
              className="placeholder:font-semibold font-semibold"
              aria-invalid={amountZero || usdAmount > userBalanceQuery.data}
            />
            <InputGroupAddon align="inline-start">
              <img src={PlayUSD} className="size-5" />
            </InputGroupAddon>
          </InputGroup>
        </Field>
        {amountZero && <p className="text-red-500">Amount cannot be zero.</p>}
        {!amountZero && usdAmount > userBalanceQuery.data && (
          <p className="text-red-500">
            Insufficient balance. Please enter a lower amount.
          </p>
        )}
        <div className="mb-2" />

        {/* Balance percentage toggle group */}
        <div className="flex w-full gap-2 mb-4">
          {[0.1, 0.25, 0.5, 0.75, 1].map((num) => {
            return userBalanceQuery.isLoading ? (
              <CustomSkeleton className="w-full h-7.5" />
            ) : (
              <RippleButton
                variant={balancePercentage === num ? "default" : "outline"}
                className="cursor-pointer flex-1"
                onClick={() =>
                  handleBalancePercentageBtnClick(num as BalancePercentage)
                }
              >
                {num * 100}%
                <RippleButtonRipples />
              </RippleButton>
            );
          })}
        </div>

        {/* Coin amount input */}
        {(orderType === "LIMIT" || orderType === "STOP") && (
          <>
            <p className="text-xs mb-2 text-gray-400">
              {orderType} PRICE (USD)
            </p>
            <Field
              data-invalid={orderPriceEmpty || orderPriceZero}
              className="bg-[#fafafa] mb-1 gap-1"
            >
              <InputGroup className="h-10">
                <InputGroupInput
                  id="inline-start-input"
                  placeholder="0.00"
                  value={orderPrice}
                  onChange={(e) => {
                    handleOrderPriceChange(e);
                    setOrderPriceTouched(true);
                  }}
                  className="placeholder:font-bold font-semibold"
                  aria-invalid={orderPriceEmpty || orderPriceZero}
                />
                <InputGroupAddon align="inline-start">
                  <img src={PlayUSD} className="size-5" />
                </InputGroupAddon>
              </InputGroup>
            </Field>
            {orderPriceEmpty && (
              <p className="text-red-500">Please enter a price.</p>
            )}
            {orderPriceZero && (
              <p className="text-red-500">Price cannot be zero.</p>
            )}
            <div className="mb-4" />
          </>
        )}

        {/* Coin amount input */}
        <p className="text-xs mb-2 text-gray-400">AMOUNT ({coinTicker})</p>
        <Field data-invalid={amountZero} className="bg-[#fafafa] gap-1">
          <InputGroup className="h-10">
            <InputGroupInput
              id="inline-start-input"
              placeholder="0"
              value={coinAmount}
              onChange={handleCoinAmountChange}
              className="placeholder:font-bold font-semibold"
              aria-invalid={amountZero}
            />
            <InputGroupAddon align="inline-start">
              <img src={PlayUSD} className="size-5" />
            </InputGroupAddon>
          </InputGroup>
        </Field>
        {amountZero && <p className="text-red-500">Amount cannot be zero.</p>}

        <Separator className="mt-6 mb-4" />

        {/* Share on timeline header*/}
        <div className="flex justify-between mb-2">
          <p className="text-sm text-gray-600">Share Trade on Timeline</p>
          <Switch
            checked={shareOnTimeline}
            onCheckedChange={handleShareOnTimelineChange}
          />
        </div>

        {/* Share on timeline text area */}

        <Field data-invalid={invalidTimelineMsg} className="mb-4 gap-1">
          <Textarea
            className="bg-[#fafafa] w-full h-25 resize-none"
            placeholder="Let others know about your trade..."
            value={timelineMsg}
            onChange={(e) => setTimelineMsg(e.target.value)}
          />
        </Field>

        {/* PLACE ORDER BUTTON */}
        <RippleButton
          variant="default"
          className={`font-bold w-full cursor-pointer ${orderSide === "SELL" && !(successTimer > 0) && !(errorTimer > 0) && "bg-orange-500 hover:bg-orange-600"} ${successTimer > 0 && "bg-emerald-500"} ${errorTimer > 0 && "bg-red-500"}`}
          disabled={
            placeOrderBtnDisabled ||
            placeOrderMutation.isPending ||
            successTimer > 0 ||
            errorTimer > 0
          }
          onClick={() => placeOrderMutation.mutate()}
        >
          {placeOrderMutation.isPending ? (
            <>
              Placing order... <Spinner />
            </>
          ) : successTimer > 0 ? (
            <>Order successfully placed!</>
          ) : errorTimer > 0 ? (
            <>{(placeOrderMutation.error as any)?.error}</>
          ) : (
            <>PLACE {orderSide} ORDER</>
          )}
          <RippleButtonRipples />
        </RippleButton>
      </div>
    </>
  );
}
