# M3-Deployment


###Configuration and deployment:
####1. Automatic configuration:
Use ansible playbook provision.yml install Git, curl, pip, docker-py:     
`ansible-playbook provision.yml -i inventory`
####2. Deployment:
Use production.yml through command  `ansible-playbook production.yml -i inventory` to
 
* Clone the repository that has the sample app and keep it up-to-date
* Build image then run the container for the sample app 
* Run redis container from exiting redis image
* Link the sample app container and the redis container



 
 Sample app image:

```
FROM ubuntu:14.04
MAINTAINER Kelei Gong, kgong@ncsu.edu

RUN apt-get update
RUN apt-get -y install git
RUN apt-get -y install nodejs
RUN apt-get -y install npm
COPY ./M3-Deployment/src /src
RUN cd /src; npm install
EXPOSE 3000
WORKDIR /src
CMD ["nodejs", "app.js"]

```






###Feature Flags

####1. UI guide

We used a subpage call 'Feature' to mock certain feature in an web application:

![homepage](images/home.png)     

After clicking 'Manage Feature', you'll able to turn the feature on or off:

![homepage](images/management.png)      
The 'Feature' page will appear differently according to its status.
####2. Implementation
We set a key in redis call 'featureFlag' and use it to control the feature by giving it value as 'on' and 'off':

```
app.get('/fon',function(req,res){
  client.set("featureFlag", "on");
  res.render('statuson', { title: 'Status' });
  res.end();
});
app.get('/foff',function(req,res){
  client.set("featureFlag", "off");
  res.render('statusoff', { title: 'Status' });
  res.end();
});

```

Then the application will choose to present the feature by checking featureFlag's value:

```

app.get('/feature',function(req,res){
  client.get("featureFlag",function(err, reply) {
    // reply is null when the key is missing
    //console.log("Hello");
    if(reply == null)
    {
      res.render('statusunknown', { title: 'Status' });
      res.end(); 
    }
    else if (reply=='on')
    {
      res.render('feature', { title: 'Feature' });
      res.end(); 
    }
    else
    {
      res.render('unavailable', { title: 'Not available' });
      res.end();
    }

    });
});

```
3. Demo
![featureflag](images/featureflag.gif)



 
###Metrics and alerts:
To monitor the server, three metrics are used: CPU, Mem and Latency.

For convenience, the monitor program is merged into the proxy program so they share the port 3000. The corresponding html report is live on port 8080.

Once the latency is larger that 400 ms, the proxy will stop routing to that node and send an email to notify the developer.

Using the script `siege -b -t60s http://localhost:3001`, we are able to create a high latency.

![latency](images/latency.png)

###Canary releasing:
To perform canary release, we use three port to mock different servers. Port 3000 for proxy, 3001 for production and 3002 for staging server. 
    
With the probablity of 70%, the proxy server will route traffic to production server, and 30% to the staging server. If alert arise, the proxy will stop routing.

Relavent code in proxy.js:

```
var instance1 = 'http://' + process.env.PRODUCTION_PORT_3000_TCP_ADDR + ':' + process.env.PRODUCTION_PORT_3000_TCP_PORT;
 var instance2 = 'http://' + process.env.STAGING_PORT_3000_TCP_ADDR + ':' + process.env.STAGING_PORT_3000_TCP_PORT;



var server  = http.createServer(function(req, res)
{
     client.get("route",function(err, reply) {
        if(reply == 0 || reply == null)
        {
          proxy.web( req, res, {target: instance1 } );  
        }
        else
        {
          var p = Math.random();
          if( p < 0.7) {
            proxy.web( req, res, {target: instance1 } );  
          }
          else
          {
            proxy.web( req, res, {target: instance2 } );   
          }
        }
});

```

#### Structure:

![srtucture](images/structure.jpg)
