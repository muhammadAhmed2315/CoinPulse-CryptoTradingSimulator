export type Coin = {
  id: string;
  name: string;
  ticker: string;
  imgUrl: string;
};

export async function loadAllCoinsList(): Promise<Coin[]> {
  const response = await fetch("/coins.tsv");
  const text = await response.text();
  return text
    .trim()
    .split("\n")
    .map((line) => {
      const [id, name, ticker, imgUrl] = line.split("\t");
      return { id, name, ticker, imgUrl };
    });
}
