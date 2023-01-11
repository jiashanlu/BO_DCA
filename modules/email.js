import nodemailer from "nodemailer";
import { checkBalance, getAllOrders } from "./api.js";
import { writeOrdersToCsv } from "./helpers.js";

let mailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL,
    pass: process.env.PSW,
  },
});

const sendEmail = (subject, text) => {
  let mailDetails = {
    from: "benjaminbois@gmail.com",
    to: "benjaminbois@gmail.com",
    subject,
    text,
    attachments: [
      {
        filename: "orders.csv",
        path: "./orders.csv",
      },
    ],
  };

  mailTransporter.sendMail(mailDetails, function (err, data) {
    if (err) {
      console.log("Email config " + err);
    } else {
      console.log("Email sent successfully");
    }
  });
};

const mailSynthesis = async () => {
  const date = new Date();
  let dateY = new Date(date.setDate(date.getDate() - 1));
  let orders = await getAllOrders(0);
  orders = orders.filter((x) => x.status == "DONE");
  await writeOrdersToCsv(orders);
  const ordersCurrentYear = orders.filter(
    (x) => new Date(x.date_created).getFullYear() == date.getFullYear()
  );
  const ordersPastYear = orders.filter(
    (x) => new Date(x.date_created).getFullYear() == date.getFullYear() - 1
  );
  const ordersCurrentMonth = ordersCurrentYear.filter(
    (x) => new Date(x.date_created).getMonth() == date.getMonth()
  );
  const ordersPreviousDay = orders.filter(
    (x) =>
      new Date(x.date_created).getMonth() == dateY.getMonth() &&
      new Date(x.date_created).getFullYear() == dateY.getFullYear() &&
      new Date(x.date_created).getDate() == dateY.getDate()
  );
  const analysis = [
    ordersCurrentYear,
    ordersCurrentMonth,
    ordersPreviousDay,
    ordersPastYear,
    orders,
  ];
  const data = [];
  analysis.forEach((array) => {
    data.push(
      -array
        .map((x) => {
          return parseFloat(x.amount_AED);
        })
        .reduce((total, amount) => total + amount)
    );
    data.push(
      array
        .map((x) => {
          return parseFloat(x.amount_BTC);
        })
        .reduce((total, amount) => total + amount)
    );
    data.push(
      -array
        .map((x) => {
          return parseFloat(x.amount_AED);
        })
        .reduce((total, amount) => total + amount) /
        array
          .map((x) => {
            return parseFloat(x.amount_BTC);
          })
          .reduce((total, amount) => total + amount)
    );
  });
  const balances = await checkBalance();
  const locale = "en-GB";
  const formatFiat = { style: "currency", currency: "AED" };
  const formatSat = {};
  const formatPriceAED = { style: "currency", currency: "AED" };
  const formatPriceUSD = { style: "currency", currency: "USD" };

  sendEmail(
    "DCA - Daily update",
    `Current Balances : ${parseFloat(balances.balances.AED).toLocaleString(
      locale,
      formatFiat
    )} & ${balances.balances.BTC} BTC, 
      Past Year => ${(data[10] * 100000000).toLocaleString(
        locale,
        formatSat
      )} SAT for ${data[9].toLocaleString(
      locale,
      formatFiat
    )} @ ${data[11].toLocaleString(locale, formatPriceAED)} (${(
      data[11] / 3.673
    ).toLocaleString(locale, formatPriceUSD)})
      This Year => ${(data[1] * 100000000).toLocaleString(
        locale,
        formatSat
      )} SAT for ${data[0].toLocaleString(
      locale,
      formatFiat
    )} @ ${data[2].toLocaleString(locale, formatPriceAED)} (${(
      data[2] / 3.673
    ).toLocaleString(locale, formatPriceUSD)})
      This Month => ${(data[4] * 100000000).toLocaleString(
        locale,
        formatSat
      )} SAT for ${data[3].toLocaleString(
      locale,
      formatFiat
    )} @ ${data[5].toLocaleString(locale, formatPriceAED)} (${(
      data[5] / 3.673
    ).toLocaleString(locale, formatPriceUSD)})
      Yesterday => ${(data[7] * 100000000).toLocaleString(
        locale,
        formatSat
      )} SAT for ${data[6].toLocaleString(
      locale,
      formatFiat
    )} @ ${data[8].toLocaleString(locale, formatPriceAED)} (${(
      data[8] / 3.673
    ).toLocaleString(locale, formatPriceUSD)})
      Since I run it => ${(data[13] * 100000000).toLocaleString(
        locale,
        formatSat
      )} SAT for ${data[12].toLocaleString(
      locale,
      formatFiat
    )} @ ${data[14].toLocaleString(locale, formatPriceAED)} (${(
      data[14] / 3.673
    ).toLocaleString(locale, formatPriceUSD)})
      `
  );
};
