import { JSDOM } from "jsdom";
import { writeFileSync } from "fs";

async function fetchCoinsList() {
  const response = await fetch("https://api.coingecko.com/api/v3/coins/list", {
    method: "GET",
    headers: { "x-cg-demo-api-key": process.env.COINGECKO_API_KEY },
  });

  const data = await response.json();

  return data.map((d) => {
    return {
      id: d.id,
      ticker: d.symbol,
      name: d.name,
    };
  });
}

async function fetchAllPages() {
  async function fetchPage(page) {
    const response = await fetch(
      `https://www.coingecko.com/?page=${page}&items=300`,
    );
    const html = await response.text();
    const { document } = new JSDOM(html).window;

    const tableRows = document.querySelectorAll("tr td a");

    const finalValues = [];
    for (let i = 0; i < tableRows.length; i++) {
      const tempRow = tableRows[i];

      const img = tempRow.querySelector("img");
      const name = tempRow.querySelector("div div");

      if (img && name) {
        const nameTicker = name.textContent.trim().split("\n");
        finalValues.push({
          name: nameTicker.at(0).trim(),
          ticker: nameTicker.at(-1).trim(),
          imgUrl: img.getAttribute("src").split("?").at(0),
        });
      }
    }
    return finalValues;
  }

  const images = [];
  for (let i = 1; i <= 55; i++) {
    if (i % 11 === 0) console.log(`${i}/55`);
    const temp = await fetchPage(i);
    images.push(...temp);
  }

  return images;
}

function mergeCoinData(coinsList, coinImages) {
  return coinsList.reduce((acc, c1) => {
    const match = coinImages.find(
      (c2) =>
        c1.name.toLowerCase() === c2.name.toLowerCase() &&
        c1.ticker.toLowerCase() === c2.ticker.toLowerCase(),
    );
    if (match) acc.push({ ...c1, imgUrl: match.imgUrl });
    return acc;
  }, []);
}

async function main() {
  // Returns {id: string, name: string, ticker: string}[]
  const coinsList = await fetchCoinsList();

  // Returns {name: string, ticker: string, imgUrl: string}[]
  const coinImages = await fetchAllPages();

  // Returns {name: string, ticker: string, imgUrl: string, id: string}[]
  const res = mergeCoinData(coinsList, coinImages);

  const tsv =
    "id\tname\tticker\timgUrl\n" +
    res.map((c) => `${c.id}\t${c.name}\t${c.ticker}\t${c.imgUrl}`).join("\n");
  writeFileSync("frontend/public/coins.tsv", tsv);
}

main();

// node --env-file=.env scraper.js

// id, name, ticker, imgUrl
