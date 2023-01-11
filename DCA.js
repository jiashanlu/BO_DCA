import { investPerMonth, amountInAED, interval } from "./modules/config.js";
import {
  checkBalance,
  checkPrice,
  passOrder,
  lastOrder,
} from "./modules/api.js";
import { timestampToHms } from "./modules/helpers.js";

const checkLastInterval = async () => {
  try {
    const { orders } = await lastOrder("?limit=1");
    if (orders.length === 0) throw new Error("No Order found");
    const [{ date_created }] = orders;
    const date = new Date(date_created);
    const now = Date.now();
    const gap = now - date.getTime();
    console.log(date, gap);
    return { date, gap };
  } catch (error) {
    return { error: error.message };
  }
};

const runTimer = async () => {
  const lastInterval = await checkLastInterval();
  const timer = interval - lastInterval[1];
  new Date().getDay() != lastInterval[0].getDay() ? mailSynthesis() : "";
  if (timer > 0) {
    setTimeout(runTimer, timer);
    console.log("Next order in " + timestampToHms(timer / 1000));
  } else {
    console.log("DCA started");
    await DCA();
    setTimeout(runTimer, 50000);
  }
};

const DCA = async (timeout) => {
  const balances = await checkBalance();
  console.log(balances);
  const aedBalance = balances.balances.AED;
  aedBalance < investPerMonth * 0.1
    ? sendEmail("DCA - low AED Balance", `balance is ${aedBalance}`)
    : "";
  const price = await checkPrice();
  const btcToBuy = (amountInAED / price).toFixed(8).toString();
  if (btcToBuy < 0.000072) {
    sendEmail(
      "DCA - BTC order below 0.000072",
      `Please reduce frequency or increase monthly investment`
    );
    console.log(
      "DCA - BTC order below 0.000072, please reduce frequency or increase monthly investment"
    );
    process.exit(1);
    return;
  }
  aedBalance > amountInAED
    ? passOrder(btcToBuy)
    : sendEmail("DCA - Not enough AED balance", `balance is ${aedBalance}`);
};

// runTimer();
checkLastInterval2();
