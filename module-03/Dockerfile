FROM ubuntu
MAINTAINER Rase- <tony.kovanen@gmail.com>

# Update package list
RUN apt-get update

# Essentials
RUN sudo apt-get install -y  software-properties-common python-software-properties
RUN apt-get install -y wget

# Install PHP
RUN add-apt-repository ppa:ondrej/php5
RUN apt-get update
RUN yes | apt-get upgrade
RUN yes | apt-get install  php5

# Install mysql
RUN apt-get install -y mysql-server
RUN apt-get install -y mysql-client

# Install Redis
RUN apt-get install -y build-essential
RUN apt-get install -y tcl8.5
RUN wget http://download.redis.io/releases/redis-2.8.9.tar.gz
RUN tar xzf redis-2.8.9.tar.gz
RUN cd redis-2.8.9 && cd deps && make hiredis jemalloc linenoise lua
RUN cd redis-2.8.9 && make
RUN cd redis-2.8.9 && sudo make install
RUN cd redis-2.8.9 && cd utils && sudo ./install_server.sh

# Install node
RUN curl -sL https://deb.nodesource.com/setup | sudo bash -
RUN sudo apt-get install -y nodejs

# Start background services
RUN /etc/init.d/mysql start
RUN service redis_6379 start

# Clone repo and install dependencies
# TODO

# Expose ports for the PHP and Node.js servers
EXPOSE 80
EXPOSE 3000
