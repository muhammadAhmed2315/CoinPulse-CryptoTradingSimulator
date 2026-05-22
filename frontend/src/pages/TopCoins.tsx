import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useCallback, useMemo, useState } from "react";
import { AgGridReact, type CustomCellRendererProps } from "ag-grid-react";

import type { ColDef, RowClickedEvent } from "ag-grid-community";

import CoinSortDropdown from "@/components/CoinSortDropdown";
import { Card } from "@/components/ui/card";

import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import SparklineGraph from "@/components/SparklineGraph";
import { Spinner } from "@/components/ui/spinner";
import formatCompactValue, { numToMoney } from "@/utils";
import type { GridApi, GridReadyEvent } from "ag-grid-community";
import { useNavigate } from "react-router";

ModuleRegistry.registerModules([AllCommunityModule]);

const maxPages = 10;

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
  });
  return response.data;
}

// ===== AGGRID CELL RENDERERS =====
function identityRenderer(props: CustomCellRendererProps) {
  return (
    <div className="flex flex-col leading-[1.2] gap-0.5">
      <span className="text-[14px] font-semibold text-[#111]">
        {props.value.name}
      </span>
      <span
        className={`
          font-mono text-[11px] uppercase tracking-[0.04em]
          text-[#71717a]
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
    <span className="font-mono text-[13px] font-medium text-[#111] tabular-nums">
      ${numToMoney(props.value)}
    </span>
  );
}

function bigNumRenderer(props: CustomCellRendererProps) {
  return (
    <span className="font-mono text-[13px] font-medium text-[#111] tabular-nums">
      ${formatCompactValue(props.value)}
    </span>
  );
}

function pctRenderer(props: CustomCellRendererProps) {
  const n = Number(props.value);
  const cls =
    n > 0 ? "text-[#21c45d]" : n < 0 ? "text-[#ef4444]" : "text-[#71717a]";
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

export default function TopCoins() {
  // ===== STATE VARIABLES =====
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [currPage, setCurrPage] = useState(1);
  const [apiSort, setApiSort] = useState<ApiSorts>("market_cap_desc");
  const navigate = useNavigate();

  // ===== REACT QUERY HOOKS =====
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["coins", apiSort],
    queryFn: () => fetchTopCoins(apiSort),
  });

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
        p-0 gap-0 overflow-hidden rounded-[18px] border-[#f0f0f0]
        shadow-[0_1px_2px_rgba(0,0,0,0.04)] bg-white flex flex-col
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
              text-[#71717a] m-0
            `}
          >
            Cryptocurrencies
          </p>
          <h1
            className={`
              text-[26px] font-bold tracking-[-0.02em] leading-none
              text-[#111] mt-1.5 mb-0
            `}
          >
            Top 100 coins by {sortLabels[apiSort]}
          </h1>
          <p className="mt-1.5 mb-0 text-[13px] text-[#71717a]">
            See the 100 top performing cryptocurrencies.
          </p>
        </div>
        {/* ===== SORT DROPDOWN ===== */}
        <CoinSortDropdown sortBy={apiSort} setSortBy={setApiSort} />
      </div>
      {/* ===== LOADING / ERROR STATES ===== */}
      {isLoading && <Spinner />}
      {isError && <div>{(error as Error).message}</div>}
      {data && (
        <>
          {/* ===== AGGRID TABLE ===== */}
          <div
            className={`
              p-4 pt-0 ag-theme-alpine flex-1 min-h-0
              [--ag-font-family:'DM_Sans',sans-serif]
              [--ag-font-size:13px]
              [--ag-foreground-color:#111]
              [--ag-background-color:transparent]
              [--ag-header-background-color:transparent]
              [--ag-header-foreground-color:#71717a]
              [--ag-border-color:#f0f0f0]
              [--ag-row-border-color:#f0f0f0]
              [--ag-row-hover-color:#fafafa]
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
              [&_.ag-header]:border-b [&_.ag-header]:border-[#f0f0f0]
              [&_.ag-paging-panel]:border-t [&_.ag-paging-panel]:border-[#f0f0f0]
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
          <div className="h-px bg-[#f0f0f0] w-full" />

          {/* ===== PAGINATION ===== */}
          <div className="flex items-center justify-between px-6 ">
            {/* ===== PAGE INDICATOR ===== */}
            <p
              className={`
                font-mono text-[11px] uppercase tracking-[0.06em]
                text-[#71717a]
              `}
            >
              Page {currPage + 1} of {maxPages}
            </p>
            {/* ===== PREV / NEXT BUTTONS ===== */}
            <div className="inline-flex items-center gap-1.5">
              <p
                className={`
                  font-mono text-[11px] uppercase tracking-[0.06em]
                  px-3 py-1.5 border border-[#ececef] rounded-md bg-white
                  cursor-pointer hover:border-[#71717a]
                  ${
                    currPage === 0
                      ? "opacity-40 cursor-not-allowed text-[#111]"
                      : "text-[#111]"
                  }
                `}
                onClick={() => gridApi?.paginationGoToPreviousPage()}
              >
                Prev
              </p>
              <p
                className={`
                  font-mono text-[11px] uppercase tracking-[0.06em]
                  px-3 py-1.5 border border-[#ececef] rounded-md bg-white
                  cursor-pointer hover:border-[#71717a]
                  ${
                    currPage === maxPages - 1
                      ? "opacity-40 cursor-not-allowed text-[#111]"
                      : "text-[#111]"
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
