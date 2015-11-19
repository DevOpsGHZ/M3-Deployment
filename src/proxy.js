var http      = require('http');
var httpProxy = require('http-proxy');
var redis = require('redis')
var exec = require('child_process').exec;
var request = require("request");
var os = require("os");
var nodemailer = require('nodemailer');
// var client = redis.createClient(6379, '127.0.0.1', {})
// var instance1 = 'http://127.0.0.1:3030';
// var instance2  = 'http://127.0.0.1:3060';
var client = redis.createClient(process.env.REDIS_PORT_6379_TCP_PORT,process.env.REDIS_PORT_6379_TCP_ADDR, {})
var instance1 = 'http://' + process.env.PRODUCTION_PORT_3000_TCP_ADDR + ':' + process.env.PRODUCTION_PORT_3000_TCP_PORT;
var instance2 = 'http://' + process.env.STAGING_PORT_3000_TCP_ADDR + ':' + process.env.STAGING_PORT_3000_TCP_PORT;
// var TARGET = BLUE;
var io;

var infrastructure =
{
  setup: function()
  {
    // Proxy.
//    client.lpush('servers', instance1);
//    client.lpush('servers', instance2);
//    client.ltrim('servers', 0, 1);
    client.set("percent", 0.8);
    var options = {};
    var proxy   = httpProxy.createProxyServer(options);

    var server  = http.createServer(function(req, res)
    {
      client.get("route",function(err, reply) {
        if(reply == 1 || reply == null)
        {
          proxy.web( req, res, {target: instance1 } );  
        }
        else if(reply == 2)
        {
          proxy.web( req, res, {target: instance2 } );  
        }
        else
        {
          client.get("percent", function(err, rep){
            var p = Math.random();
            if( p < Number(rep) ) {
              proxy.web( req, res, {target: instance1 } );  
            }
            else
            {
              proxy.web( req, res, {target: instance2 } );   
            }
          });
          
        }
      });
      
      // client.rpoplpush('servers', 'servers', function (err, reply){
        // proxy.web( req, res, {target: reply } );  
      // })
      
      // res.send("haha");
      // console.log(res);
    });


    // Launch green slice
    exec('cd www; http-server', function(err, out, code) 
     {
       console.log("attempting to launch monitor");
       if (err instanceof Error)
             throw err;
       if( err )
       {
         console.error( err );
       }
     });

    server.listen(3000);
    io = require('socket.io').listen(server);
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


///////////////////////////////////////////////////////////////// monitor

function memoryLoad()
{
  // console.log("memoryLoad");
  var load = ~~ ( 100 * (os.totalmem() - os.freemem()) / os.totalmem());
  if(load > 95)
  {
    client.set("route", 1);
    sendMail();
  }
  // if(load < 70)
  // {
  //   client.set("route", 1); 
  // }
  return load;
}

// Create function to get CPU information
function cpuTicksAcrossCores() 
{
  //Initialise sum of idle and time of cores and fetch CPU info
  var totalIdle = 0, totalTick = 0;
  var cpus = os.cpus();
 
  //Loop through CPU cores
  for(var i = 0, len = cpus.length; i < len; i++) 
  {
    //Select CPU core
    var cpu = cpus[i];
    //Total up the time in the cores tick
    for(type in cpu.times) 
    {
      totalTick += cpu.times[type];
    }     
    //Total up the idle time of the core
    totalIdle += cpu.times.idle;
  }
 
  //Return the average Idle and Tick times
  return {idle: totalIdle / cpus.length,  total: totalTick / cpus.length};
}

var startMeasure = cpuTicksAcrossCores();

function cpuAverage()
{
  var endMeasure = cpuTicksAcrossCores(); 
 
  //Calculate the difference in idle and total time between the measures
  var idleDifference = endMeasure.idle - startMeasure.idle;
  var totalDifference = endMeasure.total - startMeasure.total;
 
  //Calculate the average percentage CPU usage
  var usage = ~~ ( 100 * (totalDifference - idleDifference) / totalDifference );
  if(usage > 50)
  {
    client.set("route", 1);
    sendMail();
  }
  // if( usage <)

  return usage;
}

function measureLatenancy(node)
{
  var options = 
  {
    url: 'http://' + node.addr + ":" + node.port,
  };

  var startTime = Date.now();
  var latency;
  request(options, function (error, res, body) 
  {
    node.latency = Date.now() - startTime;
  });
  if(node.latency > 400)
  {
    client.set("route", 1);
    sendMail();
  }
  return node.latency;
}

function calcuateColor()
{
  // latency scores of all nodes, mapped to colors.
  var nodes = nodeServers.map( measureLatenancy ).map( function(latency) 
  {
    var color = "#cccccc";
    if( !latency )
      return {color: color};
    if( latency > 500 )
    {
      color = "#ff0000";
    }
    else if( latency > 400 )
    {
      color = "#cc0000";
    }
    else if( latency > 300 )
    {
      color = "#ffff00";
    }
    else if( latency > 200 )
    {
      color = "#cccc00";
    }
    else if( latency > 100 )
    {
      color = "#0000cc";
    }
    else
    {
      color = "#00ff00";
    }
    //console.log( latency );
    return {color: color};
  });
  //console.log( nodes );
  return nodes;
}


/// CHILDREN nodes
var nodeServers = [];
nodeServers.push( { 'addr': process.env.PRODUCTION_PORT_3000_TCP_ADDR, 'port': process.env.PRODUCTION_PORT_3000_TCP_PORT, 'latency': 0 } );
nodeServers.push( { 'addr': process.env.STAGING_PORT_3000_TCP_ADDR, 'port': process.env.STAGING_PORT_3000_TCP_PORT, 'latency': 0 } );

var appNode = {'addr': 'localhost', 'port': 3000, 'latency': 0 };

///////////////
//// Broadcast heartbeat over websockets
//////////////
setInterval( function () 
{
  io.sockets.emit('heartbeat', 
  { 
        name: "Server", cpu: cpuAverage(), memoryLoad: memoryLoad(), latency: measureLatenancy(appNode),
        nodes: calcuateColor()
   });

}, 2000);

// app.listen(3080);

/// NODE SERVERS

function createServer(port, fn)
{
  // Response to http requests.
  var server = http.createServer(function (req, res) {
      res.writeHead(200, { 'Content-Type': 'text/html' });

      fn();

      res.end();
   }).listen(port);
  nodeServers.push( appNode );
}

function sendMail()
{
    var transporter = nodemailer.createTransport();
    transporter.sendMail({
    from: 'automail@DevOpsGHZ.com',
    to: 'kgong@ncsu.edu',
    subject: 'abnomal behavior on sever',
    text: 'abnomal behavior on sever'
    });
}
