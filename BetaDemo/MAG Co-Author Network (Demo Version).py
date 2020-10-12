# ---
# jupyter:
#   jupytext:
#     formats: ipynb,py:light
#     text_representation:
#       extension: .py
#       format_name: light
#       format_version: '1.5'
#       jupytext_version: 1.3.3
#   kernelspec:
#     display_name: Python 3
#     language: python
#     name: python3
# ---

# # Co-Author Network from Microsoft Academic Graph
#
# Requires an actual path to be included as `path_to_data` in the first cell below. This csv must contain columns named as referenced below.
#
# ### Extracting data from CSV
#
# This first cell will fill out several dictionaries with data from the csv file:
# * **data_by_id**: article information keyed to article id.
# * **data_by_author**: author data keyed to author id

# + jupyter={"outputs_hidden": false}
import os
import csv

data_by_id = {}
data_by_author = {}

path_to_data = "sourcedata/mag_sdg.csv"

# Read in source data and iterate row by row.
with open(path_to_data) as datafile:
    reader = csv.DictReader(datafile) 
    # Each row contains one article author; thus each article will have as many rows as authors.
    for row in reader:
        year = int(row["year"])
        # Compile data only if year is in range 1999 to 2018.
        if year < 1999 or year > 2018:
            continue

        id_ = row["paper_id"]
        author_id = row["author_id"]
        author_name = row["author_name"]

        # Store data about each author for lookup by name.
        if author_id not in data_by_author:
            data_by_author[author_id] = {
                "author_name": [row["author_name"]],
                "affiliation_id": [row["affiliation_id"]],
                "last_known_affiliation_id": [row["last_known_affiliation_id"]],
                "affiliation_name": [row["affiliation_name"]],
                "doi": [row["doi"]] if row["doi"] != "" else [],
                "paper_id": [row["paper_id"]]
            }
        
        # If author is already in the dict, append additional affiliation and article info.
        else:
            for key in ["author_name", "affiliation_id", "paper_id", 
                        "last_known_affiliation_id", "doi", "affiliation_name"]:
                if row[key] not in data_by_author[author_id][key]:
                    data_by_author[author_id][key].append(row[key])
        
        # Store data about each article for lookup by article ID.
        if id_ not in data_by_id:
            data_by_id[id_] = {
                "doi": row["doi"],
                "doc_type": row["doc_type"],
                "title": row["original_title"],
                "year": row["year"],
                "authors": [
                    {
                        "author_id": row["author_id"],
                        "name": row["author_name"],
                        "last_known_affiliation_id": [row["last_known_affiliation_id"]],
                        "affiliation_id": [row["affiliation_id"]],
                        "affiliation_name": [row["affiliation_name"]],
                    }
                ],
                "all_author_ids": [row["author_id"]]
            }
        # If article id already in dict, append additional author/affiliation data.
        else:
            if author_id in data_by_id[id_]["all_author_ids"]:
                for a in data_by_id[id_]["authors"]:
                    if a["author_id"] == author_id:
                        affiliation_id = row["affiliation_id"]
                        last_known = row["last_known_affiliation_id"]
                        normalized = row["affiliation_name"]
                        if affiliation_id not in a["affiliation_id"]:
                            a["affiliation_id"].append(affiliation_id)
                            a["affiliation_name"].append(normalized)
                            
                        if last_known not in a["last_known_affiliation_id"]:
                            a["last_known_affiliation_id"].append(last_known)
                            
            else:
                new_author = {
                    "author_id": row["author_id"],
                    "name": row["author_name"],
                    "last_known_affiliation_id": [row["last_known_affiliation_id"]],
                    "affiliation_id": [row["affiliation_id"]],
                    "affiliation_name": [row["affiliation_name"]],
                    }
                data_by_id[id_]["authors"].append(new_author)
                data_by_id[id_]["all_author_ids"].append(author_id)           
# -

# #### Check values for accuracy / highlight obvious issues

# + jupyter={"outputs_hidden": false}
len(data_by_author)

# + jupyter={"outputs_hidden": false}
list(data_by_author.keys())[0]

# + jupyter={"outputs_hidden": false}
data_by_author['2020620411']
# -

# Many authors have multiple institutional affiliations:

# + jupyter={"outputs_hidden": false}
count = 0
for author, data in data_by_author.items():
    if len(data["affiliation_name"]) > 1:
        count += 1
        # print(author, data)
print(count, "authors with multiple affiliations")
# -

# Compare total number of rows to number of unique rows to roughly estimate authors per paper.

# + jupyter={"outputs_hidden": false}
ids = []

with open(path_to_data) as datafile:
    
    reader = csv.DictReader(datafile) 
    for row in reader:
        id_ = row["paper_id"]
        ids.append(id_)
print(len(set(ids)), "total papers,", len(ids), "total authors")
# -

# ### Building graph from author and article data

# First, create the complete graph of all co-authorship.

# + jupyter={"outputs_hidden": false}
from itertools import combinations
import networkx as nx

G = nx.Graph()

for id_, data in data_by_id.items():
    
    authors = data["all_author_ids"]
    """
    Iterate over all combinations of authors per paper.
    For example if authors are 456, 789, and 123, iterate over 3 co-authorship combinations:
        456 789
        456 123
        789 123
    Add nodes and edges as needed for each combo.  
    """
    for i, j in combinations(authors, 2):
        year = data["year"]
        if G.has_edge(i, j):
            G[i][j]["weight"] += 1
            if id_ not in G[i][j]["articles"]:
                G[i][j]["articles"].append(id_)
            
            if year not in G[i][j]["years"]:
                G[i][j]["years"].append(year)
        else:
            G.add_edge(i, j, weight=1, articles=[id_], years=[data["year"]])

# Go back and iterate over all nodes created, adding affiliation/count/author data.
for author, data in G.nodes(data=True):
    data["affiliation"] = data_by_author[author]["affiliation_name"][0]
    data["papers"] = "<br>\n".join(data_by_author[author]["doi"])
    data["name"] = ", ".join(data_by_author[author]["author_name"])    
    data["count"] = len(data_by_author[author]["paper_id"])

# + jupyter={"outputs_hidden": false}
len(G.edges)

# + jupyter={"outputs_hidden": false}
len(G.nodes)


# -

# Create subgraph containing only those edges with a `weight` greater than 1, that is, co-author pairs who published more than 1 paper in the dataset.

# + jupyter={"outputs_hidden": false}
def filter_edge(n1, n2):
    """Check if weight is larger than 1."""
    return G[n1][n2]["weight"] > 1

def filter_node(n):
    """Filter out unconnected nodes."""
    return not nx.is_isolate(view, n)

view = nx.subgraph_view(G, filter_edge=filter_edge)
subview = nx.subgraph_view(view, filter_node=filter_node)

# + jupyter={"outputs_hidden": false}
len(subview.edges()), len(subview.nodes())
# -

# Centrality Measures

# ### Output graph data as separate files containing `nodes` and `edges` for display in `flourish.studio`.
#
# Our platform for visualizing the graph, `flourish.studio` requires edge and node lists as comma-separated rows

# + jupyter={"outputs_hidden": false}
import csv

nx.write_edgelist(subview, "mag_output_authors/mag_edges.tsv", delimiter="\t", data=["weight"])
with open("mag_output_authors/mag_nodes.csv", "w") as f:
    fieldnames = ["id", "affiliation", "papers", "name", "count"]
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    for n, data in list(subview.nodes(data=True)):
        row = data
        row["id"] = n
        writer.writerow(row)

# + jupyter={"outputs_hidden": false}
max([subview[e][v]["weight"] for e, v in subview.edges])
