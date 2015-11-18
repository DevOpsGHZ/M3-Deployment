# M3-Deployment

###Automatic configuration of production environment

###Triggered, remote deployment:
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