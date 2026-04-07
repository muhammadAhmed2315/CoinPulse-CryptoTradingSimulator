import { JSDOM } from "jsdom";
import { writeFileSync } from "fs";

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
      finalValues.push([
        nameTicker.at(0).trim(),
        nameTicker.at(-1).trim(),
        img.getAttribute("src").split("?").at(0),
      ]);
    }
  }
  return finalValues;
}

const images = [];
for (let i = 1; i <= 55; i++) {
  const temp = await fetchPage(i);
  images.push(...temp);
}

writeFileSync(
  "frontend/public/coins.tsv",
  images.map(([name, ticker, url]) => `${name}\t${ticker}\t${url}`).join("\n"),
  "utf8",
);
