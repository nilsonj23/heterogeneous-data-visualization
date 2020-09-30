var dataset;

var chartBuilded = 0;
var margin;
var svg;
var x;
var xAxis;
var y;
var yAxis;

var d3 = d3 || require('d3');
	  
function lerJSON() {
	console.log( 'lendo JSON ');
	console.log(d3);


	d3.text("exemplo.json").then(function(data) {
		console.log(data); // [{"Hello": "world"}, …]
	});
	console.log("passei");

	d3.json("uploads/exemplo.json", function(error, data) {
		console.log( 'dentro da funcao ');
		if (error) {
			console.log( 'Não foi possível carregar o JSON. ');
		}
		else {
			dataset = data;
			dataFields = [];

			// PREMISSA: considera que o JSON é um array de objetos.
			// *********
			
			// Obtendo o nome dos campos utilizando o primeiro objeto como referência.
			obj = dataset[0];
			// Logging property names and values using Array.forEach
			Object.getOwnPropertyNames(obj).forEach(function(val, idx, array) {
				//console.log(val + ' -> ' + obj[val]);
				dataFields.push(val);
			});
			//console.log(dataFields);
			

			content = "<p>";
			for(i=0;i<dataFields.length;i++) {
				content+= dataFields[i] + " # ";
			}
			content+= "</p>";

			for(i=0;i<dataset.length;i++) {
				content+= "<p>" + dataset[i][dataFields[0]] + " # " + dataset[i][dataFields[1]] + " # " + dataset[i][dataFields[2]] + " # " + "</p>"; 
			}
			//$("#content").html(content);
			return(content);

		}
	});
}


function iniciarGrafico() {

	chartBuilded = 1;
	
	// set the dimensions and margins of the graph
	margin = {top: 30, right: 30, bottom: 70, left: 60},
		width = 460 - margin.left - margin.right,
		height = 400 - margin.top - margin.bottom;

	// append the svg object
	svg = d3.select("#chart")
	  .append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
	  .append("g")
		.attr("transform",
			  "translate(" + margin.left + "," + margin.top + ")");

	// Initialize the X axis
	x = d3.scaleBand()
	  .range([ 0, width ])
	  .padding(0.2);

	xAxis = svg.append("g")
	  .attr("transform", "translate(0," + height + ")")

	// Initialize the Y axis
	y = d3.scaleLinear()
	  .range([ height, 0]);

	yAxis = svg.append("g")
	  .attr("class", "myYaxis")
	
	titulo = svg.append("text")
		.attr("id", "header")
		.attr("x", 0 )
		.attr("y", -10 )
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
        .attr("fill","#808080");
  
}

// A function that create / update the plot for a given variable:
function updateGrafico(selectedVar) {

	if (chartBuilded == 0) iniciarGrafico();
	
	data = dataset;
	
	// X axis
	x.domain(data.map(function(d) { return d.uf; }))
	xAxis.transition().duration(1000).call(d3.axisBottom(x))

	// Add Y axis
	y.domain([0, d3.max(data, function(d) { return +d[selectedVar] }) ]);
	yAxis.transition().duration(1000).call(d3.axisLeft(y));

	// variable u: map data to existing bars
	var u = svg.selectAll("rect").data(data);

	// update bars
	u.enter()
	  .append("rect")
	  .merge(u)
	  .transition()
	  .duration(1000)
		.attr("x", function(d) { return x(d.uf); })
		.attr("y", function(d) { return y(d[selectedVar]); })
		.attr("width", x.bandwidth())
		.attr("height", function(d) { return height - y(d[selectedVar]); })
		.attr("class", function(d) { 
			if (d.uf == "RJ")
				return "barra_azul"; 
			else
				return "barra_vermelha"; 
		})

	if (selectedVar == 'pib')
		tmp = "Produto Interno Bruto por Unidade da Federação";
	else
		tmp = "Número de mortes COVID por Unidade da Federação";
	
	svg.select("#header")
		.text(tmp);

}

module.exports = {
	lerJSON
}