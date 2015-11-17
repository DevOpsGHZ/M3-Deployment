var http      = require('http');
var httpProxy = require('http-proxy');
var redis = require('redis')
var exec = require('child_process').exec;
var request = require("request");
// var client = redis.createClient(6379, '127.0.0.1', {})
var instance1 = 'http://127.0.0.1:3000';
var instance2  = 'http://127.0.0.1:3001';

// var TARGET = BLUE;

var infrastructure =
{
  setup: function()
  {
    // Proxy.
    client.lpush('servers', instance1);
    client.lpush('servers', instance2);
    client.ltrim('servers', 0, 1);
    var options = {};
    var proxy   = httpProxy.createProxyServer(options);

    var server  = http.createServer(function(req, res)
    {
      proxy.web( req, res, {target: instance2 } );  
      // client.rpoplpush('servers', 'servers', function (err, reply){
        // proxy.web( req, res, {target: reply } );  
      // })
      
      // res.send("haha");
      // console.log(res);
    });
    server.listen(3000);

    // Launch green slice
    // exec('forever start --watch main.js 3000', function(err, out, code) 
    // {
    //   console.log("attempting to launch instance1");
    //   if (err instanceof Error)
    //         throw err;
    //   if( err )
    //   {
    //     console.error( err );
    //   }
    // });

    // // Launch blue slice
    // exec('forever start --watch main2.js 3001', function(err, out, code) 
    // {
    //   console.log("attempting to launch instance2");
    //   if (err instanceof Error)
    //     throw err;
    //   if( err )
    //   {
    //     console.error( err );
    //   }
    // });

//setTimeout
//var options = 
//{
//  url: "http://localhost:8080",
//};
//request(options, function (error, res, body) {

  },

  teardown: function()
  {
    exec('forever stopall', function()
    {
      console.log("infrastructure shutdown");
      process.exit();
    });
  },
}

infrastructure.setup();

// Make sure to clean up.
process.on('exit', function(){infrastructure.teardown();} );
process.on('SIGINT', function(){infrastructure.teardown();} );
process.on('uncaughtException', function(err){
  console.error(err);
  infrastructure.teardown();} );