const apiKey = process.env.API;
const investPerMonth = process.env.INVEST;
const freqencyInHour = process.env.FREQH;
const frequency = (24 / freqencyInHour) * 30;
const amountInAED = investPerMonth / frequency;
const interval = freqencyInHour * 3600000;

export { apiKey, investPerMonth, amountInAED, interval };
