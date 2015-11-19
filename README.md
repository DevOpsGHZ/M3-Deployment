# M3-Deployment


###Configuration and deployment:
####1. Automatic configuration:
We use the technics from [HW1](https://github.com/DevOpsHW/DevOps-HW1) to launch a AWS instance, create the `inventory` file, and then use an 
ansible playbook `provision.yml` to do the automatic configuration, including install Git, curl, Docker, pip, docker-py:     

    ansible-playbook -i inventory deployment/provision.yml

It will configure the server to be ready for deploying.
####2. Deployment:
We deploy our app by using Docker, in total we use 4 containers, one for the production app, one for 
the staging app, one for the proxy/monitor and the last one for the Redis server. 

If we want to deploy the production app, we can use command  
    
    ansible-playbook -i inventory deployment/production.yml
 
Basically, in the `production.yml` playbook it will do:
* Clone/pull the repository that has the app and keep it up-to-date 
* Run Redis in container from Redis image
* Build image then run the container for the production app
* Link the app container and the Redis container
* Restart production app.

![image](images/ansible.png)
The playbook `staging.yml` is for deploy staging app, it will clone/pull code from the `dev` branch.
 And `proxy.yml` is for deploy the proxy/monitor app. The proxy app will be deployed in a separate container, and it will reach to other apps by defining `links`:
 ```
 links:
          - "myredis:redis"
          - "app:production"
          - "staging-app:staging"
 ```
The connections between apps and Redis server are also achieved in this way.


When build the app image, we use a Dockerfile like this:
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

For each app we have a different Dockerfile, to complete some specified build tasks based on the different situations. Like in the Dockerfile for proxy app, we use another verison of Node, as the `heartbeat` seems not working in the latest Node version.

```
FROM ubuntu:14.04
MAINTAINER Kelei Gong, kgong@ncsu.edu

RUN apt-get update
RUN apt-get -y install git
RUN apt-get -y install nodejs
RUN apt-get -y install nodejs-legacy
RUN apt-get -y install npm
RUN apt-get -y install wget
COPY ./M3-Deployment/src /src
RUN npm install n -g
RUN n 0.10.33
RUN cd /src; npm install
RUN npm install http-server -g
EXPOSE 3000
EXPOSE 8080
WORKDIR /src
CMD ["node", "proxy.js"]
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
