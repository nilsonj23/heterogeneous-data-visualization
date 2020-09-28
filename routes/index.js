var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Vizualização de Dados Heterogêneos' });
});

/* GET visualizacao page. */
router.get('/visualizacao', function(req, res, next) {
  res.render('visualizacao', { title: 'Tipos de Vizualização' });
});

module.exports = router;
