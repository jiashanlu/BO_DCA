import fetch from "node-fetch"
import nodemailer from "nodemailer"

const apiKey = process.env.API
const investPerMonth = process.env.INVEST
const freqencyInHour = process.env.FREQH
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
        console.log('Error Occurs');
    } else {
        console.log('Email sent successfully');
    }
  });
}

const runTimer = async () => {
  const lastInterval = await checkLastInterval()
  const timer = interval - lastInterval[1]
  console.log(timer)
  new Date().getDay() != lastInterval[0].getDay() ? mailSynthesis() : ""
  if (timer > 0){
    setTimeout(runTimer, timer)
  } 
  else{
    console.log("DCA started")
    await DCA()
    setTimeout(runTimer, 10000)
  } 

}

const DCA = async () => {
  const balances = await checkBalance()
  console.log(balances)
  const aedBalance = balances.balances.AED
  aedBalance < investPerMonth *0.1 ? sendEmail("DCA - low AED Balance", `balance is ${aedBalance}`) : ""
  const price = await checkPrice()
  const btcToBuy = (amountInAED / price).toFixed(8).toString()
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
  sendEmail("DCA - Daily update", 
    `balances are ${balances.balances.AED} AED & ${balances.balances.BTC} BTC, 
    This Year => ${data[1].toFixed(8)*100000000} SAT for ${data[0].toFixed(2)} AED @${data[2].toFixed(2)} AED ($${(data[2]/3.673).toFixed(0)}), 
    This Month => ${data[4].toFixed(8)*100000000} SAT for ${data[3].toFixed(2)} AED @${data[5].toFixed(2)} AED ($${(data[5]/3.673).toFixed(0)}), 
    Yestarday => ${data[7].toFixed(8)*100000000} SAT for ${data[6].toFixed(2)} AED @${data[8].toFixed(2)} AED ($${(data[8]/3.673).toFixed(0)}), 
    `)
}

runTimer()



