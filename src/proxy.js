var sio = require('socket.io')
  , http = require('http')
  , request = require('request')
  , os = require('os')
  ;

var app = http.createServer(function (req, res) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end();
    })
  , io = sio.listen(app);

function memoryLoad()
{
  return ~~ ( 100 * (os.totalmem() - os.freemem()) / os.totalmem());
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
  return ~~ ( 100 * (totalDifference - idleDifference) / totalDifference );
}

function measureLatenancy(node)
{
  var options = 
  {
    url: 'http://localhost' + ":" + node.port,
  };

  var startTime = Date.now();
  var latency;
  request(options, function (error, res, body) 
  {
    node.latency = Date.now() - startTime;
  });

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
    if( latency > 8000 )
    {
      color = "#ff0000";
    }
    else if( latency > 4000 )
    {
      color = "#cc0000";
    }
    else if( latency > 2000 )
    {
      color = "#ffff00";
    }
    else if( latency > 1000 )
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
nodeServers.push( { 'port': 3000, 'latency': 0 } );
nodeServers.push( { 'port': 3030, 'latency': 0 } );

var appNode = { 'port': 3080, 'latency': 0 };

///////////////
//// Broadcast heartbeat over websockets
//////////////
setInterval( function () 
{
  io.sockets.emit('heartbeat', 
  { 
        name: "Your Computer", cpu: cpuAverage(), memoryLoad: memoryLoad(), latency: measureLatenancy(appNode),
        nodes: calcuateColor()
   });

}, 2000);

app.listen(3080);

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