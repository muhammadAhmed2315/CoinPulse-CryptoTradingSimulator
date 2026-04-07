export type Coin = {
  name: string;
  ticker: string;
  imgUrl: string;
};

export async function loadAllCoinsList() {
  const response = await fetch("/coins.tsv");
  const text = await response.text();
  return text
    .trim()
    .split("\n")
    .map((line) => {
      const [name, ticker, imgUrl] = line.split("\t");
      return { name, ticker, imgUrl };
    });
}
