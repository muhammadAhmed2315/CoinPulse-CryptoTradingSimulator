import { Card } from "@/components/ui/card";
import { type ICellRendererParams, type ColDef } from "ag-grid-community";
import type {
  QueryObserverResult,
  RefetchOptions,
} from "@tanstack/react-query";
import {
  RippleButton,
  RippleButtonRipples,
} from "@/components/animate-ui/components/buttons/ripple";

import DotGreen from "@/assets/dot-green.svg";
import DotAmber from "@/assets/dot-amber.svg";
import DotRed from "@/assets/dot-red.svg";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AgGridReact } from "ag-grid-react";
import { formatRelativeOrAbsoluteDate, numToMoney } from "@/utils";
import CancelOrderBtn from "./CancelOrderBtn";

// ===== API FUNCTIONS =====
async function fetchTradesHistory(page: number, filter: string) {
  const response = await fetch("http://localhost:5000/get_trades_info", {
    method: "post",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ page, filter }),
    credentials: "include",
  });

  if (!response.ok) {
    throw await response.json();
  }

  return await response.json();
}

async function fetchTradeFilterCounts() {
  const response = await fetch(
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
    <span className="font-mono text-[12px] text-[#71717a]">{params.value}</span>
  );
};

const statusRenderer = (params: ICellRendererParams) => {
  const styles: Record<string, string> = {
    open: "bg-[#ecfdf5] text-[#047857]",
    finished: "bg-[#fffbeb] text-[#b45309]",
    cancelled: "bg-[#fff1f2] text-[#be123c]",
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
    <span className="inline-flex items-center px-1.5 py-px border border-[#ececef] rounded-lg font-mono text-[10px] leading-[1.4] font-semibold uppercase tracking-widest text-[#111] bg-white">
      {params.value}
    </span>
  );
};

const transactionTypeRenderer = (params: ICellRendererParams) => {
  const isBuy = params.value === "buy";
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-px rounded-lg text-[10px] leading-[1.4] font-bold tracking-[0.12em] uppercase text-white ${
        isBuy ? "bg-[#10b981]" : "bg-[#f43f5e]"
      }`}
    >
      <span className="w-1.25 h-1.25 rounded-full bg-white/50 animate-pulse" />
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
      <span className="text-[11px] uppercase text-[#71717a]">
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
    <span className="font-mono text-[13px] text-[#a0a0a0]">—</span>
  ) : (
    <span className="font-mono text-[13px] font-semibold">
      ${numToMoney(params.value)}
    </span>
  );
};

const timestampRenderer = (params: ICellRendererParams) => {
  return (
    <div className="flex flex-col leading-[1.2] font-mono">
      <span className="text-[12px] font-semibold text-[#111] uppercase tracking-[0.04em]">
        {formatRelativeOrAbsoluteDate(params.value)}
      </span>
      <span className="text-[10px] text-[#71717a] uppercase tracking-[0.06em]">
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
    <span className="font-mono text-[13px] text-[#a0a0a0]">—</span>
  );
};

const commentRenderer = (params: ICellRendererParams) => {
  return params.value === "" ? (
    <span className="text-[12px] text-[#a0a0a0] italic">No description</span>
  ) : (
    <span className="text-[12px] text-[#3f3f46] leading-[1.35] line-clamp-2">
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

  // ===== REACT QUERY HOOKS =====
  const tradeHistoryQuery = useQuery({
    queryKey: ["trade-history", page, filter],
    queryFn: () => fetchTradesHistory(page, filter),
  });

  const tradeFilterCountsQuery = useQuery({
    queryKey: ["trade-filter-counts"],
    queryFn: fetchTradeFilterCounts,
  });

  // ===== DERIVED STATE =====
  const maxPages = tradeHistoryQuery.data?.maxPages;
  const filterCounts = tradeFilterCountsQuery.data;

  // ===== AGGRID DATA =====
  const rowData = tradeHistoryQuery.data?.data;
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
      autoHeight: true,
      width: 180,
      cellStyle: { display: "flex", alignItems: "center" },
    },
    {
      field: "action",
      cellRenderer: (params: ICellRendererParams) =>
        actionRenderer(params, tradeHistoryQuery.refetch),
      width: 80,
      cellStyle: { display: "flex", alignItems: "center" },
    },
    {
      field: "comment",
      cellRenderer: commentRenderer,
      flex: 1,
      minWidth: 200,
      cellStyle: { display: "flex", alignItems: "center" },
    },
  ];

  // ===== EVENT HANDLERS =====
  function handlePrevBtnClick() {
    if (page !== 1) setPage((prev) => prev - 1);
  }

  function handleNextBtnClick() {
    if (page !== maxPages) setPage((prev) => prev + 1);
  }

  return (
    <Card className="p-0 gap-0 overflow-hidden rounded-xl border-[#f0f0f0] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      {/* ===== HEADER ===== */}
      <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-5">
        {/* ===== TITLE & RECORD COUNT ===== */}
        <div className="flex flex-col gap-2 min-w-0">
          <p className="font-mono text-[13px] font-normal uppercase text-[#71717a] tracking-[0.01em] m-0">
            My Trades
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-[32px] font-bold tracking-[-0.02em] leading-none text-[#111]">
              {filterCounts?.[filter] ?? 0}
            </span>
            <span className="text-sm text-[#71717a]">records</span>
          </div>
        </div>

        {/* ===== FILTER BUTTONS ===== */}
        <div className="inline-flex items-center bg-[#f4f4f5] p-0.75 rounded-lg gap-0.5">
          {/* ===== ALL FILTER ===== */}
          <RippleButton
            className={`inline-flex! items-center! gap-1.5! px-3! py-1.5! text-xs! font-medium! rounded-md! border! shadow-none! cursor-pointer ${
              filter === "all"
                ? "bg-white! text-[#111]! border-black/5! shadow-[0_1px_2px_rgba(0,0,0,0.06)]!"
                : "bg-transparent! text-[#11111199]! border-transparent! hover:text-[#111]!"
            }`}
            onClick={() => setFilter("all")}
          >
            All
            {filterCounts !== undefined && (
              <span className="px-1.25 py-px rounded-md bg-[#ececef] text-[#111] text-[10px] font-mono font-semibold leading-[1.4]">
                {filterCounts.all}
              </span>
            )}
            <RippleButtonRipples />
          </RippleButton>
          {/* ===== STATUS FILTERS ===== */}
          {(
            [
              ["open", DotGreen],
              ["finished", DotAmber],
              ["cancelled", DotRed],
            ] as const
          ).map(([key, imgUrl]) => {
            return (
              <RippleButton
                key={key}
                className={`inline-flex! items-center! gap-1.5! px-3! py-1.5! text-xs! font-medium! rounded-md! border! shadow-none! cursor-pointer capitalize ${
                  filter === key
                    ? "bg-white! text-[#111]! border-black/5! shadow-[0_1px_2px_rgba(0,0,0,0.06)]!"
                    : "bg-transparent! text-[#11111199]! border-transparent! hover:text-[#111]!"
                }`}
                onClick={() => setFilter(key)}
              >
                <img className="w-1.5 h-1.5" src={imgUrl} />
                {key === "open" ? "active" : key}
                {filterCounts !== undefined && (
                  <span className="px-1.25 py-px rounded-md bg-[#ececef] text-[#111] text-[10px] font-mono font-semibold leading-[1.4] normal-case">
                    {filterCounts[key]}
                  </span>
                )}
                <RippleButtonRipples />
              </RippleButton>
            );
          })}
        </div>
      </div>

      {/* ===== DIVIDER ===== */}
      <div className="h-px bg-[#f0f0f0] w-full" />

      {/* ===== AGGRID TABLE ===== */}
      <div className="ag-theme-alpine trades-grid w-full h-187.5 [--ag-font-family:'DM_Sans',sans-serif] [--ag-foreground-color:#111] [--ag-background-color:transparent] [--ag-header-background-color:transparent] [--ag-header-foreground-color:#71717a] [--ag-border-color:#f0f0f0] [--ag-row-border-color:#f0f0f0] [--ag-row-hover-color:#fafafa] [--ag-selected-row-background-color:transparent] [--ag-cell-horizontal-padding:18px] [--ag-header-column-separator-display:none] [--ag-header-column-resize-handle-display:none]">
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          pagination={false}
        />
      </div>

      {/* ===== DIVIDER ===== */}
      <div className="h-px bg-[#f0f0f0] w-full" />

      {/* ===== PAGINATION ===== */}
      <div className="flex items-center justify-between px-6 py-3.5">
        {/* ===== PAGE INDICATOR ===== */}
        <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#71717a]">
          Page {page} of {maxPages}
        </p>
        {/* ===== PREV / NEXT BUTTONS ===== */}
        <div className="inline-flex items-center gap-1.5">
          <p
            className={`font-mono text-[11px] uppercase tracking-[0.06em] px-3 py-1.5 border border-[#ececef] rounded-md bg-white cursor-pointer hover:border-[#71717a] ${page === 1 ? "opacity-40 cursor-not-allowed text-[#111]" : "text-[#111]"}`}
            onClick={handlePrevBtnClick}
          >
            Prev
          </p>
          <p
            className={`font-mono text-[11px] uppercase tracking-[0.06em] px-3 py-1.5 border border-[#ececef] rounded-md bg-white cursor-pointer hover:border-[#71717a] ${page === maxPages ? "opacity-40 cursor-not-allowed text-[#111]" : "text-[#111]"}`}
            onClick={handleNextBtnClick}
          >
            Next
          </p>
        </div>
      </div>
    </Card>
  );
}
