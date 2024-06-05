import fetch from "node-fetch"; //importing the 'node-fetch' module to make http requests
import { apiKey } from "./config.js"; // importing the apiKey from the config module

const checkBalance = async () => {
  try {
    // trying to make an http GET request to the bitoasis API to check the balance
    const res = await fetch(`https://api.bitoasis.net/v1/exchange/balances`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`, // passing the apiKey from the config module as a Bearer token
      },
    });
    const json = await res.json(); // parsing the json response
    return json; // returning the json response
  } catch (err) {
    console.log(err); //logging the error
  }
};

const checkPrice = async () => {
  try {
    // trying to make an http GET request to the bitoasis API to check the price of the ticker BTC-AED
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
    return json.ticker.ask; // returning the ask price of the ticker
  } catch (err) {
    console.log(err);
  }
};

const passOrder = async (size) => {
  // The variable `size` is used to specify the amount of BTC that the user wants to purchase.
  const body = {
    side: "buy",
    type: "market",
    pair: "BTC-AED",
    amount: size,
  };
  try {
    // Make a POST request to the specified endpoint, passing in the request body as well as headers.
    const res = await fetch(`https://api.bitoasis.net/v1/exchange/order`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });
    // Parse the JSON response from the server
    const json = await res.json();
    //Check if json.code == 404 if so return error message
    //Otherwise, call the checkOrder() function and pass it the json.order.id
    return json.code == 404 ? console.log(json) : checkOrder(json.order.id);
  } catch (err) {
    // Log the error message if any error occurs
    console.log(err);
  }
};

const checkOrder = async (id) => {
  // This function asynchronously checks an order status by its ID
  try {
    // Try to make a GET request to the API endpoint
    const res = await fetch(
      `https://api.bitoasis.net/v1/exchange/order/${id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`, // Using the API key for authentication
        },
      }
    );
    // parse the response as json
    const json = await res.json();
    console.log(JSON.stringify(json)); // log the json response
    return json;
  } catch (err) {
    console.log(err); // log the error if any
  }
};

const lastOrder = async (param) => {
  try {
    // makes a GET request to the specified url, passing the provided param in the query string
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
    // parse the response body as json
    const json = await res.json();
    // return the json object
    return json;
  } catch (err) {
    // log the error if any
    console.log(err);
  }
};

async function getAllOrders(offset) {
  try {
    const limit = 1000;
    const orders = [];
    let hasMore = true;
    while (hasMore) {
      //this makes a GET request to the API and the parameter limit and offset are passed in the URL
      //to limit the number of orders returned per request
      const res = await lastOrder(`?limit=${limit}&offset=${offset}`);
      //logs the number of orders returned in the current request
      console.log(res.orders.length);
      //adds the orders from the current request to the orders array
      orders.push(...res.orders);
      //increments the offset by the number of orders returned in the current request
      offset += res.orders.length;
      //check if the number of orders returned is less than limit, if so it means there are no more orders
      //to retrieve
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
