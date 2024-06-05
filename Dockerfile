FROM mhart/alpine-node:16
# Create app directory
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
ENV API "my BitOasis API key"
ENV INVEST 10000 
ENV FREQH 2
ENV MAIL "myemail@mail.com"
ENV PSW "my_password"
CMD [ "node", "DCA.js" ]