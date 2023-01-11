import createCsvWriter from "csv-writer";

function timestampToHms(d) {
  d = Number(d);
  var h = Math.floor(d / 3600);
  var m = Math.floor((d % 3600) / 60);
  var s = Math.floor((d % 3600) % 60);

  var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
  var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
  var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
  return [hDisplay + mDisplay + sDisplay];
}

async function writeOrdersToCsv(orders) {
  // Create a CSV writer
  const csvWriter = createCsvWriter.createObjectCsvWriter({
    path: "../orders.csv",
    header: [
      { id: "id", title: "ID" },
      { id: "side", title: "Side" },
      { id: "amount_BTC", title: "amount_BTC" },
      { id: "amount_AED", title: "amount_AED" },
      { id: "date_created", title: "date_created" },
      { id: "status", title: "Status" },
    ],
  });

  // Write the orders to the CSV file
  await csvWriter.writeRecords(orders);
}

export { timestampToHms, writeOrdersToCsv };
