import fetch from "node-fetch";
import { apiKey } from "./config.js";

const checkBalance = async () => {
  try {
    const res = await fetch(`https://api.bitoasis.net/v1/exchange/balances`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });
    const json = await res.json();
    return json;
  } catch (err) {
    console.log(err);
  }
};

const checkPrice = async () => {
  try {
    const res = await fetch(
      `https://api.bitoasis.net/v1/exchange/ticker/BTC-AED`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );
    const json = await res.json();
    return json.ticker.ask;
  } catch (err) {
    console.log(err);
  }
};

const passOrder = async (size) => {
  const body = {
    side: "buy",
    type: "market",
    pair: "BTC-AED",
    amount: size,
  };
  try {
    const res = await fetch(`https://api.bitoasis.net/v1/exchange/order`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });
    const json = await res.json();
    return json.code == 404 ? console.log(json) : checkOrder(json.order.id);
  } catch (err) {
    console.log(err);
  }
};

const checkOrder = async (id) => {
  try {
    const res = await fetch(
      `https://api.bitoasis.net/v1/exchange/order/${id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );
    const json = await res.json();
    console.log(json);
    return json;
  } catch (err) {
    console.log(err);
  }
};

const lastOrder = async (param) => {
  try {
    const res = await fetch(
      `https://api.bitoasis.net/v1/exchange/orders/BTC-AED${param}`,
      {
        method: "GET",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );
    const json = await res.json();
    return json;
  } catch (err) {
    console.log(err);
  }
};

async function getAllOrders(offset) {
  try {
    const limit = 1000;
    const orders = [];
    let hasMore = true;
    while (hasMore) {
      const res = await lastOrder(`?limit=${limit}&offset=${offset}`);
      console.log(res.orders.length);
      orders.push(...res.orders);
      offset += res.orders.length;
      res.orders.length < 1000 ? (hasMore = false) : (hasMore = true);
    }
    return orders;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export {
  checkBalance,
  checkPrice,
  passOrder,
  checkOrder,
  lastOrder,
  getAllOrders,
};
