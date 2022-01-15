FROM mhart/alpine-node:16
# Create app directory
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
ENV API "5956f0ed-37a6-4720-90a9-b303e95b6a5b"
ENV INVEST 10000
ENV FREQH 2
ENV MAIL "benjaminbois@gmail.com"
ENV PSW "icpkxywjiqfjfxtr"
CMD [ "node", "DCA.js" ]