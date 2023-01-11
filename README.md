# BO_DCA - A Dollar-Cost Averaging bot for BitOasis

## Overview

This script is a bot that uses BitOasis API to automate the dollar-cost averaging (DCA) strategy for buying Bitcoin. The script uses several environment variables to configure the behavior of the bot. It also uses the npm library 'node-fetch' to make requests to the BitOasis API. It uses 'nodemailer' to send emails when the order is created successfully and 'csv-writer' to create a CSV file to keep a record of the orders.

## Requirements
- A BitOasis account and API keys
- Node.js (v12 or later)
- npm

## Environment Variables
The script accepts the following environment variables:
- `API` : the BitOasis API key, e.g API=YOUR_API_KEY
- `INVEST`: the amount in AED to invest per month. e.g INVEST=1000
- `FREQH` : the frequency of purchase in hours. e.g FREQH=24
- `MAIL` : email address to send notifications. e.g MAIL=YOUR_EMAIL
- `PSW` : email password. e.g PSW=YOUR_EMAIL_PASSWORD

## Note:
It is important to keep your API keys private and secure. Also, Make sure that your email and password are correct and your email service allows low-security apps access.

## Support
If you have any questions or issues with this script, please contact the maintainer of the project on GitHub: https://github.com/jiashanlu/BO_DCA

## License
This project is open-source and available under the [MIT License](https://opensource.org/licenses/MIT).

## Acknowledgements
- node-fetch, nodemailer and csv-writer npm libraries.

