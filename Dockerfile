FROM ubuntu:14.04
MAINTAINER Kelei Gong, kgong@ncsu.edu

RUN apt-get update
RUN apt-get -y install git
RUN apt-get -y install nodejs
RUN apt-get -y install npm
RUN wget http://download.redis.io/releases/redis-3.0.5.tar.gz
RUN tar xzf redis-3.0.5.tar.gz
RUN cd /redis-3.0.5; make
RUN cd /
COPY . /src
RUN cd /src; npm install
EXPOSE 8080
CMD ["node", "/src/main.js", "8080"]