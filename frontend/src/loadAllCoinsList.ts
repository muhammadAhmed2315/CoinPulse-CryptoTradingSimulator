import LoadAllCoinsWorker from "./lib/load-all-coins-worker.ts?worker";

export type Coin = {
  id: string;
  name: string;
  ticker: string;
  imgUrl?: string;
};

export async function loadAllCoinsList(): Promise<Coin[]> {
  const response = await fetch("/coins.tsv");
  const text = await response.text();

  return new Promise((resolve, reject) => {
    const worker = new LoadAllCoinsWorker();
    worker.onmessage = (e: MessageEvent<Coin[]>) => {
      resolve(e.data);
      worker.terminate();
    };
    worker.onerror = (err) => {
      reject(err);
      worker.terminate();
    };
    worker.postMessage(text);
  });
}
