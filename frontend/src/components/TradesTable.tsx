import { Card } from "@/components/ui/card";
import { type ICellRendererParams, type ColDef } from "ag-grid-community";
import type {
  QueryClient,
  QueryObserverResult,
  RefetchOptions,
} from "@tanstack/react-query";
import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from "@/components/animate-ui/components/animate/tabs";

import DotGreen from "@/assets/dot-green.svg";
import DotAmber from "@/assets/dot-amber.svg";
import DotRed from "@/assets/dot-red.svg";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AgGridReact } from "ag-grid-react";
import { formatRelativeOrAbsoluteDate, numToMoney } from "@/utils";
import CancelOrderBtn from "./CancelOrderBtn";
import { fetchWithRefresh } from "@/lib/api";
import CustomSkeleton from "./CustomSkeleton";
import ErrorFallback from "./ErrorFallback";

// ===== NAVBAR PREFETCH =====
export function prefetchTradesTable(queryClient: QueryClient) {
  return Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["tradeHistory", 1, "all"],
      queryFn: () => fetchTradesHistory(1, "all"),
      staleTime: 30_000,
    }),
    queryClient.prefetchQuery({
      queryKey: ["tradeFilterCounts"],
      queryFn: fetchTradeFilterCounts,
    }),
  ]);
}

// ===== API FUNCTIONS =====
async function fetchTradesHistory(page: number, filter: string) {
  const response = await fetchWithRefresh(
    "http://localhost:5000/get_trades_info",
    {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page, filter }),
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw await response.json();
  }

  return await response.json();
}

async function fetchTradeFilterCounts() {
  const response = await fetchWithRefresh(
    "http://localhost:5000/get_trade_filter_counts",
    {
      method: "get",
      credentials: "include",
    },
  );

  if (!response.ok) throw await response.json();

  return await response.json();
}

// ===== HELPER FUNCTIONS =====
function formatFullTimestamp(unixTimestamp: number): string {
  const date = new Date(unixTimestamp * 1000);

  const months: readonly string[] = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const day = String(date.getDate()).padStart(2, "0");
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day} ${month} ${year} - ${hours}:${minutes}`;
}

// ===== AGGRID CELL RENDERERS =====
const idCellRenderer = (params: ICellRendererParams) => {
  return (
    <span className="font-mono text-[13px] text-muted-foreground">{params.value}</span>
  );
};

const statusRenderer = (params: ICellRendererParams) => {
  const styles: Record<string, string> = {
    open: "bg-[#ecfdf5] text-[#047857] dark:bg-emerald-500/15 dark:text-emerald-400",
    finished:
      "bg-[#fffbeb] text-[#b45309] dark:bg-amber-500/15 dark:text-amber-400",
    cancelled:
      "bg-[#fff1f2] text-[#be123c] dark:bg-rose-500/15 dark:text-rose-400",
  };
  const dotStyles: Record<string, string> = {
    open: "bg-[#10b981]",
    finished: "bg-[#f59e0b]",
    cancelled: "bg-[#f43f5e]",
  };
  const labels: Record<string, string> = {
    open: "ACTIVE",
    finished: "FINISHED",
    cancelled: "CANCELLED",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-1.75 py-px rounded-lg text-[10px] leading-[1.4] font-semibold tracking-[0.06em] uppercase font-mono ${styles[params.value]}`}
    >
      <span
        className={`w-1.25 h-1.25 rounded-full ${dotStyles[params.value]}`}
      />
      {labels[params.value]}
    </span>
  );
};

const orderTypeRenderer = (params: ICellRendererParams) => {
  return (
    <span className="inline-flex items-center px-1.5 py-px border border-border rounded-lg font-mono text-[10px] leading-[1.4] font-semibold uppercase tracking-widest text-foreground bg-background">
      {params.value}
    </span>
  );
};

const transactionTypeRenderer = (params: ICellRendererParams) => {
  const isBuy = params.value === "buy";
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-px rounded-lg text-[10px] leading-[1.4] font-bold tracking-[0.12em] uppercase text-white ${
        isBuy
          ? "bg-[#10b981] dark:bg-emerald-500/20 dark:text-emerald-400"
          : "bg-[#f43f5e] dark:bg-rose-500/20 dark:text-rose-400"
      }`}
    >
      <span className="w-1.25 h-1.25 rounded-full bg-white/50 dark:bg-current/60 animate-pulse" />
      {params.value}
    </span>
  );
};

const coinRenderer = (params: ICellRendererParams) => {
  return (
    <span className="text-[13px] font-semibold uppercase">{params.value}</span>
  );
};

const quantityRenderer = (params: ICellRendererParams) => {
  const isBuy = params.data.transactionType === "buy";
  return (
    <div className="flex items-baseline gap-1.5 font-mono">
      <span
        className={`text-[13px] font-semibold ${isBuy ? "text-[#10b981]" : "text-[#f43f5e]"}`}
      >
        {isBuy ? "+" : "-"}
        {numToMoney(params.value, false, 4)}
      </span>
      <span className="text-[11px] uppercase text-muted-foreground">
        {params.data.ticker}
      </span>
    </div>
  );
};

const priceRenderer = (params: ICellRendererParams) => {
  return (
    <span className="font-mono text-[13px] font-semibold">
      ${numToMoney(params.value)}
    </span>
  );
};

const executionPriceRenderer = (params: ICellRendererParams) => {
  return params.value === -1 ? (
    <span className="font-mono text-[13px] text-muted-foreground/70">—</span>
  ) : (
    <span className="font-mono text-[13px] font-semibold">
      ${numToMoney(params.value)}
    </span>
  );
};

const timestampRenderer = (params: ICellRendererParams) => {
  return (
    <div className="flex flex-col leading-[1.2] font-mono gap-0.5">
      <span className="text-[13px] font-semibold text-foreground uppercase tracking-[0.04em]">
        {formatRelativeOrAbsoluteDate(params.value)}
      </span>
      <span className="text-[11px] text-muted-foreground uppercase tracking-[0.06em]">
        {formatFullTimestamp(params.value)}
      </span>
    </div>
  );
};

const actionRenderer = (
  params: ICellRendererParams,
  refetch: (
    options?: RefetchOptions,
  ) => Promise<QueryObserverResult<unknown, Error>>,
) => {
  return params.data.status === "open" ? (
    <CancelOrderBtn transaction_id={params.data.id} refetch={refetch} />
  ) : (
    <span className="font-mono text-[13px] text-muted-foreground/70">—</span>
  );
};

const commentRenderer = (params: ICellRendererParams) => {
  return params.value === "" ? (
    <span className="text-[13px] text-muted-foreground/70 italic">No description</span>
  ) : (
    <span className="text-[13px] text-foreground leading-[1.35] line-clamp-2">
      {params.value}
    </span>
  );
};

export default function TradesTable() {
  // ===== STATE VARIABLES =====
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<
    "all" | "open" | "cancelled" | "finished"
  >("all");
  const [hoveredTab, setHoveredTab] = useState<
    "all" | "open" | "cancelled" | "finished" | undefined
  >(undefined);

  // ===== REACT QUERY HOOKS =====
  const tradeHistoryQuery = useQuery({
    queryKey: ["tradeHistory", page, filter],
    queryFn: () => fetchTradesHistory(page, filter),
  });

  const tradeFilterCountsQuery = useQuery({
    queryKey: ["tradeFilterCounts"],
    queryFn: fetchTradeFilterCounts,
  });

  // ===== DERIVED STATE =====
  const tradeHistoryIsError = tradeHistoryQuery.isError;
  const tradeFilterCountsIsError = tradeFilterCountsQuery.isError;
  const tradeHistoryData = tradeHistoryIsError
    ? undefined
    : tradeHistoryQuery.data;
  const maxPages = tradeHistoryData?.maxPages;
  const filterCounts = tradeFilterCountsIsError
    ? undefined
    : tradeFilterCountsQuery.data;

  // ===== AGGRID DATA =====
  const rowData = tradeHistoryData?.data;
  const columnDefs: ColDef[] = [
    {
      headerName: "#",
      valueGetter: (params) => (params.node?.rowIndex ?? -1) + 1,
      width: 110,
      cellRenderer: idCellRenderer,
    },
    { field: "status", cellRenderer: statusRenderer, width: 145 },
    { field: "orderType", cellRenderer: orderTypeRenderer, width: 110 },
    {
      field: "transactionType",
      headerName: "Buy / Sell",
      cellRenderer: transactionTypeRenderer,
      width: 110,
    },
    {
      field: "coin_id",
      headerName: "Coin",
      cellRenderer: coinRenderer,
      width: 110,
    },
    { field: "quantity", cellRenderer: quantityRenderer, width: 140 },
    {
      field: "price_per_unit",
      headerName: "Price",
      cellRenderer: priceRenderer,
      width: 140,
    },
    {
      field: "price_at_execution",
      headerName: "Execution Price",
      cellRenderer: executionPriceRenderer,
      width: 170,
    },
    {
      field: "timestamp",
      headerName: "Time Placed",
      cellRenderer: timestampRenderer,
      width: 180,
    },
    {
      field: "action",
      cellRenderer: (params: ICellRendererParams) =>
        actionRenderer(params, tradeHistoryQuery.refetch),
      width: 80,
    },
    {
      field: "comment",
      cellRenderer: commentRenderer,
      flex: 1,
      minWidth: 200,
    },
  ];

  // ===== EVENT HANDLERS =====
  function handlePrevBtnClick() {
    if (page !== 1) setPage((prev) => prev - 1);
  }

  function handleNextBtnClick() {
    if (page !== maxPages) setPage((prev) => prev + 1);
  }

  // ===== AGGRID PANEL ===== */
  const gridClassName = `
    ag-theme-alpine trades-grid w-full
    [--ag-font-family:'DM_Sans',sans-serif]
    [--ag-font-size:13px]
    [--ag-foreground-color:#111] dark:[--ag-foreground-color:#fafafa]
    [--ag-background-color:transparent]
    [--ag-header-background-color:transparent]
    [--ag-header-foreground-color:#71717a] dark:[--ag-header-foreground-color:#a1a1aa]
    [--ag-border-color:#f0f0f0] dark:[--ag-border-color:#27272a]
    [--ag-row-border-color:#f0f0f0] dark:[--ag-row-border-color:#27272a]
    [--ag-row-hover-color:#fafafa] dark:[--ag-row-hover-color:#1a1a1d]
    [--ag-selected-row-background-color:transparent]
    [--ag-cell-horizontal-padding:18px]
    [--ag-header-column-separator-display:none]
    [--ag-header-column-resize-handle-display:none]
    [--ag-header-height:38px]
    [--ag-row-height:60px]
    [&_.ag-header-cell-text]:font-mono
    [&_.ag-header-cell-text]:text-[11px]
    [&_.ag-header-cell-text]:font-semibold
    [&_.ag-header-cell-text]:tracking-[0.06em]
    [&_.ag-header-cell-text]:uppercase
    [&_.ag-root-wrapper]:border-0
    [&_.ag-header]:border-b [&_.ag-header]:border-border
  `;

  const skeletonGrid = (
    <div className="px-6">
      <div className="border border-border rounded-md overflow-hidden">
        {/* fake header to match AG Grid header height */}
        <div className="h-9.5 border-b border-border" />
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            className="h-15 flex items-center gap-4 px-4.5 border-b border-border last:border-b-0"
          >
            <CustomSkeleton className="h-4 w-6" />
            <CustomSkeleton className="h-4 w-20 rounded-lg" />
            <CustomSkeleton className="h-4 w-14 rounded-lg" />
            <CustomSkeleton className="h-4 w-12 rounded-lg" />
            <CustomSkeleton className="h-4 w-12" />
            <CustomSkeleton className="h-4 w-24" />
            <CustomSkeleton className="h-4 w-16" />
            <CustomSkeleton className="h-4 w-16" />
            <CustomSkeleton className="h-4 w-28" />
            <CustomSkeleton className="h-4 w-8" />
            <CustomSkeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );

  const errorGrid = (
    <div className="px-6">
      <div className="border border-border rounded-md overflow-hidden">
        {/* fake header to match AG Grid header height */}
        <div className="h-9.5 border-b border-border" />
        <ErrorFallback
          title="Data unavailable"
          description="Trade history could not be loaded."
          className="h-150"
        />
      </div>
    </div>
  );

  const grid = tradeHistoryQuery.isLoading ? (
    skeletonGrid
  ) : tradeHistoryIsError ? (
    errorGrid
  ) : (
    <div className={`${gridClassName} px-6`}>
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={{
          cellStyle: { display: "flex", alignItems: "center" },
        }}
        pagination={false}
        suppressCellFocus
        domLayout="autoHeight"
      />
    </div>
  );

  const triggerBase =
    "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer text-[#11111199] data-[state=active]:text-foreground hover:text-foreground capitalize";

  return (
    <Tabs
      value={filter}
      onValueChange={(value) => setFilter(value as typeof filter)}
    >
      <Card className="p-0 gap-0 overflow-hidden rounded-[18px] border-border shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        {/* ===== HEADER ===== */}
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-5">
          {/* ===== TITLE & RECORD COUNT ===== */}
          <div className="flex flex-col gap-2 min-w-0">
            <p className="font-mono text-[13px] font-normal uppercase text-muted-foreground tracking-[0.01em] m-0">
              My Trades
            </p>
            <div className="flex items-baseline gap-2">
              {tradeFilterCountsQuery.isLoading ? (
                <CustomSkeleton className="h-8 w-14 translate-y-1.5" />
              ) : tradeFilterCountsIsError ? (
                <span className="text-[32px] font-bold tracking-[-0.02em] leading-none text-muted-foreground/70">
                  —
                </span>
              ) : (
                <span className="text-[32px] font-bold tracking-[-0.02em] leading-none text-foreground">
                  {filterCounts?.[filter] ?? 0}
                </span>
              )}
              <span className="text-sm text-muted-foreground">records</span>
            </div>
          </div>

          {/* ===== FILTER TABS ===== */}
          <TabsList className="h-auto bg-muted p-0.75 rounded-lg gap-0.5">
            {/* ===== ALL FILTER ===== */}
            <TabsTrigger
              value="all"
              className={triggerBase}
              onHoverStart={() => setHoveredTab("all")}
              onHoverEnd={() => setHoveredTab(undefined)}
            >
              All
              {filterCounts !== undefined ? (
                <span className="px-1.25 py-px rounded-md bg-muted text-foreground text-[10px] font-mono font-semibold leading-[1.4]">
                  {filterCounts.all}
                </span>
              ) : tradeFilterCountsIsError ? (
                <span className="px-1.25 py-px rounded-md bg-muted text-muted-foreground/70 text-[10px] font-mono font-semibold leading-[1.4]">
                  —
                </span>
              ) : (
                <CustomSkeleton className="h-3.5 w-4 rounded-md" />
              )}
            </TabsTrigger>
            {/* ===== STATUS FILTERS ===== */}
            {(
              [
                ["open", DotGreen],
                ["finished", DotAmber],
                ["cancelled", DotRed],
              ] as const
            ).map(([key, imgUrl]) => (
              <TabsTrigger
                key={key}
                value={key}
                className={triggerBase}
                onHoverStart={() => setHoveredTab(key)}
                onHoverEnd={() => setHoveredTab(undefined)}
              >
                <img className="w-1.5 h-1.5" src={imgUrl} />
                {key === "open" ? "active" : key}
                {filterCounts !== undefined ? (
                  <span className="px-1.25 py-px rounded-md bg-muted text-foreground text-[10px] font-mono font-semibold leading-[1.4] normal-case">
                    {filterCounts[key]}
                  </span>
                ) : tradeFilterCountsIsError ? (
                  <span className="px-1.25 py-px rounded-md bg-muted text-muted-foreground/70 text-[10px] font-mono font-semibold leading-[1.4] normal-case">
                    —
                  </span>
                ) : (
                  <CustomSkeleton className="h-3.5 w-4 rounded-md" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* ===== AGGRID PANELS ===== */}
        <TabsContents className="pb-4">
          <TabsContent value="all">
            {(filter === "all" || hoveredTab === "all") && grid}
          </TabsContent>
          <TabsContent value="open">
            {(filter === "open" || hoveredTab === "open") && grid}
          </TabsContent>
          <TabsContent value="finished">
            {(filter === "finished" || hoveredTab === "finished") && grid}
          </TabsContent>
          <TabsContent value="cancelled">
            {(filter === "cancelled" || hoveredTab === "cancelled") && grid}
          </TabsContent>
        </TabsContents>

        {/* ===== DIVIDER ===== */}
        <div className="h-px bg-muted w-full" />

        {/* ===== PAGINATION ===== */}
        <div className="flex items-center justify-between px-6 py-3.5">
          {/* ===== PAGE INDICATOR ===== */}
          {tradeHistoryQuery.isLoading ? (
            <CustomSkeleton className="h-3 w-24" />
          ) : tradeHistoryIsError ? (
            <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground/70">
              Page — of —
            </p>
          ) : (
            <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
              Page {page} of {maxPages}
            </p>
          )}
          {/* ===== PREV / NEXT BUTTONS ===== */}
          <div className="inline-flex items-center gap-1.5">
            <p
              className={`font-mono text-[11px] uppercase tracking-[0.06em] px-3 py-1.5 border border-border rounded-md bg-background cursor-pointer hover:border-[#71717a] ${page === 1 || tradeHistoryIsError ? "opacity-40 cursor-not-allowed text-foreground" : "text-foreground"}`}
              onClick={tradeHistoryIsError ? undefined : handlePrevBtnClick}
            >
              Prev
            </p>
            <p
              className={`font-mono text-[11px] uppercase tracking-[0.06em] px-3 py-1.5 border border-border rounded-md bg-background cursor-pointer hover:border-[#71717a] ${page === maxPages || tradeHistoryIsError ? "opacity-40 cursor-not-allowed text-foreground" : "text-foreground"}`}
              onClick={tradeHistoryIsError ? undefined : handleNextBtnClick}
            >
              Next
            </p>
          </div>
        </div>
      </Card>
    </Tabs>
  );
}
