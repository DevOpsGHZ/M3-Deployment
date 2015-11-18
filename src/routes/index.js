var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Sample App' });
});

/* GET Hello World page. */
router.get('/manage', function(req, res) {
    res.render('manage', { title: 'Feature Management' });
});
//router.get('/feature', function(req, res) {
    //res.render('feature', { title: 'Feature' });
//});



module.exports = router;
