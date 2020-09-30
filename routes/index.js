var express = require('express');
var router = express.Router();

var fs = require('fs');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Vizualização de Dados Heterogêneos' });
});

/* GET visualizacao page. */
/*
router.get('/visualizacao', function(req, res, next) {
  res.render('visualizacao', { title: 'Tipos de Vizualização' });
});
*/

router.post('/visualizacao', async (req, res) => {
  try {
      if(!req.files) {
          res.send({
              status: false,
              message: 'No file uploaded'
          });
      } else {
          //Use the name of the input field (i.e. "arquivo") to retrieve the uploaded file
          var tmp = req.files.arquivo;
          
          //Use the mv() method to place the file in upload directory (i.e. "uploads")
          tmp.mv('./uploads/' + tmp.name);

          try {
            var rawdata = fs.readFileSync('uploads/exemplo.json');
            var myJSON = JSON.parse(rawdata);
            console.log(myJSON);

            dataset = myJSON;
            dataFields = [];

            console.log(1);
            // PREMISSA: considera que o JSON é um array de objetos.
            // *********
 
            // Obtendo o nome dos campos utilizando o primeiro objeto como referência.
            obj = dataset[0];
            console.log(2);
            // Logging property names and values using Array.forEach
            Object.getOwnPropertyNames(obj).forEach(function(val, idx, array) {
              //console.log(val + ' -> ' + obj[val]);
              dataFields.push(val);
            });
            //console.log(dataFields);
            console.log(3);
            
      
            content = "<p>";
            for(i=0;i<dataFields.length;i++) {
              content+= dataFields[i] + " # ";
            }
            content+= "</p>";
      
            for(i=0;i<dataset.length;i++) {
              content+= "<p>" + dataset[i][dataFields[0]] + " # " + dataset[i][dataFields[1]] + " # " + dataset[i][dataFields[2]] + " # " + "</p>"; 
            }


            //$("#content").html(content);
            console.log(content);

            res.render('visualizacao', { title: 'Teste', content: myJSON } );


          }
          catch (e) {
            console.log( 'Não foi possível carregar o JSON. ');
            console.log(e)
          }

/*
          //send response
          res.send({
              status: true,
              message: 'File is uploaded',
              data: {
                  name: tmp.name,
                  mimetype: tmp.mimetype,
                  size: tmp.size
              }
          });
          */
      }
  } catch (err) {
      res.status(500).send(err);
  }
});

module.exports = router;
