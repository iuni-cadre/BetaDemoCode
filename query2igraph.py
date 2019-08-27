import sys
import os

import igraph as ig
import pandas as pd
import numpy as np

import xnet as xn

MAGColumnTypes = {
	"journal_id": object,
	"issue": object,
	"first_name":object,
	"last_name":object,
	"volume":object,
	"conference_instance_id":object,
	"conference_series_id":object,
	"doc_type":object,
	"doi":object,
	"original_venue":object,
	"publisher":object,
	"authors_last_known_affiliation_id":object,
	"field_of_study_id":object,
	"paper_publisher":object,
	"journal_display_name":object,
	"journal_issn":object,
	"paper_first_page":object,
	"paper_reference_id":object,
	"paper_abstract":object,
	"book_title":object,
	"conference_display_name":object,
	"journal_publisher":object,
	"paper_last_page":object,
}

def query2igraph(queryID, path = "../query-results"):
    
	File = "%s/%s.csv"%(path,queryID)
	edgesFile = "%s/%s_edges.csv"%(path,queryID)
        
	edgesData = pd.read_csv(edgesFile)
	nodesData = pd.read_csv(nodesFile, dtype=MAGColumnTypes)

	# Replacing NaN for empty string
	for key in MAGColumnTypes:
		if(key in nodesData):
			nodesData[key].fillna("",inplace=True)

	# Generating continous indices for papers
	index2ID  = nodesData["paper_id"].tolist()
	ID2Index = {id:index for index, id in enumerate(index2ID)}

	# Hack to account for 2 degree capitalized "FROM"
	fromKey = "From"
	if(fromKey not in edgesData):
		fromKey = "FROM"

	# Converting edges from IDs to new indices
	# Invert edges so it means a citation between from to to
	edgesZip = zip(edgesData[fromKey].tolist(),edgesData["To"].tolist())
	edgesList = [(ID2Index[toID],ID2Index[fromID]) for fromID,toID in edgesZip if fromID in ID2Index and toID in ID2Index]

	vertexAttributes = {key:nodesData[key].tolist() for key in nodesData}

	for key in nodesData:
		nodesData[key].tolist()

	graph = ig.Graph(
		n=len(index2ID),
		edges=edgesList,
		directed=True,
		vertex_attrs=vertexAttributes
	)

	return graph;

if __name__ == "__main__":
    pass
