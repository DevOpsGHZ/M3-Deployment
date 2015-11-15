var request = require('supertest');
var express = require('express');
var app = require('../app.js');


describe('routes', function(){
  it('get /', function(done){
    request(app)
      .get('/')
      .expect(200, done);
  })
  it('get /users', function(done){
    request(app)
      .get('/users')
      .expect(200, done);
  })

})