import fetch from "node-fetch"
import nodemailer from "nodemailer"

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


const checkBalance = () => {
  return fetch(`https://api.bitoasis.net/v1/exchange/balances`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }
  })
  .then(res => res.json())
  .then(json => {return json})
  .catch(err => {
      console.log(err)
  })
}

const checkPrice = () => {
  return fetch(`https://api.bitoasis.net/v1/exchange/ticker/BTC-AED`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }
  })
  .then(res => res.json())
  .then(json => {return json.ticker.ask})
  .catch(err => {
      console.log(err)
  })
}

const passOrder = (size) => {
const body =  {
  'side': 'buy',
  'type': 'market',
  'pair': 'BTC-AED',
  'amount': size
}
  return fetch(`https://api.bitoasis.net/v1/exchange/order`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }
  })
  .then(res => res.json())
  .then(json=> json.code == 404 ? console.log(json) :checkOrder(json.order.id))
  .catch(err => {
    console.log(err)
  })
}

const checkOrder = (id) => {
  return fetch(`https://api.bitoasis.net/v1/exchange/order/${id}`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  }
})
.then(res => res.json())
.then((json) => {console.log(json); return json})
.catch(err => {
    console.log(err)
})
}

const lastOrder = (param) => {
  return fetch(`https://api.bitoasis.net/v1/exchange/orders/BTC-AED${param}`, {
  method: 'GET',

  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  }
})
.then(res => res.json())
.then((json) => {return json})
.catch(err => {
    console.log(err)
})
}

const checkLastInterval = () => {
  return lastOrder("?limit=1")
  .then(x => {
    const date = new Date(x.orders[0].date_created);
    const now = new Date();
    const gap = now.getTime()-date.getTime();
    return [date,gap]}
  )
}

const sendEmail= (subject, text) => {

  let mailDetails = {
    from: 'benjaminbois@gmail.com',
    to: 'benjaminbois@gmail.com',
    subject,
    text,
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
    setTimeout(runTimer, 10000)
    console.log("Start within 10s")
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
  const orders = await lastOrder("?limit=1000").then(x => {return x.orders})
  const ordersCurrentYear = orders.filter(x => new Date(x.date_created).getFullYear() == date.getFullYear())
  const ordersCurrentMonth = ordersCurrentYear.filter(x => new Date(x.date_created).getMonth() == date.getMonth())
  const ordersPreviousDay = orders.filter(x => new Date(x.date_created).getMonth() == dateY.getMonth() && new Date(x.date_created).getFullYear() == dateY.getFullYear() && new Date(x.date_created).getDay() == dateY.getDay() )
  const analysis = [ordersCurrentYear,ordersCurrentMonth,ordersPreviousDay]
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
    This Year => ${(data[1]*100000000).toLocaleString(locale,formatSat)} SAT for ${data[0].toLocaleString(locale,formatFiat)} @ ${data[2].toLocaleString(locale,formatPriceAED)} (${(data[2]/3.673).toLocaleString(locale,formatPriceUSD)})
    This Month => ${(data[4]*100000000).toLocaleString(locale,formatSat)} SAT for ${data[3].toLocaleString(locale,formatFiat)} @ ${data[5].toLocaleString(locale,formatPriceAED)} (${(data[5]/3.673).toLocaleString(locale,formatPriceUSD)})
    Yestarday => ${(data[7]*100000000).toLocaleString(locale,formatSat)} SAT for ${data[6].toLocaleString(locale,formatFiat)} @ ${data[8].toLocaleString(locale,formatPriceAED)} (${(data[8]/3.673).toLocaleString(locale,formatPriceUSD)})
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


runTimer()



