# M3-Deployment

###Automatic configuration of production environment:
###Triggered, remote deployment:
###Feature Flags

####1. Front-end guild
We used a subpage call 'Feature' to mock certain feature in an application:
![homepage](images/home.png)
After clicking 'Manage Feature', you'll able to turn the feature on or off:
![homepage](images/management.png)
The 'Feature' page will appear differently according to its status.
####2. Implementation
We used a key call 'featureFlag' and use it to control the feature by giving it value as 'on' and 'off':

```
app.get('/fon',function(req,res){
  client.set("featureFlag", "on");
  res.send('feature is on');
});
app.get('/foff',function(req,res){
  client.set("featureFlag", "off");
  res.send('feature is off');
});

```


 
###Metrics and alerts:
###Canary releasing: