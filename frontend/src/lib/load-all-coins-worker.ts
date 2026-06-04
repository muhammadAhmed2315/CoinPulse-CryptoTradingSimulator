self.onmessage = function (e) {
  const text = e.data;
  const res = e.data
    .trim()
    .split("\n")
    .slice(1)
    .map((line) => {
      const [id, name, ticker, imgUrl] = line.split("\t");
      return { id, name, ticker, imgUrl };
    });

  self.postMessage(res);
};
