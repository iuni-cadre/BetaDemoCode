
"use strict";

async function startVisualization() {
	var canvas = d3.select("#networkView").append("canvas");
	var svg = d3.select("#networkView").append("svg").attr("class", "plot");

	let width = 100;
	let height = 100;

	let startIndex = 0;
	let currentNetwork;
	let color = d3.scaleOrdinal(d3.schemeCategory10);
	// let partiesNames = {
	// 	"psdb": "PSDB",
	// 	"dem": "DEM",
	// 	"mdb": "MDB",
	// 	"pt": "PT",
	// 	"pp": "PP",
	// 	"pr": "PR",
	// 	"pcdob": "PCdoB",
	// 	"psb": "PSB",
	// 	"ptb": "PTB",
	// 	"pl": "PL",
	// 	// "pdt": "PDT"
	// };


	// let partiesToColors = {};
	// let showParties = true;
	// let topTopParties = [];

	let displayProperty = "id";
	let IDProperty = "id";
	let colorProperty = "Community";

	let startYear = 0;
	let endYear = 0;
	let networkName;
	let useDarkBackground = false;
	let renderLinksSVG = false;
	let renderLinksCanvas = false;
	let renderLinksGL = true;
	let renderGradientLinks = true;

	let dpr = 1.0;
	let zoomScale = 0.9;
	let scaleFactor = 0.0;
	let targetScaleFactor = 1.0;
	let linesIntensity = 0.2;
	let linesWidth = 4.0;
	let nodesSize = 70;

	let xscale = d3.scaleLinear();
	let yscale = d3.scaleLinear();

	let edgesIndices = null;
	let positionArray = null;
	let colorArray = null;
	let indexType = null;
	let edgesBuffer = null;
	let positionsBuffer = null;
	let colorsBuffer = null;
	let intensitiesBuffer = null;
	let edgesShaderProgram = null;

	d3.select('#saveSVGButton').on('click', function () {
		var config = {
			filename: currentNetwork.name,
		}
		if (!renderLinksSVG) {
			createSVGLinks();
			updateSVGLinks(100.0);
		}
		let toSaveSVG = d3.select("#networkView").append("svg")
			.classed("plot", true)
			.attr("width", width)
			.attr("height", height)
			.html(d3.select("svg").html());
		d3_save_svg.save(toSaveSVG.node(), config);
		toSaveSVG.remove();

		if (!renderLinksSVG) {
			deleteSVGLinks();
		}
	});

	let gl;
	if (renderLinksGL) {
		gl = createWebGLContext(canvas.node(), { antialias: true });
		let edgesShaderVertex = await getShader(gl, "edges-vertex");
		let edgesShaderFragment = await getShader(gl, "edges-fragment");

		edgesShaderProgram = new ShaderProgram(edgesShaderVertex, edgesShaderFragment,
			["linesIntensity"],
			["vertex", "color"],
			gl);
		indexType = gl.UNSIGNED_SHORT;
		edgesBuffer = gl.createBuffer();
		positionsBuffer = gl.createBuffer();
		colorsBuffer = gl.createBuffer();
		intensitiesBuffer = gl.createBuffer();
	}
	window.gl = gl;



	// if(!svgDefs)
	let svgDefs = svg.append('defs');
	let existingDef = new Set();
	let gradient = (colorFrom, colorTo) => {
		colorFrom = d3.rgb(colorFrom).hex();
		colorTo = d3.rgb(colorTo).hex();
		let gradientName = "grad" + colorFrom.replace("#", "") + colorTo.replace("#", "");
		if (!existingDef.has(gradientName)) {
			let mainGradient = svgDefs.append('linearGradient')
				.attr('id', gradientName)
				.attr('x1', "0%")
				.attr('x2', "100%")
				.attr('y1', "0%")
				.attr('y2', "100%");

			mainGradient.append('stop')
				.style("stop-color", colorFrom)
				.attr('offset', '0%');

			mainGradient.append('stop')
				.style("stop-color", colorTo)
				.attr('offset', '100%');

			existingDef.add(gradientName);
		}
		return "url(#" + gradientName + ")";
	};

	let nodes = [];
	let links = [];

	let forceLinks = 
			d3.forceLink(links)
				.id(d => d.id);
	 forceLinks.strength(d=>d.weight/Math.min(d.target.neigh.length, d.source.neigh.length))
				
	var simulation = d3.forceSimulation(nodes)
		.force("charge", d3.forceManyBody()
			.strength(-300)
			// .distanceMin(0.1)
			// .theta(0.5)

		)
		.force("link",
		forceLinks
		)
		.force("center", d3.forceCenter(0, 0))
		.force("x", d3.forceX().strength(0.02))
		.force("y", d3.forceY().strength(0.02))
		// .alphaTarget(10)
		.alphaDecay(0.0055)
		.velocityDecay(0.6)
		.on("tick", redraw);


	var g = svg.append("g");


	let linksView = g.append("g").attr("stroke", "#000").attr("stroke-width", 1.5).selectAll(".link");

	let nodesView = g.append("g").selectAll(".node");


	let legendView = svg.append("g")
		.attr("transform", "translate(10," + "10" + ")");


	let hoverTextBox = svg.append("g");

	let hoverText = hoverTextBox
		.append("text")
		.attr("text-anchor","end");

	function setDrawNetwork(network) {
		currentNetwork = network;
		let newNodes = [];
		let nodesDictionary = {};
		let ID2Nodes = {};
		links = [];
		let majorComponentSet = new Set();

		for (let index = 0; index < network.nodesCount; index++) {
			let inMajorComponent = false;
			if (network.verticesProperties.community) {
				if (network.verticesProperties.community[index] >= 0) {
					majorComponentSet.add(index);
					inMajorComponent = true;
				}
			} else {
				majorComponentSet.add(index);
				inMajorComponent = true;
			}

			if (inMajorComponent) {
				let node = {
					"id": IDProperty?network.verticesProperties[IDProperty][index]:(network.names ? network.names[index] : index),
				}
				for (let attribute in network.verticesProperties) {
					if (network.verticesProperties.hasOwnProperty(attribute)) {
						let element = network.verticesProperties[attribute];
						node[attribute] = element[index];
					}
				}
				node.index = newNodes.length;
				node.neigh = [];
				node.strength = 0;
				newNodes.push(node);
				nodesDictionary[index] = node;
				ID2Nodes[node.id] = node;
			}
		}

		for (let index = 0; index < network.edges.length; index++) {
			let edge = network.edges[index];
			if (majorComponentSet.has(edge[0]) && majorComponentSet.has(edge[1])) {
				let fromNode = nodesDictionary[edge[0]];
				let toNode = nodesDictionary[edge[1]];

				let edgeObject = {
					source: fromNode,
					target: toNode,
					weight: network.weights?network.weights[index]:1.0,
				}
				fromNode.neigh.push(toNode);
				toNode.neigh.push(fromNode);
				fromNode.strength=edgeObject.weight;
				toNode.strength=edgeObject.weight;
				links.push(edgeObject);
			}
		}

		nodes.forEach(node => {
			let previousID = node.id;
			if (ID2Nodes.hasOwnProperty(previousID)) {
				let newNode = ID2Nodes[previousID];
				newNode.x = node.x;
				newNode.y = node.y;
				newNode.vx = node.vx;
				newNode.vy = node.vy;
				newNode.existed = true;
			}
		});

		newNodes.forEach(node => {
			let sumX = 0;
			let sumY = 0;
			let sumVX = 0;
			let sumVY = 0;
			let sumCount = 0;
			if (!node.existed) {
				node.neigh.forEach(neighNode => {
					if (neighNode.existed) {
						sumX += neighNode.x;
						sumY += neighNode.y;
						sumVX += neighNode.vx;
						sumVY += neighNode.vy;
						sumCount++;
					}
				});
				node.x = sumX / sumCount;
				node.y = sumVY / sumCount;
				node.vx = sumVX / sumCount;
				node.vy = sumVY / sumCount;
			}
		});

		nodes = newNodes;
	}




	function contains(a, obj) {
		var i = a.length;
		while (i--) {
			if (a[i] === obj) {
				return true;
			}
		}
		return false;
	}



	function restart() {
		color = d3.scaleOrdinal(d3.schemeCategory10);
		let topColorProperties = sortByFrequency(nodes.map(d=>d[colorProperty])).slice(0, 10);
		let propertyToColor = {};
		topColorProperties.forEach(d=> propertyToColor[d] = color(d));
		nodes.forEach(d => {
			if (propertyToColor.hasOwnProperty(d[colorProperty])) {
				d.color = propertyToColor[d[colorProperty]];
			} else {
				if (useDarkBackground) {
					d.color = "#333333";
				} else {
					d.color = "#cccccc";
				}
			}
		});
		links.forEach(d => d.color = gradient(d.source.color, d.target.color));
		// Apply the general update pattern to the nodes.
		nodesView = nodesView.data(nodes, function (d) { return d.id; });
		nodesView.exit().remove();
		nodesView = nodesView.enter().append("circle")
			.merge(nodesView)
			.style('opacity', 1)
			.attr("fill", d => d.color)
			.attr("r", 2+nodesSize/Math.sqrt(nodes.length))
			.on("mouseover", function(d){
				d3.select(this).attr("r",4+nodesSize/Math.sqrt(nodes.length)*2)
				.attr("stroke", d3.rgb(d.color).darker(1))
				.attr("stroke-width", 2);
				hoverText.attr("fill", d.color)
				.text(`${d[displayProperty]}`);
			})
			.on("mouseout", function(d){
				d3.select(this).attr("r",2+nodesSize/Math.sqrt(nodes.length))
				.attr("stroke", null)
				.attr("stroke-width", null);

				hoverText.text(null);
			})


		if (renderLinksSVG) {
			createSVGLinks();
		}

		if (renderLinksGL) {
			updateGLNodesAndEdges();
			updateEdgesGLGeometry();
			updateNodesGLColors();
		}
		// Update and restart the simulation.
		simulation.nodes(nodes);
		simulation.force("link").links(links);
		simulation
			.alpha(1.0)
			.restart();

		// updateLegend();
	}

	function createSVGLinks() {
		linksView = linksView.data(links, d => d.source.id + "-" + d.target.id);
		linksView.exit().remove();

		if (renderGradientLinks) {
			let linkNew = linksView.enter().append("g");

			linkNew.append("line")
				.attr("stroke", d => d.color)
				.attr("opacity", 0.1)
				.attr("x1", 0)
				.attr("y1", 0)
				.attr("x2", 1.0 / Math.sqrt(2))
				.attr("y2", 1.0 / Math.sqrt(2));//Hack

			linksView = linkNew.merge(linksView);
		} else {
			let linkNew = linksView.enter().append("line")
				.attr("opacity", 0.1);
			linksView = linkNew.merge(linksView);
		}
	}

	function deleteSVGLinks() {
		linksView = linksView.data([]);
		linksView.exit().remove();
	}
	function updateSVGLinks(strokeFactor = 2.0) {
		if (renderGradientLinks) {
			linksView.attr("transform", d => {
				return getTransformForLine(
					xscale(d.source.x),
					yscale(d.source.y),
					xscale(d.target.x),
					yscale(d.target.y),
				);
			}).attr("stroke-width", d => {
				return strokeFactor / getStrokeCorrectionForLine(
					xscale(d.source.x),
					yscale(d.source.y),
					xscale(d.target.x),
					yscale(d.target.y),
				);
			});
		} else {
			linksView
				.attr("x1", d => xscale(d.source.x))
				.attr("y1", d => yscale(d.source.y))
				.attr("x2", d => xscale(d.target.x))
				.attr("y2", d => yscale(d.target.y));
		}
	}

	function updateLegend() {
		let legendItems = legendView.selectAll(".legend").data(Object.keys(partiesToColors));
		legendItems.exit().remove();


		legendItems.enter().append("g")
			.attr("transform", (d, i) => ("translate(0," + (i * 20) + ")"))
			.classed("legend", true);

		legendItems.append("rect")
			.attr("x", 0)
			.attr("y", 0)
			.attr("width", 30)
			.attr("height", 15)
			.attr("fill", d => partiesToColors[d]);

		legendItems.append("g")
			.attr("transform", (d) => (`translate(${35},${15 / 2})`))
			.append("text")
			.text(d => partiesNames[d])
			.style("alignment-baseline", "central");

	}

	function updateGLNodesAndEdges() {
		positionArray = new Float32Array(nodes.length * 2);//2D
		colorArray = new Float32Array(nodes.length * 3);
		edgesIndices = new Uint16Array(links.length * 2);
		// console.log("Update Nodes and Edges Arrays Done!");
	}

	function updateNodesGLGeometry() {
		nodes.forEach((node, index) => {
			positionArray[index * 2] = (node.x ? ((xscale(node.x)) / width * 2 - 1) : 0.0);
			positionArray[index * 2 + 1] = (node.y ? (-(yscale(node.y)) / height * 2 + 1) : 0.0);
		});
		// for (let index = 0; index < nodes.length; index+=2) {
		// 	positionArray[index*2] = 0;
		// 	positionArray[index*2+1] = 0;
		// 	positionArray[index*2+2] = index/1000;
		// 	positionArray[index*2+3] = index*index/100000;
		// }

		gl.bindBuffer(gl.ARRAY_BUFFER, positionsBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, positionArray, gl.DYNAMIC_DRAW);
		// console.log(positionArray);
		// console.log(`Update Nodes Done! (${positionArray.length})` );
	}

	function updateEdgesGLGeometry() {
		links.forEach((edge, index) => {
			edgesIndices[index * 2] = edge.source.index;
			edgesIndices[index * 2 + 1] = edge.target.index;
		});


		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, edgesBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, edgesIndices, gl.DYNAMIC_DRAW);
		// console.log(`Update Edges Done! (${edgesIndices.length})` );
	}

	function updateNodesGLColors() {

		nodes.forEach((node, index) => {
			let color = d3.rgb(node.color);
			colorArray[index * 3] = color.r / 255.0;
			colorArray[index * 3 + 1] = color.g / 255.0;
			colorArray[index * 3 + 2] = color.b / 255.0;
		});

		gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, colorArray, gl.DYNAMIC_DRAW);
		// console.log(`Update Colors Done! (${colorArray.length})` );

	}

	function redrawEdgesGL() {
		// gl.depthMask(false);
		if (useDarkBackground) {
			gl.clearColor(0.0, 0.0, 0.0, 1.0);
		} else {
			gl.clearColor(1.0, 1.0, 1.0, 1.0);
		}

		gl.clear(gl.COLOR_BUFFER_BIT);

		gl.lineWidth(linesWidth);
		gl.enable(gl.BLEND);
		if (useDarkBackground) {
			gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
		} else {
			//gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
			gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA,
				gl.ZERO, gl.ONE);
		}

		updateNodesGLGeometry();

		edgesShaderProgram.use(gl);

		edgesShaderProgram.attributes.enable("vertex");
		edgesShaderProgram.attributes.enable("color");

		gl.bindBuffer(gl.ARRAY_BUFFER, positionsBuffer);
		gl.vertexAttribPointer(edgesShaderProgram.attributes.vertex, 2, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);
		gl.vertexAttribPointer(edgesShaderProgram.attributes.color, 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, edgesBuffer);

		//gl.uniform2fv(edgesShaderProgram.uniforms.nearFar,[0.1,10.0]);
		gl.uniform1f(edgesShaderProgram.uniforms.linesIntensity, linesIntensity);

		//drawElements is called only 1 time. no overhead from javascript
		gl.drawElements(gl.LINES, edgesIndices.length, indexType, 0);

		//disabling attributes
		edgesShaderProgram.attributes.disable("vertex");
		edgesShaderProgram.attributes.disable("color");

	}



	function redraw() {
		let svgNode = svg.node();
		let canvasNode = canvas.node();
		width = svgNode.clientWidth;
		height = svgNode.clientHeight;


		dpr = window.devicePixelRatio || 1;

		var rect = canvasNode.getBoundingClientRect();

		canvasNode.width = width * dpr;
		canvasNode.height = height * dpr;


		hoverTextBox
			.attr("transform", `translate(${width-20},30)`);

		let xextent = d3.extent(nodes, d => d.x);
		let yextent = d3.extent(nodes, d => d.y);

		let xcenter = d3.mean(nodes, d => d.x);
		let ycenter = d3.mean(nodes, d => d.y);

		let dataWidth = 2 * d3.max([xcenter - xextent[0], xextent[1] - xcenter]);
		let dataHeight = 2 * d3.max([ycenter - yextent[0], yextent[1] - ycenter]);


		let panelAspectRatio = width / height;
		let dataAspectRatio = dataWidth / dataHeight;

		if (dataWidth > 0 && dataHeight > 0) {
			if (dataAspectRatio > panelAspectRatio) {
				targetScaleFactor = width / dataWidth;
			} else {
				targetScaleFactor = height / dataHeight;
			}
		}


		let gamma = 0.05
		if (scaleFactor > 0) {
			scaleFactor = scaleFactor * (1 - gamma) + targetScaleFactor * gamma;
		} else {
			scaleFactor = targetScaleFactor;
		}

		xscale
			.range([width / 2 - dataWidth / 2 * scaleFactor * zoomScale, width / 2 + dataWidth / 2 * scaleFactor * zoomScale])
			.domain([xcenter - dataWidth / 2, xcenter + dataWidth / 2]);

		yscale
			.range([height / 2 - dataHeight / 2 * scaleFactor * zoomScale, height / 2 + dataHeight / 2 * scaleFactor * zoomScale])
			.domain([ycenter - dataHeight / 2, ycenter + dataHeight / 2]);

		// xscale = xscale.domain());
		// yscale = yscale.domain(d3.extent(nodes,d=>d.y));
		nodesView
			.attr("cx", d => xscale(d.x))
			.attr("cy", d => yscale(d.y))


		if (renderLinksGL) {
			if (edgesIndices && colorArray && edgesIndices) {
				gl.viewport(0, 0, canvasNode.width, canvasNode.height);
				redrawEdgesGL();
			}
		}

		if (renderLinksCanvas) {
			let ctx = canvasNode.getContext('2d');
			ctx.clearRect(0, 0, canvasNode.width, canvasNode.height);
			ctx.scale(dpr, dpr);
			ctx.lineWidth = linesWidth * dpr;
			links.forEach(d => {
				let colorStart = d.source.color;
				let colorEnd = d.target.color;

				let x1 = xscale(d.source.x);
				let y1 = yscale(d.source.y);

				let x2 = xscale(d.target.x);
				let y2 = yscale(d.target.y);

				ctx.globalAlpha = 0.2;
				if (renderGradientLinks) {
					let grad = ctx.createLinearGradient(x1, y1, x2, y2);
					grad.addColorStop(0.0, colorStart);
					grad.addColorStop(1.0, colorEnd);
					ctx.strokeStyle = grad;
				} else {
					ctx.strokeStyle = colorStart;
				}
				ctx.beginPath();
				ctx.moveTo(x1, y1);
				ctx.lineTo(x2, y2);
				ctx.stroke();
			});
		}

		if (renderLinksSVG) {
			updateSVGLinks();
		}
	}


	//Loading NEtworks
	let networks = [];
	let timeIndices = [];
	// let topParties = [];
	// let partyDictionary = {
	// 	"pfl": "dem",
	// 	"ppr": "pp",
	// 	"ppb": "pp",
	// 	"pl": "pr",
	// 	"prona": "pr",
	// 	"pmdb": "mdb",
	// }

	// for (let year = 1995; year <= 2018; year++) {
	// 	for (let month = 1; month <= 12; month++) {
	// 		let network = null;
	// 		try {
	// 			let filename = `dep_${year}_${month}_0.8_leidenalg_dist`;
	// 			network = await readNetworkFile("networks/"+filename+".xnet");
	// 			network.name = filename;
	// 			// console.log((new Set(net.names)).size-net.names.length);
	// 			let partiesArray = network.verticesProperties["political_party"].map(party => {
	// 				if (partyDictionary.hasOwnProperty(party)) {
	// 					return partyDictionary[party];
	// 				} else {
	// 					return party;
	// 				}
	// 			});
	// 			network.verticesProperties["political_party"] = partiesArray;
	// 			topParties.push(...partiesArray);//sortByFrequency(partiesArray).slice(0,10));
	// 		} catch (error) {
	// 			console.log("ERROR");
	// 		}
	// 		networks.push(network);
	// 		timeIndices.push([month, year]);
	// 	}
	// }


	// for (let year = 1995; year <= 2019; year++) {
	// 	let network = null;
	// 	try {

	// 		let filename = `dep_${year}_obstr_0.8_leidenalg_dist`;
	// 		// network = await readNetworkFile("Data/" + filename + ".xnet");
	// 		network = xnet.load(JUPYTER_DATA[filename+".xnet"]);
	// 		network.name = filename;

	// 		// console.log((new Set(net.names)).size-net.names.length);
	// 		let partiesArray = network.verticesProperties["political_party"].map(party => {
	// 			if (partyDictionary.hasOwnProperty(party)) {
	// 				return partyDictionary[party];
	// 			} else {
	// 				return party;
	// 			}
	// 		});
	// 		network.verticesProperties["political_party"] = partiesArray;
	// 		topParties.push(...partiesArray);//sortByFrequency(partiesArray).slice(0,10));
	// 	} catch (error) {
	// 		console.log("ERROR");
	// 		console.log(error);
	// 	}
	// 	networks.push(network);
	// 	timeIndices.push([0, year]);
	// }

	// topTopParties = sortByFrequency(topParties).slice(0, 20);
	// console.log(topTopParties);
	// let partyColorFunction = d3.scaleOrdinal(d3.schemeCategory10);

	// for (const party in partiesNames) {
	// 	if (partiesNames.hasOwnProperty(party)) {
	// 		partiesToColors[party] = partyColorFunction(party);
	// 	}
	// }

	// topTopParties.forEach(party => {
	// 	partiesToColors[party] = partyColorFunction(party);
	// });
	
	startYear = JUPYTER_DATA["firstYear"];
	endYear = JUPYTER_DATA["lastYear"];
	displayProperty = JUPYTER_DATA["displayProperty"];
	IDProperty = JUPYTER_DATA["IDProperty"];
	colorProperty = JUPYTER_DATA["colorProperty"];

	console.log([startYear,endYear]);
	for (let year = startYear; year <= endYear; year++) {
		let network = null;
		try {
			network = xnet.load(JUPYTER_DATA["networks"][year]);
			network.name = JUPYTER_DATA["networkname"]+`y${year}`;
		} catch (error) {
			console.log(year);
			console.log(error);
		}
		networks.push(network);
		timeIndices.push([0, year]);
	}

	// topTopParties = sortByFrequency(topParties).slice(0, 20);
	// console.log(topTopParties);
	// let partyColorFunction = d3.scaleOrdinal(d3.schemeCategory10);

	// for (const party in partiesNames) {
	// 	if (partiesNames.hasOwnProperty(party)) {
	// 		partiesToColors[party] = partyColorFunction(party);
	// 	}
	// }

	
	setDrawNetwork(networks[startIndex]);
	window.setNetwork = (i) => {
		let network = networks[i];
		if (network) {
			setDrawNetwork(network);
			restart();
		}
	}


	d3.select("#timeSlider")
		.property("max", timeIndices.length - 1)
		.property("value", startIndex)
		.on("input", function input() {
			window.setNetwork(+this.value);
		});
	// oioi();

	restart();
	redraw();
	redrawRuler();
	window.addEventListener("resize", () => {
		myRequestAnimationFrame(() => {
			redrawRuler();
			redraw();
		});
	});

	function redrawRuler() {
		let timeRulerSVG = d3.select("#timeRule");
		let ruleWidth = timeRulerSVG.node().clientWidth;
		let ruleHeight = timeRulerSVG.node().clientHeight;
		let ruleScale = d3.scaleTime()
			.range([5, ruleWidth - 5])
			.domain([new Date(startYear, 0, 1), new Date(endYear, 0, 1)]);
		timeRulerSVG.selectAll("*").remove();
		timeRulerSVG.append("g")
			.attr("class", "axis")
			.attr("transform", "translate(0," + "20" + ")")
			.call(d3.axisTop(ruleScale)
				.ticks(d3.timeYear.every(1))
				.tickFormat(d3.timeFormat("")))

		timeRulerSVG.append("g")
			.attr("class", "axis")
			.attr("transform", "translate(0," + "20" + ")")
			.call(d3.axisTop(ruleScale)
				.ticks(d3.timeYear.every(2))
				.tickFormat(d3.timeFormat("%Y")))
		// .selectAll("text")	
		//   .style("text-anchor", "end")
		//   .attr("dx", "-.8em")
		//   .attr("dy", ".15em")
		//   .attr("transform", "rotate(-65)");

	}
	function zoomAnimation() {
		redraw();
		myRequestAnimationFrame(zoomAnimation);
	}


	myRequestAnimationFrame(zoomAnimation);
}

startVisualization();