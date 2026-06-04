self.onmessage = function (e) {
  const res = e.data
    .trim()
    .split("\n")
    .slice(1)
    .map((line: string) => {
      const [id, name, ticker, imgUrl] = line.split("\t");
      return { id, name, ticker, imgUrl };
    });

  self.postMessage(res);
};
