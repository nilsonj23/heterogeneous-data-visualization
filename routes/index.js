var express = require('express');
var router = express.Router();

var fs = require('fs');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Visualização de Dados Heterogêneos' });
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
    console.log('getFieldNamesFromObject');
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


function buildAggregateDataset(obj, xFields, yField) {
    console.log('buildAggregateDataset');
    tmp = [];
    Object.getOwnPropertyNames(obj).forEach(function(val, idx, array) {
        //'#@!USA#@!Walt Disney#@!Ação'
        partes = val.split('#@!');
        item = {};
        for (var j=0;j<xFields.length;j++) {
            item[xFields[j]] = partes[j+1];
        }
        item[yField] = obj[val]['v'];
        tmp.push( item );
    });
    return tmp;
}
function buildDatasetSANKEY(myJsonDoc, xFields, yField, aggregateOption ) {
    console.log('buildDatasetSANKEY');
    arTemp = {};
    for(var i=0;i<myJsonDoc.length;i++) {
        yValue = parseFloat(extractNumber(myJsonDoc[i][yField]));
        tmp = '';
        for(var j=0;j<xFields.length;j++)
            tmp = tmp + '#@!' + myJsonDoc[i][xFields[j]];

        if (arTemp[tmp] === undefined)
            arTemp[tmp] = { v: yValue, c: 1 };
        else {
            c = arTemp[tmp]['c'];
            v = arTemp[tmp]['v'];

            if (aggregateOption==0) { //SUM
                v = parseFloat( yValue + v );
            } else if (aggregateOption==1) { //AVG
                v = parseFloat( ( yValue + (v*c) ) / (c+1) );
            } else if (aggregateOption==2) { //MAX
                v = (yValue > v) ? yValue : v;
            } else { //MIN
                v = (yValue < v) ? yValue : v;
            }
            arTemp[tmp] = { v: v, c: c+1 };
        }
    }
    //console.log(arTemp);

    temporaryDataset = buildAggregateDataset(arTemp, xFields, yField);
    //console.log(temporaryDataset);


    objNodes = {};
    objLinks = {};
    // Para cada campo configurado como X
    z = 0;
    for(var i=0;i<temporaryDataset.length;i++) {

        item = {};
        item['y'] = parseFloat(temporaryDataset[i][yField]);
        item['count'] = 1;

        source = '';
        for(var j=0;j<xFields.length;j++) {

            xField = xFields[j];
            value = j + '#' + temporaryDataset[i][xField];

            if (objNodes[value] === undefined) {
                objNodes[value] = { id: z };
                target = z;
                z++;
            } else
                target = objNodes[value]['id'];

            if (j>0) {
                // a partir do segundo campo, j=1, temos as relações "source(j-1) -> target(j)".
                if ((objLinks[source] === undefined) || (objLinks[source][target] === undefined)) {
                    if (objLinks[source] === undefined) {
                        objLinks[source] = {};
                    }
                    objLinks[source][target] = item;
                } else {
                    newItem = {};
                    c = objLinks[source][target]['count'];
                    v = objLinks[source][target]['y'];
                    
                    newItem['count'] = c+1;
                    //if (aggregateOption==0) { //SUM
                        newItem['y'] = parseFloat( item['y'] + v );
                    /*
                    } else if (aggregateOption==1) { //AVG
                        newItem['y'] = parseFloat( ( item['y'] + (v*c) ) / (c+1) );
                    } else if (aggregateOption==2) { //MAX
                        newItem['y'] = (item['y'] > v) ? item['y'] : v;
                    } else { //MIN
                        newItem['y'] = (item['y'] < v) ? item['y'] : v;
                    }
                    */
                    objLinks[source][target] = newItem;
                }
            }
            source = target;
        }
    }
    //console.log(objNodes);
    //console.log(objLinks);

    nodes = buildNodes(objNodes);
    links = buildLinks(objLinks);

    dataset = { nodes: nodes, links: links };
    //console.log(dataset);
    return dataset;

}

function buildNodes(obj) {
    console.log('buildNodes');
    tmp = [];
    Object.getOwnPropertyNames(obj).forEach(function(val, idx, array) {
        //console.log(val + ' -> ' + obj[val]);
        tmp.push( { node: obj[val]['id'], name: val.substr(val.indexOf('#')+1) } );
    });
    return tmp;
}
function buildLinks(obj) {
    console.log('buildLinks');

    var tmp = [];
    Object.getOwnPropertyNames(obj).forEach(function(val, idx, array) {

        var origem = parseInt(val);
        source = obj[val];

        Object.getOwnPropertyNames(source).forEach(function(val, idx, array) {
            var newItem = {};
            newItem['source'] = origem;
            newItem['target'] = parseInt(val);
            newItem['value'] = source[val]['y'];
            tmp.push( newItem );
        });
    });
    //console.log('output');
    //console.log(tmp);
    return tmp;
}



function buildDataset(myJsonDoc, xField, yField, aggregateOption ) {
    console.log('buildDataset');
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
 * validarSintaxeMapeamento
 * validar o arquivo de mapeamento, conforme as regras/elementos esperados.
 * 
 * Retorno: void
 * */
function validarSintaxeMapeamento(myJsonMap) {
    console.log('validarSintaxeMapeamento');

    try {
        if ( (myJsonMap.idDoc === undefined) || (myJsonMap.idDoc == '') )
            throw { msg: 'campo "idDoc" ausente ou incorreto'};

        if ( (myJsonMap.visualizations === undefined) || (myJsonMap.visualizations.length == 0) )
            throw { msg: 'campo "visualizations" ausente ou incorreto'};
    } catch(e) {
        throw e;
    }

    try {
        if (myJsonMap.tableNumber === undefined)
            throw { msg: 'campo "tableNumber" ausente'};
        tmp = 0;
        try {
            tmp = parseInt(myJsonMap.tableNumber);
        } catch(e) {
            tmp = 0;
        }
        // Aceitar apenas números a partir de 1.
        if (tmp < 1)
            throw { msg: 'campo "tableNumber" inválido'};
    } catch(e) {
        throw e;
    }


    // iterar por cada visualização mapeada
    for (var i=0;i<myJsonMap.visualizations.length;i++) {

        myMap = myJsonMap['visualizations'][i];

        // Verificar o tipo de gráfico escolhido
        try {
            if (    (myMap['visualizationType'] === undefined) || 
                    (   (myMap['visualizationType'] != 'BAR_CHART') &&
                        (myMap['visualizationType'] != 'SANKEY')
                    )
                )
                throw { msg: 'campo "visualizationType" ausente ou incorreto'};
        } catch(e) {
            throw e;
        }

        /*
         * COMUNS
         ********************
         */
        // Verificar se o campo para o components foi informado
        try {
            if (myMap['components'] === undefined)
                throw { msg: 'campo "components" ausente'};
        } catch(e) {
            throw e;
        }

        // Verificar se o campo para o componente Y foi informado
        try {
            if (    (myMap['components']['y'] === undefined) ||
                    (myMap['components']['y']['field'] === undefined)
            )
                throw { msg: 'campo "components.y.field" ausente'};
        } catch(e) {
            throw e;
        }

        // Verificar o agrupamento de dados
        aggregateOptions = [ 'SUM', 'AVG', 'MAX', 'MIN' ];
        try {
            if (myMap['components']['y']['aggregate'] === undefined)
                aggregateOption = 0;
            else {
                aggregateOption = aggregateOptions.indexOf(myMap['components']['y']['aggregate']);
                if (aggregateOption < 0)
                    throw { msg: 'campo "components.y.aggregate" inválido'};
            }
        } catch(e) {
            throw e;
        }

        /*
         * GRÁFICO DE BARRAS
         ********************
         */
        if (myMap['visualizationType'] == 'BAR_CHART') {

            // Verificar se o campo para o componente X foi informado
            try {
                if (    (myMap['components']['x'] === undefined) || 
                        (myMap['components']['x']['field'] === undefined) 
                    )
                    throw { msg: 'campo "components.x.field" ausente'};
            } catch(e) {
                throw e;
            }

            try {
                if (    (myMap['components']['x']['value'] !== undefined) &&
                        (myMap['components']['x']['value']['dataValue'] !== undefined)
                ) {
                    param = myMap['components']['x']['value']['dataValue'];
                    if ( (param!='FULL') && (param!='FIRST_3LETTERS') )
                        throw { msg: 'campo "components.x.value.dataValue" inválido' };
                }
            } catch(e) {
                throw e;
            }

            // Verificar o tipo de cor informado para a barra
            try {
                barColorType = 'SOLID';
                if (    (myMap['components']['bar'] !== undefined) &&
                        (myMap['components']['bar']['colorType'] !== undefined) 
                )
                    barColorType = myMap['components']['bar']['colorType'];

                if ( (barColorType!='SOLID') && (barColorType!='GRADIENT') )
                    throw { msg: 'campo "components.bar.colorType" inválido'};
            } catch(e) {
                throw e;
            }

            // Verificar a ordenação
            try {
                if (    (myMap['components']['others'] !== undefined) &&
                        (myMap['components']['others']['sortBy'] !== undefined)
                ) {
                    if (    (myMap['components']['others']['sortBy'] != 'x') && 
                            (myMap['components']['others']['sortBy'] != 'y')
                    )
                        throw { msg: 'campo "components.others.sortBy" inválido'};
                }
                if (    (myMap['components']['others'] !== undefined) &&
                        (myMap['components']['others']['sortOrder'] !== undefined)
                ) {
                    if (    (myMap['components']['others']['sortOrder'] != 'asc') &&
                            (myMap['components']['others']['sortOrder'] != 'desc')
                    )
                        throw { msg: 'campo "components.others.sortOrder" inválido'};
                }
            } catch(e) {
                throw e;
            }

        }

        /*
         * GRÁFICO SANKEY
         ********************
         */
        if (myMap['visualizationType'] == 'SANKEY') {

            // Verificar se o campo para o componente X foi informado
            try {
                if (    (myMap['components']['x'] === undefined) ||
                        (myMap['components']['x']['fields'] === undefined)
                )
                    throw { msg: 'campo "components.x.fields" ausente'};

                if (myMap['components']['x']['fields']['length'] < 2)
                    throw { msg: 'campo "components.x.fields" deve ter pelo menos 2(dois) campos.'};
            } catch(e) {
                throw e;
            }

        }

    }

}


/*
 * mapeamentosDatasets
 * validar os arquivos de dados e mapeamento, conforme as regras esperadas.
 * 
 * Retorno: void
 * */
function mapeamentosDatasets(myJsonDoc, mapeamentos, myDataFields) {
    console.log('mapeamentosDatasets');

    datasets = [];

    campos = myDataFields;

    // iterar por cada visualização mapeada
    for (var i=0;i<mapeamentos['visualizations']['length'];i++) {

        myMap = mapeamentos['visualizations'][i];
        dataset = [];

        // Verificar o agrupamento de dados
        aggregateOptions = [ 'SUM', 'AVG', 'MAX', 'MIN' ];
        try {
            if (myMap['components']['y']['aggregate'] === undefined)
                aggregateOption = 0;
            else
                aggregateOption = aggregateOptions.indexOf(myMap['components']['y']['aggregate']);
        } catch(e) {
            throw e;
        }

        yField = myMap['components']['y']['field'];

        // Verificar se o campo Y informado existe no conjunto de dados
        try {
            if (campos.indexOf(yField) < 0)
                throw { msg: 'campo "components.y.field" informado não existe'};
        } catch(e) {
            throw e;
        }

        // Verificar o tipo de gráfico escolhido
        if (myMap['visualizationType'] == 'BAR_CHART') {
            
            xField = myMap['components']['x']['field'];

            // Verificar se o campo X informado existe no conjunto de dados
            try {
                if (campos.indexOf(xField) < 0)
                    throw { msg: 'campo "components.x.field" informado não existe'};
            } catch(e) {
                throw e;
            }

            dataset = buildDataset(myJsonDoc, xField, yField, aggregateOption );

            // ordernar o dataset
            sortBy = '';
            sortOrder = '';
            try {
                if (    (myMap['components']['others'] !== undefined) &&
                        (myMap['components']['others']['sortBy'] !== undefined)
                )
                    sortBy = myMap['components']['others']['sortBy'];

                if (    (myMap['components']['others'] !== undefined) &&
                        (myMap['components']['others']['sortOrder'] !== undefined)
                ) 
                    sortOrder = myMap['components']['others']['sortOrder'];

                if (sortBy != '') {
                    dataset.sort(function(a, b){
                        if (sortBy=='x') {
                            s1 = a[xField].toLowerCase();
                            s2 = b[xField].toLowerCase();
                            if ( (sortOrder=='') || (sortOrder=='asc') ) {
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
                            if ( (sortOrder=='') || (sortOrder=='asc') )
                                return a[yField] - b[yField];
                            else
                                return b[yField] - a[yField];
                        }
                    });
                }
            } catch(e) {
                throw e;
            }

        }

        if (myMap['visualizationType'] == 'SANKEY') {

            //xFields = [ 'Localidade', 'Categoria 1', 'Categoria 2' ];
            xFields = myMap['components']['x']['fields'];

            // Verificar se os campos selecionados para X existem no conjunto de dados
            try {
                for (var z=0;z<xFields.length;z++) {
                    if (campos.indexOf(xFields[z]) < 0)
                        throw { msg: 'campo "components.x.fields" informado não existe'};
                }
            } catch(e) {
                throw e;
            }

            dataset = buildDatasetSANKEY(myJsonDoc, xFields, yField, aggregateOption );
            
        }

        datasets.push( dataset );

    }

    /*
    //dataset = buildDataset(myJsonDoc, xField, yField, aggregateOption );

    camposTeste = [ 'Localidade', 'Categoria 1', 'Categoria 2' ];
    //camposTeste = [ 'Categoria 1', 'Categoria 2', 'Localidade' ];
    dataset = buildDatasetSANKEY(myJsonDoc, camposTeste, yField, aggregateOption );
    */

    return datasets;

}





/*
 * validarArquivos
 * validar os arquivos de dados e mapeamento, conforme as regras esperadas.
 * 
 * Retorno: void
 * */
function validarArquivos(myJsonDoc, myJsonMap, myDataFields) {
    console.log('validarArquivos');

    // Verificar o tipo de gráfico escolhido
    try {
        if ( (myJsonMap['visualizationType'] === undefined) || (myJsonMap['visualizationType'] != 'BAR_CHART') )
            throw { msg: 'campo "visualizationType" ausente ou incorreto'};
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

    // Verificar o tipo de cor informado para a barra
    var barColorType = 'SOLID';
    try {
        if (myJsonMap.components.bar.colorType !== undefined)
        barColorType = myJsonMap.components.bar.colorType;

        if ( (barColorType!='SOLID') && (barColorType!='GRADIENT') )
            throw { msg: 'campo "components.bar.colorType" inválido'};
    } catch(e) {
        throw e;
    }



    // Verificar o agrupamento de dados
    aggregateOptions = [ 'SUM', 'AVG', 'MAX', 'MIN' ];
    try {
        if (myJsonMap['components']['y']['aggregate'] === undefined)
            aggregateOption = 0;
        else {
            aggregateOption = aggregateOptions.indexOf(myJsonMap['components']['y']['aggregate']);
            if (aggregateOption < 0)
                throw { msg: 'campo "components.y.aggregate" inválido'};
                // Mudar para SUM e mostrar mensagem para o usuário.
        }
    } catch(e) {
        throw e;
    }

    //dataset = buildDataset(myJsonDoc, xField, yField, aggregateOption );

    camposTeste = [ 'Localidade', 'Categoria 1', 'Categoria 2' ];
    //camposTeste = [ 'Categoria 1', 'Categoria 2', 'Localidade' ];
    dataset = buildDatasetSANKEY(myJsonDoc, camposTeste, yField, aggregateOption );

    //PARADA.AISLAN;
/*
    // ordernar o dataset
    var sortBy = '';
    var sortOrder = '';
    try {
        if (myJsonMap['components']['others']['sortBy'] !== undefined) {
            if (myJsonMap['components']['others']['sortBy'] == 'x')
                sortBy = 'x'
            else if (myJsonMap['components']['others']['sortBy'] == 'y')
                sortBy = 'y'
            else
                throw { msg: 'campo "components.others.sortBy" inválido'};
        }
        if (myJsonMap['components']['others']['sortOrder'] !== undefined) {
            if (myJsonMap['components']['others']['sortOrder'] == 'asc')
                sortOrder = 'asc'
            else if (myJsonMap['components']['others']['sortOrder'] == 'desc')
                sortOrder = 'desc'
            else
                throw { msg: 'campo "components.others.sortOrder" inválido'};
        }
        if (sortBy != '') {
            dataset.sort(function(a, b){
                if (sortBy=='x') {
                    s1 = a[xField].toLowerCase();
                    s2 = b[xField].toLowerCase();
                    if ( (sortOrder=='') || (sortOrder=='asc') ) {
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
                    if ( (sortOrder=='') || (sortOrder=='asc') )
                        return a[yField] - b[yField];
                    else
                        return b[yField] - a[yField];
                }
            });
        }
    } catch(e) {
        throw e;
    }
*/
    return dataset;

}

/*
 * Fazer a conversão do documento do Google Docs para JSON
 *
 * */
function GoogleDocs2Json(id, myResolve, myReject) {
    console.log('GoogleDocs2Json');

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
        console.log('GoogleDocs2Json.authorize');
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
        console.log('GoogleDocs2Json.printDocTitle');
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
 * Extrair uma das tabelas existente no JSON, conforme a numeração indicada.
 *
 * */
function ExtractTable(dados, tableNumber, myResolve, myReject) {
    console.log('ExtractTable');
    try {

        seq = 0;

        //data = dados;
        data = dados['body']['content'];
        n = data.length;
        dataTable = [];
        for(var section=0;section<n;section++) {
        
            dt = data[section];

            if (dt['table'] !== undefined)
                seq++;

            if (seq==tableNumber) {

                // Encontrou a tabela desejada.
        
                // Numero de linhas
                rows = dt['table']['rows'];
                // Numero de colunas
                columns = dt['table']['columns'];
        
                // PREMISSA: a primeira linha da tabela contém as colunas; 
                // os dados começam a partir da segunda linha.
                // -------------------------------------------------------
                columnNames = [];
                for(var column=0;column<columns;column++)
                    columnNames.push( dt['table']['tableRows'][0]['tableCells'][column]['content'][0]['paragraph']['elements'][0]['textRun']['content'].split('\n')[0].replace("'","\'") );
                console.log(columnNames);
                //break
        
                for(var row=1;row<rows;row++) {
                    item = {};
                    for(var col=0;col<columns;col++) {
                        value = dt['table']['tableRows'][row]['tableCells'][col]['content'][0]['paragraph']['elements'][0]['textRun']['content'].split('\n')[0].replace("'","\'");
                        item[columnNames[col]] = value;
                    }
                    dataTable.push(item);
                }
                // Este comando impede que uma tabela diferente da desejada seja considerada.
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

        try {
            validarSintaxeMapeamento(myJsonMap);
        } catch(e) {
            console.log('arquivo JSON com sintaxe incorreta.');
            throw e;
        }

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
                    ExtractTable(response, myJsonMap['tableNumber'], resolveExtractTable, rejectExtractTable);
                });

                promiseExtractTable.then(
                    function(response) {
                        //console.log(response);
                        console.log('promiseExtractTable resolvida');

                        // Validar o arquivo fornecido
                        var myDataFields;
                        var datasets;
                        try {
                           
                            myJsonDoc = response;

                            // Obtendo o nome dos campos utilizando o primeiro objeto como referência.
                            // PREMISSA: todos os registros devem ter o mesmo número de campos.
                            myDataFields = getFieldNamesFromObject(myJsonDoc[0]);

                            //dataset = validarArquivos(myJsonDoc, myJsonMap, myDataFields);
                            datasets = mapeamentosDatasets(myJsonDoc, myJsonMap, myDataFields);

                        } catch(e) {
                            throw e;
                        }

                        res.render('analise2', { 
                            title: 'Análise', 
                            data: { 
                                myJsonDoc: myJsonDoc, 
                                myJsonMap: myJsonMap, 
                                myDataFields: myDataFields,
                                datasets: datasets
                            } 
                        });

                    },
                    function(error) {
                        console.log('promiseExtractTable error');
                        console.log(error);
                        throw error;
                    }
                );

            },
            function(error) {
                console.log('promiseConvertDoc error');
                console.log(error);
                throw error;
            }
        );

    } catch (e) {
        console.log('final');
        console.log(e);
        res.status(500).send(e);
    }

});

module.exports = router;
