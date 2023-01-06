import fetch from "node-fetch"
import nodemailer from "nodemailer"
import createCsvWriter from 'csv-writer';

const apiKey =  process.env.API
const investPerMonth =  process.env.INVEST
const freqencyInHour =  process.env.FREQH
const frequency = 24 / freqencyInHour * 30
const amountInAED = investPerMonth/frequency
const interval = freqencyInHour * 3600000
let mailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
      user: process.env.MAIL,
      pass: process.env.PSW
  }
});


const checkBalance = async () => {
  try {
    const res = await fetch(`https://api.bitoasis.net/v1/exchange/balances`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    })
    const json = await res.json()
    return json
  } catch (err) {
    console.log(err)
  }
}

const checkPrice = async () => {
  try {
    const res = await fetch(`https://api.bitoasis.net/v1/exchange/ticker/BTC-AED`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    })
    const json = await res.json()
    return json.ticker.ask
  } catch (err) {
    console.log(err)
  }
}

const passOrder = async (size) => {
const body =  {
  'side': 'buy',
  'type': 'market',
  'pair': 'BTC-AED',
  'amount': size
}
  try {
    const res = await fetch(`https://api.bitoasis.net/v1/exchange/order`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    })
    const json = await res.json()
    return json.code == 404 ? console.log(json) : checkOrder(json.order.id)
  } catch (err) {
    console.log(err)
  }
}

const checkOrder = async (id) => {
  try {
    const res = await fetch(`https://api.bitoasis.net/v1/exchange/order/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    })
    const json = await res.json()
    console.log(json)
    return json
  } catch (err) {
    console.log(err)
  }
}

const lastOrder = async (param) => {
  try {
    const res = await fetch(`https://api.bitoasis.net/v1/exchange/orders/BTC-AED${param}`, {
      method: 'GET',

      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    })
    const json = await res.json()
    return json
  } catch (err) {
    console.log(err)
  }
}

async function getAllOrders(offset) {
  try {
    const limit = 1000;
    const orders = [];
    let hasMore = true;
    while (hasMore) {
      const res = await lastOrder(`?limit=${limit}&offset=${offset}`);
      console.log(res.orders.length)
      orders.push(...res.orders);
      offset += res.orders.length;
      res.orders.length<1000 ? hasMore = false : hasMore = true;
    }
    return orders;
  } catch (error) {
    console.error(error);
    throw error;
  }
}


const checkLastInterval = async () => {
  const x = await lastOrder("?limit=1")
  const date = new Date(x.orders[0].date_created)
  const now = new Date()
  const gap = now.getTime() - date.getTime()
  return [date, gap]
}

const sendEmail= (subject, text) => {

  let mailDetails = {
    from: 'benjaminbois@gmail.com',
    to: 'benjaminbois@gmail.com',
    subject,
    text,
    attachments: [
      {
        filename: 'orders.csv',
        path: './orders.csv',
      },
    ],
  };

  mailTransporter.sendMail(mailDetails, function(err, data) {
    if(err) {
        console.log('Email config '+err);
    } else {
        console.log('Email sent successfully');
    }
  });
}

const runTimer = async () => {
  const lastInterval = await checkLastInterval()
  const timer = interval - lastInterval[1]
  new Date().getDay() != lastInterval[0].getDay() ? mailSynthesis() : ""
  if (timer > 0){
    setTimeout(runTimer, timer)
    console.log("Next order in "+ timestampToHms((timer /1000)))
  } 
  else{
    console.log("DCA started")
    await DCA()
    setTimeout(runTimer, 50000)
  } 

}

const DCA = async (timeout) => {
  const balances = await checkBalance()
  console.log(balances)
  const aedBalance = balances.balances.AED
  aedBalance < investPerMonth *0.1 ? sendEmail("DCA - low AED Balance", `balance is ${aedBalance}`) : ""
  const price = await checkPrice()
  const btcToBuy = (amountInAED / price).toFixed(8).toString()
  if (btcToBuy < 0.000072) {
    sendEmail("DCA - BTC order below 0.000072", `Please reduce frequency or increase monthly investment`)
    console.log("DCA - BTC order below 0.000072, please reduce frequency or increase monthly investment")
    process.exit(1)
    return
  }
  aedBalance > amountInAED ? passOrder(btcToBuy) : sendEmail("DCA - Not enough AED balance", `balance is ${aedBalance}`)
}

const mailSynthesis = async () => {
  const date = new Date()
  let dateY= new Date(date.setDate(date.getDate()-1))
  let orders = await getAllOrders(0);
  orders = orders.filter(x => x.status == "DONE")
  await writeOrdersToCsv(orders);
  const ordersCurrentYear = orders.filter(x => new Date(x.date_created).getFullYear() == date.getFullYear())
  const ordersPastYear = orders.filter(x => new Date(x.date_created).getFullYear() == date.getFullYear()-1)
  const ordersCurrentMonth = ordersCurrentYear.filter(x => new Date(x.date_created).getMonth() == date.getMonth())
  const ordersPreviousDay = orders.filter(x => new Date(x.date_created).getMonth() == dateY.getMonth() && new Date(x.date_created).getFullYear() == dateY.getFullYear() && new Date(x.date_created).getDate() == dateY.getDate() )
  const analysis = [ordersCurrentYear,ordersCurrentMonth,ordersPreviousDay,ordersPastYear,orders]
  const data = []
  analysis.forEach(array => { 
    data.push(
      - array.map(x => {return parseFloat(x.amount_AED)}).reduce((total, amount) => total + amount)
      );
    data.push(
      array.map(x => {return parseFloat(x.amount_BTC)}).reduce((total, amount) => total + amount)
    )
    data.push(
    - array.map(x => {return parseFloat(x.amount_AED)}).reduce((total, amount) => total + amount) /
    array.map(x => {return parseFloat(x.amount_BTC)}).reduce((total, amount) => total + amount)
    )
  })
  const balances = await checkBalance()
  const locale = 'en-GB'
  const formatFiat = { style: 'currency', currency: 'AED' }
  const formatSat = { }
  const formatPriceAED = {style: 'currency', currency: 'AED' }
  const formatPriceUSD = {style: 'currency', currency: 'USD' }

  sendEmail("DCA - Daily update", 
    `Current Balances : ${parseFloat(balances.balances.AED).toLocaleString(locale,formatFiat)} & ${balances.balances.BTC} BTC, 
    Past Year => ${(data[10]*100000000).toLocaleString(locale,formatSat)} SAT for ${data[9].toLocaleString(locale,formatFiat)} @ ${data[11].toLocaleString(locale,formatPriceAED)} (${(data[11]/3.673).toLocaleString(locale,formatPriceUSD)})
    This Year => ${(data[1]*100000000).toLocaleString(locale,formatSat)} SAT for ${data[0].toLocaleString(locale,formatFiat)} @ ${data[2].toLocaleString(locale,formatPriceAED)} (${(data[2]/3.673).toLocaleString(locale,formatPriceUSD)})
    This Month => ${(data[4]*100000000).toLocaleString(locale,formatSat)} SAT for ${data[3].toLocaleString(locale,formatFiat)} @ ${data[5].toLocaleString(locale,formatPriceAED)} (${(data[5]/3.673).toLocaleString(locale,formatPriceUSD)})
    Yesterday => ${(data[7]*100000000).toLocaleString(locale,formatSat)} SAT for ${data[6].toLocaleString(locale,formatFiat)} @ ${data[8].toLocaleString(locale,formatPriceAED)} (${(data[8]/3.673).toLocaleString(locale,formatPriceUSD)})
    Since I run it => ${(data[13]*100000000).toLocaleString(locale,formatSat)} SAT for ${data[12].toLocaleString(locale,formatFiat)} @ ${data[14].toLocaleString(locale,formatPriceAED)} (${(data[14]/3.673).toLocaleString(locale,formatPriceUSD)})
    `)
}

function timestampToHms(d) {
  d = Number(d);
  var h = Math.floor(d / 3600);
  var m = Math.floor(d % 3600 / 60);
  var s = Math.floor(d % 3600 % 60);

  var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
  var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
  var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
  return [hDisplay + mDisplay + sDisplay]; 
}




async function writeOrdersToCsv(orders) {
  // Create a CSV writer
  const csvWriter = createCsvWriter.createObjectCsvWriter({
    path: 'orders.csv',
    header: [
      {id: 'id', title: 'ID'},
      {id: 'side', title: 'Side'},
      {id: 'amount_BTC', title: 'amount_BTC'},
      {id: 'amount_AED', title: 'amount_AED'},
      {id: 'date_created', title: 'date_created'},
      {id: 'status', title: 'Status'},
    ],
  });

  // Write the orders to the CSV file
  await csvWriter.writeRecords(orders);

}


// runTimer()
mailSynthesis()


