var express = require('express');
var router = express.Router();

var fs = require('fs');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', { title: 'Vizualização de Dados Heterogêneos' });
});

/* GET Selecionando Views page. */
router.get('/select', function (req, res, next) {
    res.render('select', { title: 'Selecionando Possiveis Views' });
});


/* GET visualizacao page. */
/*
router.get('/visualizacao', function(req, res, next) {
    res.render('visualizacao', { title: 'Tipos de Vizualização' });
});
*/

//router.post('/visualizacao', async (req, res) => {
router.post('/visualizacao', function (req, res, next) {
    try {

        if (!req.files)
            throw "o upload não foi realizado.";


        //Use the name of the input field (i.e. "arquivo") to retrieve the uploaded file
        var tmp = req.files.arquivo;

        try {
            var myJSON = JSON.parse(tmp.data);
        } catch (e) {
            console.log('arquivo JSON inválido.');
            throw e;
        }
        console.log(myJSON);

        dataset = myJSON;
        dataFields = [];

        // PREMISSA: considera que o JSON é um array de objetos.
        // *********

        // Obtendo o nome dos campos utilizando o primeiro objeto como referência.
        obj = dataset[0];
        // Logging property names and values using Array.forEach
        Object.getOwnPropertyNames(obj).forEach(function (val, idx, array) {
            //console.log(val + ' -> ' + obj[val]);
            dataFields.push(val);
        });
        //console.log(dataFields);


        content = "<p>";
        for (i = 0; i < dataFields.length; i++) {
            content += dataFields[i] + " # ";
        }
        content += "</p>";

        for (i = 0; i < dataset.length; i++) {
            content += "<p>" + dataset[i][dataFields[0]] + " # " + dataset[i][dataFields[1]] + " # " + dataset[i][dataFields[2]] + " # " + "</p>";
        }

        //$("#content").html(content);
        console.log(content);

        res.render('visualizacao', { title: 'Teste', content: myJSON });

    } catch (e) {
        console.log('final');
        console.log(e);
        res.status(500).send(e);
    }

});

module.exports = router;
