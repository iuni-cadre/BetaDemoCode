import igraph as ig
import numpy as np
import matplotlib.pyplot as plt
from matplotlib import collections  as mc
import math

_styleColors = [
	"#1f77b4",
	"#ff7f0e",
	"#2ca02c",
	"#d62728",
	"#9467bd",
	"#8c564b",
	"#e377c2",
	"#7f7f7f",
	"#bcbd22",
	"#17becf",
	"#aec7e8",
	"#ffbb78",
	"#98df8a",
	"#ff9896",
	"#c5b0d5",
	"#c49c94",
	"#f7b6d2",
	"#c7c7c7",
	"#dbdb8d",
	"#9edae5",
];


def sortByFrequency(arr):
	s = set(arr)
	keys = {n: (-arr.count(n), arr.index(n)) for n in s}
	return sorted(list(s), key=lambda n: keys[n])

def convertColorToRGBAString(r,g,b,a):
	return "rgba(%d,%d,%d,%f)"%(round(r*255),round(g*255),round(b*255),a)

def drawGraph(graph,ax):
	indegree = graph.indegree()
	maxIndegree = max(indegree);
	graph.vs["vertex_size"] = [x/maxIndegree*10+4 for x in indegree]
	
	colormap = plt.get_cmap("plasma");

	if("Community" not in graph.vertex_attributes()):
		graph.vs["color"] = [convertColorToRGBAString(*colormap(math.log(value+1))) for value in indegree]
	else:
		communities = graph.vs["Community"];
		sortedCommunities = sortByFrequency(communities);
		communityToColor = {community:(_styleColors[index] if index<len(_styleColors) else "#aaaaaa") for index,community in enumerate(sortedCommunities)};
		graph.vs["color"] = [communityToColor[community] for community in communities];
	
	for edgeIndex in range(graph.ecount()):
		sourceIndex = graph.es[edgeIndex].source;
		graph.es[edgeIndex]['color'] = graph.vs["color"][sourceIndex]+"20"

	#positions = np.array(graph.layout_drl());
	positions = np.array(graph.layout_lgl(maxiter=400,coolexp = 2.0));
	linesX = []
	linesY = []
	segments = []
	positionsX = positions[:,0]
	positionsY = positions[:,1]
	for edge in graph.es:
		source = edge.source
		target = edge.target
		fx = positionsX[source]
		fy = positionsY[source]
		tx = positionsX[target]
		ty = positionsY[target]
		linesX.append(fx)
		linesX.append(tx)
		linesX.append(None)
		linesY.append(fy)
		linesY.append(ty)
		linesY.append(None)
		segments.append([(fx, fy), (tx, ty)])
	# plt.plot(linesX,linesY,alpha=0.1);
	lc = mc.LineCollection(segments, colors=graph.es["color"], linewidths=1.5)
	ax.add_collection(lc)
	ax.scatter(positionsX,positionsY,marker="o",c=graph.vs["color"],s=graph.vs["vertex_size"],zorder=10);
	ax.autoscale()
	ax.margins(0.01)
	