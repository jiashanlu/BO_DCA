const apiKey = process.env.API; // the `apiKey` variable is storing the apiKey from process.env.API, which is an environment variable
const investPerMonth = process.env.INVEST; // the `investPerMonth` variable is storing the amount of investment per month from process.env.INVEST, which is an environment variable
const freqencyInHour = process.env.FREQH; // the `freqencyInHour` variable is storing the frequency of investment in hours from process.env.FREQH, which is an environment variable
const frequency = (24 / freqencyInHour) * 30; // `frequency` variable is calculated by dividing the total number of hours in a day (24) by the `freqencyInHour` variable and then multiplying it by the total number of days in a month (30)
const amountInAED = investPerMonth / frequency; // `amountInAED` variable is calculated by dividing the `investPerMonth` variable by the `frequency` variable
const interval = freqencyInHour * 3600000; // `interval` variable is calculated by multiplying the `freqencyInHour` variable by the number of milliseconds in an hour (3600000)

export { apiKey, investPerMonth, amountInAED, interval }; // all the defined variables are exported so they can be used in other modules.
