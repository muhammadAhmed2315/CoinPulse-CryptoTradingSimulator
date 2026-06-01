import { QueryClient, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useCallback, useMemo, useState } from "react";
import { AgGridReact, type CustomCellRendererProps } from "ag-grid-react";

import type { ColDef, RowClickedEvent } from "ag-grid-community";

import CoinSortDropdown from "@/components/CoinSortDropdown";
import CustomSkeleton from "@/components/CustomSkeleton";
import { Card } from "@/components/ui/card";
import ErrorFallback from "@/components/ErrorFallback";

import SparklineGraph from "@/components/SparklineGraph";
import formatCompactValue, { numToMoney } from "@/utils";
import type { GridApi, GridReadyEvent } from "ag-grid-community";
import { useNavigate } from "react-router";

const maxPages = 10;

// ===== NAVBAR PREFETCH =====
export function prefetchTopCoins(queryClient: QueryClient) {
  return Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["coins", "market_cap_desc"],
      queryFn: () => fetchTopCoins("market_cap_desc"),
    }),
  ]);
}

// ===== TYPES =====
type Coin = {
  current_price: number;
  image: string;
  market_cap: number;
  ath: number;
  atl: number;
  identity: {
    name: string;
    symbol: string;
  };
  price_change_1h: number;
  price_change_7d: number;
  price_change_24h: number;
  sparkline_in_7d: number[];
  total_volume: number;
};

export type ApiSorts =
  | "market_cap_asc"
  | "market_cap_desc"
  | "volume_asc"
  | "volume_desc";

// ===== API FUNCTIONS =====
async function fetchTopCoins(sort_coins_by: string): Promise<Coin[]> {
  const URL = "http://localhost:5000/get_top_coins";
  const body = {
    sort_coins_by: sort_coins_by,
  };
  const response = await axios.post(URL, body, {
    headers: {
      "Content-Type": "application/json",
    },
    withCredentials: true,
  });
  return response.data;
}

// ===== AGGRID CELL RENDERERS =====
function identityRenderer(props: CustomCellRendererProps) {
  return (
    <div className="flex flex-col leading-[1.2] gap-0.5">
      <span className="text-[14px] font-semibold text-foreground">
        {props.value.name}
      </span>
      <span
        className={`
          font-mono text-[11px] uppercase tracking-[0.04em]
          text-muted-foreground
        `}
      >
        {props.value.symbol}
      </span>
    </div>
  );
}

function imageRenderer(props: CustomCellRendererProps) {
  return <img src={props.value} className="size-8 rounded-full" />;
}

function priceRenderer(props: CustomCellRendererProps) {
  return (
    <span className="font-mono text-[13px] font-medium text-foreground tabular-nums">
      ${numToMoney(props.value)}
    </span>
  );
}

function bigNumRenderer(props: CustomCellRendererProps) {
  return (
    <span className="font-mono text-[13px] font-medium text-foreground tabular-nums">
      ${formatCompactValue(props.value)}
    </span>
  );
}

function pctRenderer(props: CustomCellRendererProps) {
  const n = Number(props.value);
  const cls =
    n > 0
      ? "text-[#21c45d]"
      : n < 0
        ? "text-[#ef4444]"
        : "text-muted-foreground";
  const arrow = n > 0 ? "↑" : n < 0 ? "↓" : "";
  return (
    <span className={`font-mono text-[13px] font-semibold tabular-nums ${cls}`}>
      {arrow} {Math.abs(n).toFixed(2)}%
    </span>
  );
}

function sparklineRenderer(props: CustomCellRendererProps) {
  return <SparklineGraph data={props.value} width={300} height={60} />;
}

// ===== CONSTANTS =====
const defaultCellStyle = {
  display: "flex",
  justifyContent: "flex-start",
  alignItems: "center",
};

const sortLabels = {
  market_cap_asc: "market cap (ascending)",
  market_cap_desc: "market cap (descending)",
  volume_asc: "volume (ascending)",
  volume_desc: "volume (descending)",
};

// ===== SKELETON COLUMN SPECS (mirror colDefs widths) =====
const SKELETON_COLS: { cls: string; head: string }[] = [
  { cls: "w-17.5 flex-none", head: "w-4" },
  { cls: "flex-[1.4] min-w-40", head: "w-12" },
  { cls: "flex-1 min-w-30", head: "w-24" },
  { cls: "flex-[0.9] min-w-27.5", head: "w-20" },
  { cls: "flex-1 min-w-35", head: "w-32" },
  { cls: "flex-[0.9] min-w-27.5", head: "w-22" },
  { cls: "flex-1 min-w-30", head: "w-24" },
  { cls: "flex-[0.9] min-w-27.5", head: "w-22" },
  { cls: "w-85 flex-none", head: "w-28" },
];
const SKELETON_ROWS = Array.from({ length: 10 }, (_, i) => i);

export default function TopCoins() {
  // ===== STATE VARIABLES =====
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [currPage, setCurrPage] = useState(1);
  const [apiSort, setApiSort] = useState<ApiSorts>("market_cap_desc");
  const navigate = useNavigate();

  // ===== REACT QUERY HOOKS =====
  const {
    data,
    isLoading,
    isError: isQueryError,
  } = useQuery({
    queryKey: ["coins", apiSort],
    queryFn: () => fetchTopCoins(apiSort),
    staleTime: 30_000,
  });
  const isError = isQueryError;

  // ===== AGGRID DATA =====
  const colDefs = useMemo<ColDef[]>(
    () => [
      {
        field: "image",
        headerName: "#",
        cellRenderer: imageRenderer,
        cellStyle: defaultCellStyle,
        width: 70,
        sortable: false,
      },
      {
        field: "identity",
        cellRenderer: identityRenderer,
        cellStyle: defaultCellStyle,
        cellDataType: false,
        headerName: "Name",
        flex: 1.4,
        minWidth: 160,
      },
      {
        field: "current_price",
        cellRenderer: priceRenderer,
        cellStyle: defaultCellStyle,
        headerName: "Current Price",
        flex: 1,
        minWidth: 120,
      },
      {
        field: "market_cap",
        cellRenderer: bigNumRenderer,
        cellStyle: defaultCellStyle,
        headerName: "Market Cap",
        flex: 0.9,
        minWidth: 110,
      },
      {
        field: "price_change_24h",
        cellRenderer: pctRenderer,
        cellStyle: defaultCellStyle,
        headerName: "Price Change (24h)",
        flex: 1,
        minWidth: 140,
      },
      {
        field: "total_volume",
        cellRenderer: bigNumRenderer,
        cellStyle: defaultCellStyle,
        headerName: "Total Volume",
        flex: 0.9,
        minWidth: 110,
      },
      {
        field: "ath",
        cellRenderer: priceRenderer,
        cellStyle: defaultCellStyle,
        headerName: "All Time High",
        flex: 1,
        minWidth: 120,
      },
      {
        field: "atl",
        cellRenderer: priceRenderer,
        cellStyle: defaultCellStyle,
        headerName: "All Time Low",
        flex: 0.9,
        minWidth: 110,
      },
      {
        field: "sparkline_in_7d",
        cellRenderer: sparklineRenderer,
        cellDataType: false,
        headerName: "Price History (7d)",
        width: 340,
      },
    ],
    [],
  );

  // ===== EVENT HANDLERS =====
  const onGridReady = (e: GridReadyEvent) => setGridApi(e.api);

  const handleRowClick = (e: RowClickedEvent) => {
    navigate(`/coin_info`, {
      state: {
        coin: {
          id: e.data.id,
          name: e.data.name,
          ticker: e.data.symbol,
          imgUrl: e.data.image,
        },
      },
    });
  };

  // Fires when page or total pages changes
  const onPaginationChanged = useCallback(() => {
    if (!gridApi) return;
    setCurrPage(gridApi.paginationGetCurrentPage());
  }, [gridApi]);

  return (
    <Card
      className={`
        p-0 gap-0 overflow-hidden rounded-[18px] border-border
        shadow-[0_1px_2px_rgba(0,0,0,0.04)] bg-background flex flex-col
        h-[calc(100vh-9.5rem)]
      `}
    >
      {/* ===== HEADER ===== */}
      <div className="flex items-end justify-between gap-4 px-7 py-4">
        {/* ===== TITLE & DESCRIPTION ===== */}
        <div>
          <p
            className={`
              font-mono text-[12px] uppercase tracking-[0.01em]
              text-muted-foreground m-0
            `}
          >
            Cryptocurrencies
          </p>
          <h1
            className={`
              text-[26px] font-bold tracking-[-0.02em] leading-none
              text-foreground mt-1.5 mb-0
            `}
          >
            Top 100 coins by {sortLabels[apiSort]}
          </h1>
          <p className="mt-1.5 mb-0 text-[13px] text-muted-foreground">
            See the 100 top performing cryptocurrencies.
          </p>
        </div>
        {/* ===== SORT DROPDOWN ===== */}
        <CoinSortDropdown sortBy={apiSort} setSortBy={setApiSort} />
      </div>
      {/* ===== LOADING / ERROR STATES ===== */}
      {isLoading && (
        <>
          {/* ===== TABLE SKELETON ===== */}
          <div className="p-4 pt-0 flex-1 min-h-0 flex flex-col">
            <div
              className={`
                flex-1 flex flex-col border border-border
              `}
            >
              {/* ===== COLUMN HEADER ROW ===== */}
              <div
                className={`
                  flex items-center h-9.5 shrink-0
                  border-b border-border
                `}
              >
                {SKELETON_COLS.map((c, i) => (
                  <div key={i} className={`px-4.5 ${c.cls}`}>
                    <CustomSkeleton className={`h-3 ${c.head}`} />
                  </div>
                ))}
              </div>
              {/* ===== DATA ROWS ===== */}
              <div className="flex-1 flex flex-col">
                {SKELETON_ROWS.map((i) => (
                  <div
                    key={i}
                    className={`
                      flex items-center flex-1 border-b border-border
                      last:border-b-0
                    `}
                  >
                    {/* image */}
                    <div className="px-4.5 w-17.5 flex-none">
                      <CustomSkeleton className="size-8 rounded-full" />
                    </div>
                    {/* identity (name + symbol) */}
                    <div className="px-4.5 flex-[1.4] min-w-40">
                      <div className="flex flex-col gap-1.5">
                        <CustomSkeleton className="h-3.5 w-20" />
                        <CustomSkeleton className="h-3 w-10" />
                      </div>
                    </div>
                    {/* current_price */}
                    <div className="px-4.5 flex-1 min-w-30">
                      <CustomSkeleton className="h-3.5 w-20" />
                    </div>
                    {/* market_cap */}
                    <div className="px-4.5 flex-[0.9] min-w-27.5">
                      <CustomSkeleton className="h-3.5 w-16" />
                    </div>
                    {/* price_change_24h */}
                    <div className="px-4.5 flex-1 min-w-35">
                      <CustomSkeleton className="h-3.5 w-20" />
                    </div>
                    {/* total_volume */}
                    <div className="px-4.5 flex-[0.9] min-w-27.5">
                      <CustomSkeleton className="h-3.5 w-16" />
                    </div>
                    {/* ath */}
                    <div className="px-4.5 flex-1 min-w-30">
                      <CustomSkeleton className="h-3.5 w-20" />
                    </div>
                    {/* atl */}
                    <div className="px-4.5 flex-[0.9] min-w-27.5">
                      <CustomSkeleton className="h-3.5 w-16" />
                    </div>
                    {/* sparkline */}
                    <div className="px-4.5 w-85 flex-none">
                      <CustomSkeleton className="h-10 w-full rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ===== DIVIDER ===== */}
          <div className="h-px bg-muted w-full" />

          {/* ===== PAGINATION SKELETON ===== */}
          <div className="flex items-center justify-between px-6 py-3">
            <CustomSkeleton className="h-3 w-24" />
            <div className="inline-flex items-center gap-1.5">
              <CustomSkeleton className="h-7 w-14 rounded-md" />
              <CustomSkeleton className="h-7 w-14 rounded-md" />
            </div>
          </div>
        </>
      )}
      {isError && !isLoading && (
        <ErrorFallback
          title="Data unavailable"
          description="Top coins could not be loaded."
          className="flex-1 min-h-0 gap-3 px-6"
        />
      )}
      {data && !isError && (
        <>
          {/* ===== AGGRID TABLE ===== */}
          <div
            className={`
              p-4 pt-0 ag-theme-alpine flex-1 min-h-0
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
              [--ag-row-height:calc((100vh-22rem)/10)]
              [&_.ag-header-cell-text]:font-mono
              [&_.ag-header-cell-text]:text-[11px]
              [&_.ag-header-cell-text]:font-semibold
              [&_.ag-header-cell-text]:tracking-[0.06em]
              [&_.ag-header-cell-text]:uppercase
              [&_.ag-root-wrapper]:border-0
              [&_.ag-header]:border-b [&_.ag-header]:border-border
              [&_.ag-paging-panel]:border-t [&_.ag-paging-panel]:border-border
              [&_.ag-paging-panel]:px-7
              [&_.ag-row]:cursor-pointer
            `}
          >
            <AgGridReact
              rowData={data}
              columnDefs={colDefs}
              pagination={true}
              paginationPageSize={10}
              suppressPaginationPanel // hide default UI
              suppressCellFocus
              onGridReady={onGridReady}
              onPaginationChanged={onPaginationChanged}
              onRowClicked={handleRowClick}
            />
          </div>

          {/* ===== DIVIDER ===== */}
          <div className="h-px bg-muted w-full" />

          {/* ===== PAGINATION ===== */}
          <div className="flex items-center justify-between px-6 ">
            {/* ===== PAGE INDICATOR ===== */}
            <p
              className={`
                font-mono text-[11px] uppercase tracking-[0.06em]
                text-muted-foreground
              `}
            >
              Page {currPage + 1} of {maxPages}
            </p>
            {/* ===== PREV / NEXT BUTTONS ===== */}
            <div className="inline-flex items-center gap-1.5">
              <p
                className={`
                  font-mono text-[11px] uppercase tracking-[0.06em]
                  px-3 py-1.5 border border-border rounded-md bg-background
                  cursor-pointer hover:border-[#71717a]
                  ${
                    currPage === 0
                      ? "opacity-40 cursor-not-allowed text-foreground"
                      : "text-foreground"
                  }
                `}
                onClick={() => gridApi?.paginationGoToPreviousPage()}
              >
                Prev
              </p>
              <p
                className={`
                  font-mono text-[11px] uppercase tracking-[0.06em]
                  px-3 py-1.5 border border-border rounded-md bg-background
                  cursor-pointer hover:border-[#71717a]
                  ${
                    currPage === maxPages - 1
                      ? "opacity-40 cursor-not-allowed text-foreground"
                      : "text-foreground"
                  }
                `}
                onClick={() => gridApi?.paginationGoToNextPage()}
              >
                Next
              </p>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
