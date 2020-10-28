var express = require('express');
var router = express.Router();

var fs = require('fs');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', { title: 'Vizualização de Dados Heterogêneos' });
});

/* GET buildToken. */
router.get('/buildToken', function(req, res, next) {

	const fs = require('fs');
	const readline = require('readline');
	const {google} = require('googleapis');

	// If modifying these scopes, delete token.json.
	const SCOPES = ['https://www.googleapis.com/auth/documents.readonly'];
	// The file token.json stores the user's access and refresh tokens, and is
	// created automatically when the authorization flow completes for the first
	// time.
	const TOKEN_PATH = 'token.json';

	// Load client secrets from a local file.
	fs.readFile('credentials.json', (err, content) => {
	  if (err) return console.log('Error loading client secret file:', err);
	  // Authorize a client with credentials, then call the Google Docs API.
	  authorize(JSON.parse(content), printDocTitle);
	});

	/**
	 * Create an OAuth2 client with the given credentials, and then execute the
	 * given callback function.
	 * @param {Object} credentials The authorization client credentials.
	 * @param {function} callback The callback to call with the authorized client.
	 */
	function authorize(credentials, callback) {
	  const {client_secret, client_id, redirect_uris} = credentials.installed;
	  const oAuth2Client = new google.auth.OAuth2(
		  client_id, client_secret, redirect_uris[0]);

	  // Check if we have previously stored a token.
	  fs.readFile(TOKEN_PATH, (err, token) => {
		if (err) return getNewToken(oAuth2Client, callback);
		oAuth2Client.setCredentials(JSON.parse(token));
		callback(oAuth2Client);
	  });
	}

	/**
	 * Get and store new token after prompting for user authorization, and then
	 * execute the given callback with the authorized OAuth2 client.
	 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
	 * @param {getEventsCallback} callback The callback for the authorized client.
	 */
	function getNewToken(oAuth2Client, callback) {
	  const authUrl = oAuth2Client.generateAuthUrl({
		access_type: 'offline',
		scope: SCOPES,
	  });
	  console.log('Authorize this app by visiting this url:', authUrl);
	  const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	  });
	  rl.question('Enter the code from that page here: ', (code) => {
		rl.close();
		oAuth2Client.getToken(code, (err, token) => {
		  if (err) return console.error('Error retrieving access token', err);
		  oAuth2Client.setCredentials(token);
		  // Store the token to disk for later program executions
		  fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
			if (err) console.error(err);
			console.log('Token stored to', TOKEN_PATH);
		  });
		  callback(oAuth2Client);
		});
	  });
	}

	/**
	 * Prints the title of a sample doc:
	 * https://docs.google.com/document/d/195j9eDD3ccgjQRttHhJPymLJUCOUjs-jmwTrekvdjFE/edit
	 * @param {google.auth.OAuth2} auth The authenticated Google OAuth 2.0 client.
	 */
    function printDocTitle(auth) {
        const docs = google.docs({version: 'v1', auth});
        docs.documents.get({
            documentId: '1WhDyphFEwvYB-3nJ4pWgti_jGFCji0ff-rdlIKgL0J4' /*'1_SxMIxxdZ_g6zwlPB3VTX54bi8p82XBVgADh-MZaAwk'*/
        }, (err, res) => {
            if (err) 
                return console.log('The API returned an error: ' + err);
            
            console.log( 'concluído com sucesso' );
            /*
            //console.log( JSON.stringify(res.data) );
            fs.writeFile('output.json', JSON.stringify(res.data), (err) => {
                if (err) console.error(err);

                console.log('arquivo gerado');
            });
            //data = res.data;
            //data = res.data['body']['content'];
            */
           
        });
    }
});


/* GET visualizacao page. */
router.get('/visualizacao', function(req, res, next) {
    res.render('visualizacao', { title: 'Vizualização de Dados Heterogêneos' });
});


/*
 * getFieldNamesFromObject
 * obter uma lista com o nome dos campos existentes em um objeto JS
 * 
 * Retorno: array
 * */
function getFieldNamesFromObject(obj) {
    tmp = []
    Object.getOwnPropertyNames(obj).forEach(function(val, idx, array) {
        //console.log(val + ' -> ' + obj[val]);
        tmp.push(val);
    });
    //console.log(tmp);
    return tmp;
}

/*
 * Extrair um valor a partir de uma string
 * PREMISSSA: o separador decimal é vírgula (comma)
 * Desconsidera tudo que não for dígito e o separador.
 */
function extractNumber(string) {
    tmp = string;
    tmp = tmp.replace(/[^0-9,]/g,'');
    tmp = tmp.replace(',','.');
    return tmp;
}

/*
 * Encontrar o índice de um registro em um dataset
 * pela pesquisa de um par key-value.
 */
function pesquisar(dataset, field, data) {
    indice = -1;
    for(var i=0;i<dataset.length;i++) {
        if (dataset[i][field] == data) indice = i;
    }
    return indice;
}

function buildDataset(myJsonDoc, xField, yField, aggregateOption ) {
    // Montar o dataset para o gráfico, considerando os elementos informados
    dataset = [];
    for(var i=0;i<myJsonDoc.length;i++) {
        item = {};
        item[xField] = myJsonDoc[i][xField];
        item[yField] = parseFloat(extractNumber(myJsonDoc[i][yField]));
        item['count'] = 1;

        indice = pesquisar( dataset, xField, myJsonDoc[i][xField] );
        if (indice<0) {
            dataset.push(item);
        } else {
            c = dataset[indice]['count'];
            if (aggregateOption==0) { //SUM
                item[yField] = parseFloat( item[yField] + dataset[indice][yField] );
                item['count'] = c+1;
            } else if (aggregateOption==1) { //AVG
                item[yField] = parseFloat( ( item[yField] + (dataset[indice][yField]*c) ) / (c+1) );
                item['count'] = c+1;
            } else if (aggregateOption==2) { //MAX
                item[yField] = (item[yField] > dataset[indice][yField]) ? item[yField] : dataset[indice][yField];
                item['count'] = c+1;
            } else { //MIN
                item[yField] = (item[yField] < dataset[indice][yField]) ? item[yField] : dataset[indice][yField];
                item['count'] = c+1;
            }
            dataset[indice] = item;
        }

    }
    //console.log(dataset);
    return dataset;
}

/*
 * validarArquivos
 * validar os arquivos de dados e mapeamento, conforme as regras esperadas.
 * 
 * Retorno: void
 * */
function validarArquivos(myJsonDoc, myJsonMap, myDataFields) {
    console.log('verificando arquivos ...');

    // Verificar o tipo de gráfico escolhido
    try {
        if ( (myJsonMap['type'] === undefined) || (myJsonMap['type'] != 'BAR_CHART') )
            throw { msg: 'campo "type" ausente ou incorreto'};
    } catch(e) {
        throw e;
    }

    // Verificar se o campo para o componente X foi informado
    try {
        if (myJsonMap['components']['x']['field'] === undefined)
            throw { msg: 'campo "components.x.field" ausente'};
        xField = myJsonMap['components']['x']['field'];
    } catch(e) {
        throw e;
    }

    // Verificar se o campo para o componente Y foi informado
    try {
        if (myJsonMap['components']['y']['field'] === undefined)
            throw { msg: 'campo "components.y.field" ausente'};
        yField = myJsonMap['components']['y']['field'];
    } catch(e) {
        throw e;
    }

    // Obtendo o nome dos campos
    // PREMISSA: todos os registros têm os mesmos campos.
    //campos = getFieldNamesFromObject(myJsonDoc[0]);
    campos = myDataFields;

    // Verificar se os campo X e Y informados existem no conjunto de dados
    try {
        if (campos.indexOf(xField) < 0)
            throw { msg: 'campo "components.x.field" informado não existe'};
        if (campos.indexOf(yField) < 0)
            throw { msg: 'campo "components.y.field" informado não existe'};
    } catch(e) {
        throw e;
    }

    // Verificar o agrupamento de dados
    aggregateOptions = [ 'SUM', 'AVG', 'MAX', 'MIN' ];
    try {
        if (myJsonMap['components']['bar']['aggregate'] === undefined)
            aggregateOption = 0;
        else {
            aggregateOption = aggregateOptions.indexOf(myJsonMap['components']['bar']['aggregate']);
            if (aggregateOption < 0)
                throw { msg: 'campo "components.bar.aggregate" inválido'};
                // Mudar para SUM e mostrar mensagem para o usuário.
        }
    } catch(e) {
        throw e;
    }

    dataset = buildDataset(myJsonDoc, xField, yField, aggregateOption );

    // ordernar o dataset
    var order = '';
    var orderAsc = '';
    try {
        if (myJsonMap['components']['others']['order'] !== undefined) {
            if (myJsonMap['components']['others']['order'] == 'x')
                order = 'x'
            else if (myJsonMap['components']['others']['order'] == 'y')
                order = 'y'
            else
                throw { msg: 'campo "components.others.order" inválido'};
        }
        if (myJsonMap['components']['others']['orderAsc'] !== undefined) {
            if (myJsonMap['components']['others']['orderAsc'] == 'asc')
                orderAsc = 'asc'
            else if (myJsonMap['components']['others']['orderAsc'] == 'desc')
                orderAsc = 'desc'
            else
                throw { msg: 'campo "components.others.orderAsc" inválido'};
        }
        if (order != '') {
            dataset.sort(function(a, b){
                if (order=='x') {
                    s1 = a[xField].toLowerCase();
                    s2 = b[xField].toLowerCase();
                    if ( (orderAsc=='') || (orderAsc=='asc') ) {
                        if (s1 < s2) { return -1; }
                        if (s1 > s2) { return  1; }
                        return 0;
                    }
                    else {
                        if (s2 < s1) { return -1; }
                        if (s2 > s1) { return  1; }
                        return 0;
                    }
                }
                else {
                    if ( (orderAsc=='') || (orderAsc=='asc') )
                        return a[yField] - b[yField];
                    else
                        return b[yField] - a[yField];
                }
            });
        }
    } catch(e) {
        throw e;
    }

    return dataset;

}

/*
 * Fazer a conversão do documento do Google Docs para JSON
 *
 * */
function GoogleDocs2Json(id, myResolve, myReject) {

    const fs = require('fs');
	const readline = require('readline');
    const {google} = require('googleapis');

    var idDoc = id;

	// If modifying these scopes, delete token.json.
	const SCOPES = ['https://www.googleapis.com/auth/documents.readonly'];
	// The file token.json stores the user's access and refresh tokens, and is
	// created automatically when the authorization flow completes for the first
	// time.
	const TOKEN_PATH = 'token.json';

	// Load client secrets from a local file.
	fs.readFile('credentials.json', (err, content) => {
        if (err) {
            console.log('Error loading client secret file:', err);
            myReject(err);
        }
        // Authorize a client with credentials, then call the Google Docs API.
        authorize(JSON.parse(content), printDocTitle);
    });

	/**
	 * Create an OAuth2 client with the given credentials, and then execute the
	 * given callback function.
	 * @param {Object} credentials The authorization client credentials.
	 * @param {function} callback The callback to call with the authorized client.
	 */
	function authorize(credentials, callback) {
        const {client_secret, client_id, redirect_uris} = credentials.installed;
        const oAuth2Client = new google.auth.OAuth2(
            client_id, client_secret, redirect_uris[0]
        );
        // Check if we have previously stored a token.
        fs.readFile(TOKEN_PATH, (err, token) => {
            if (err) {
                myReject(err);
            }
            oAuth2Client.setCredentials(JSON.parse(token));
            callback(oAuth2Client);
        });
    }

	/**
	 * Prints the title of a sample doc:
	 * https://docs.google.com/document/d/195j9eDD3ccgjQRttHhJPymLJUCOUjs-jmwTrekvdjFE/edit
	 * @param {google.auth.OAuth2} auth The authenticated Google OAuth 2.0 client.
	 */
    function printDocTitle(auth) {
        const docs = google.docs({version: 'v1', auth});
        docs.documents.get({
            /*
            '1WhDyphFEwvYB-3nJ4pWgti_jGFCji0ff-rdlIKgL0J4' 
            '1_SxMIxxdZ_g6zwlPB3VTX54bi8p82XBVgADh-MZaAwk'
            */
            documentId: idDoc
        }, (err, res) => {
            if (err) {
                //return console.log('The API returned an error: ' + err);
                console.log('The API returned an error: ' + err);
                myReject(err);
            } else {
                console.log( 'Google Docs convertido com sucesso' );
                //console.log( JSON.stringify(res.data) );
                myResolve(res.data);
            }
        });
    }

}



/*
 * Extrair a primeira tabela existente no JSON
 *
 * */
function ExtractTable(dados, myResolve, myReject) {
    try {
        //data = dados;
        data = dados['body']['content'];

        // Extrair o cabeçalho e os dados da primeira tabela do documento
        dataTable = [];

        n = data.length;
        for(var section=0;section<n;section++) {
        
            dt = data[section];
            if (dt['table'] !== undefined) {
        
                // Numero de linhas
                rows = dt['table']['rows'];
                // Numero de colunas
                columns = dt['table']['columns'];
        
                // PREMISSA: a primeira linha da tabela contém as colunas; 
                // os dados começam a partir da segunda linha.
                // -------------------------------------------------------
                columnNames = [];
                for(var column=0;column<columns;column++)
                    columnNames.push( dt['table']['tableRows'][0]['tableCells'][column]['content'][0]['paragraph']['elements'][0]['textRun']['content'] );
                console.log(columnNames);
                //break
        
                for(var row=1;row<rows;row++) {
                    item = {};
                    for(var col=0;col<columns;col++) {
                        value = dt['table']['tableRows'][row]['tableCells'][col]['content'][0]['paragraph']['elements'][0]['textRun']['content'].split('\n')[0];
                        item[columnNames[col]] = value;
                    }
                    dataTable.push(item);
                }
                // Este comando impede que uma segunda tabela seja considerada
                break;
            }
        }
        //console.log(dataTable);
        myResolve(dataTable);
    } catch (e) {
        myReject(e);
    }

}


router.post('/analise', function(req, res, next) {
    try {

        var localVar = req.app.get('globalVars');

        if(!req.files)
            throw "o upload não foi realizado.";

        //var arqDoc = req.files.arquivo1;
        var arqMap = req.files.arquivoMapeamento;
        try {
            //var myJsonDoc = JSON.parse(arqDoc.data);
            var myJsonDoc;
            var myJsonMap = JSON.parse(arqMap.data);
        } catch(e) {
            console.log('arquivo JSON de mapeamento é inválido.');
            throw e;
        }
        //console.log(myJsonMap);

        //Converter o Google Docs indicado no mapeamento para o formato JSON
        //---------
        promiseConvertDoc = new Promise(function(resolveConvertDoc, rejectConvertDoc) {
            GoogleDocs2Json(myJsonMap['idDoc'], resolveConvertDoc, rejectConvertDoc);
        });
        promiseConvertDoc.then(
            function(response) {
                console.log('promiseConvertDoc resolvida');

                // Extrair apenas a tabela que interessa.
                // -------
                promiseExtractTable = new Promise(function(resolveExtractTable, rejectExtractTable) {
                    ExtractTable(response, resolveExtractTable, rejectExtractTable);
                });

                promiseExtractTable.then(
                    function(response) {
                        //console.log(response);
                        console.log('promiseExtractTable resolvida');

                        // Validar os arquivos fornecidos
                        var myDataFields;
                        var dataset;
                        try {
                            myJsonDoc = response;
                            // Obtendo o nome dos campos utilizando o primeiro objeto como referência.
                            // PREMISSA: todos os registros devem ter o mesmo número de campos.
                            myDataFields = getFieldNamesFromObject(myJsonDoc[0]);
                            dataset = validarArquivos(myJsonDoc, myJsonMap, myDataFields);
                        } catch(e) {
                            throw e;
                        }
                        //console.log(dataset);

                        res.render('analise2', { 
                            title: 'Teste', 
                            data: { 
                                myJsonDoc: myJsonDoc, 
                                myJsonMap: myJsonMap, 
                                myDataFields: myDataFields,
                                dataset: dataset 
                            } 
                        });

                    },
                    function(error) {
                        console.log('promiseExtractTable error');
                        console.log(error);
                    }
                );

            },
            function(error) {
                console.log('promiseConvertDoc error');
                console.log(error);
            }
        );

    } catch (e) {
        console.log('final');
        console.log(e);
        res.status(500).send(e);
    }

});

module.exports = router;
