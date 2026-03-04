import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useMemo, useState } from "react";
import { AgGridReact, type CustomCellRendererProps } from "ag-grid-react";

import type { ColDef } from "ag-grid-community";

import CoinSortDropdown from "@/components/CoinSortDropdown";

import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import SparklineGraph from "@/components/SparklineGraph";

ModuleRegistry.registerModules([AllCommunityModule]);

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

async function fetchTopCoins(sort_coins_by: string): Promise<Coin[]> {
  const URL = "http://127.0.0.1:5000/get_top_coins_data";
  const body = {
    sort_coins_by: sort_coins_by,
  };
  const response = await axios.post(URL, body, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  console.log(response.data.at(0));
  return response.data;
}

function identityRenderer(props: CustomCellRendererProps) {
  return (
    <p>
      {props.value.name} ({props.value.symbol})
    </p>
  );
}

function imageRenderer(props: CustomCellRendererProps) {
  return <img src={props.value} className="size-8 rounded-full" />;
}

function sparklineRenderer(props: CustomCellRendererProps) {
  return <SparklineGraph data={props.value} />;
}

const defaultCellStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

export default function TopCoins() {
  const [apiSort, setApiSort] = useState<ApiSorts>("market_cap_desc");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["coins", apiSort],
    queryFn: () => fetchTopCoins(apiSort),
  });

  const colDefs = useMemo<ColDef[]>(
    () => [
      {
        field: "image",
        headerName: "#",
        cellRenderer: imageRenderer,
        cellStyle: defaultCellStyle,
        flex: 1,
        sortable: false,
      },
      {
        field: "identity",
        cellRenderer: identityRenderer,
        cellStyle: defaultCellStyle,
        headerName: "Name",
        flex: 1,
      },
      {
        field: "current_price",
        cellStyle: defaultCellStyle,
        headerName: "Current Price",
        flex: 1,
      },
      {
        field: "market_cap",
        cellStyle: defaultCellStyle,
        headerName: "Market Cap",
        flex: 1,
      },
      {
        field: "price_change_1h",
        cellStyle: defaultCellStyle,
        headerName: "Price Change (1h)",
        flex: 1,
      },
      {
        field: "price_change_24h",
        cellStyle: defaultCellStyle,
        headerName: "Price Change (24h)",
        flex: 1,
      },
      {
        field: "price_change_7d",
        cellStyle: defaultCellStyle,
        headerName: "Price Change (7d)",
        flex: 1,
      },
      {
        field: "total_volume",
        cellStyle: defaultCellStyle,
        headerName: "Total Volume",
        flex: 1,
      },
      {
        field: "sparkline_in_7d",
        cellRenderer: sparklineRenderer,
        autoHeight: true,
        headerName: "Price History (7d)",
        width: 275,
      },
      {
        field: "ath",
        cellStyle: defaultCellStyle,
        headerName: "All Time High",
        flex: 1,
      },
      {
        field: "atl",
        cellStyle: defaultCellStyle,
        headerName: "All Time Low",
        flex: 1,
      },
    ],
    [],
  );

  return (
    <div>
      <p className="text-3xl">Cryptocurrencies</p>
      <div className="flex justify-between">
        <p className="text-lg">See the 100 top performing cryptocurrencies</p>
        <CoinSortDropdown sortBy={apiSort} setSortBy={setApiSort} />
      </div>
      {isLoading && <div>Loading...</div>}
      {isError && <div>{(error as Error).message}</div>}
      {data && (
        <div className="ag-theme-alpine h-200">
          <AgGridReact
            rowData={data}
            columnDefs={colDefs}
            pagination={true}
            paginationPageSize={25}
            paginationPageSizeSelector={false}
          />
        </div>
      )}
    </div>
  );
}
