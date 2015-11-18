var request = require('supertest');
var express = require('express');
var app = require('../app.js');



describe('routes', function(){
  it('should get /', function(done){
    request(app)
      .get('/')
      .expect(200, done);
  })
  it('should get /users', function(done){
    request(app)
      .get('/users')
      .expect(200, done);
  })
  it('should fail to get /noexsiting', function(done){
    request(app)
      .get('/noexsiting')
      .expect(404, done);
  })
  it('should have text content in homepage', function(done){
    request(app)
      .get('/')
      .expect('Content-Type',/text/)
      .expect(200, done);
  })
  it('should have text content in /users page', function(done){
    request(app)
      .get('/users')
      .expect('Content-Type',/text/)
      .expect(200, done);
  })
  it('should have text content in homepage', function(done){
    request(app)
      .get('/')
      .expect('Content-Length',310)
      .expect(200, done);
  })




})