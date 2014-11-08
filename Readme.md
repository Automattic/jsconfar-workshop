![http://www.jsconfar.com](https://cldup.com/AKtnDKavB0.png)

jsconfar-workshop
=================

Workshop repository for [jsconfar.com](http://www.jsconfar.com) - Nov 28, 2014
Let's create an application to administer WordPress services. The source of
these services can reside in WordPress.com or a WordPress installacion (aka
WordPress.org).

# Modules

1. Services Connect

  We create a nodeijs application to connect it with WordPress.
  We use `node-wpcom-oauth` to get oauth authorization and use `wpcom.js` to
  connect out application with services.

  a. Create/grab a WordPress service

  b. Create a Developer WordPress.com application

  c. [Make a really simple web server with express.js](./module-01/c/Readme.md)

  d. Add `node-wpcom-oauth` dependency

  f. Create routes to run oauth steps

  e. Add `wpcom.js` module, create a simple route to get user info

2. Job queue

  The idea is can make job queued of WordPress requests, so we'll update our
  data with the real data in WordPress servers.

3. Store Data

  We store to data from WordPress services (throught of kue) in our local dB.
  We use `mydb` modules

4. Diff - Event emission
