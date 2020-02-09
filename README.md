# CADRE Alpha Release Demo
This is the code repository for the Version 0.1.0-alpha release. Event website:
https://iuni-cadre.github.io/AlphaDemo/

The repo is consists of 2 demos:

### Demo01: Data access and reproducible packages (Hutchinson). How can you access the data and analyze them? How can you make our analysis reproducible?
### Demo02: Networks and visualizations (Silva). How can you build networks from query results and visualize them 
```
Notebook: Non-interactive/2nd-degree-analysis.ipynb
```

* Input files: "/packages/issi_data_package/output_files/data/774e7eb6-6ac7-4dd5-9339-531b746cb8ec.csv"

* Output files: "/packages/issi_data_package/output_files/data/2ndOrderEdges.csv" 
```
To get the outputfiles, run the "ISSI Data Package" from the CADRE Marketplace.
```
We will illustrate how to generate edge lists from large citation data set using distributed cluster and the result is delivered through the "ISSI Data Package".

***
The second notebook will read from the output of the first, and conduct 2nd-order citation analysis.
```
Notebook: demo04.ipynb 
```
* Input files: "/packages/issi_data_package/output_files/data/774e7eb6-6ac7-4dd5-9339-531b746cb8ec.csv"
"/packages/issi_data_package/output_files/data/2ndOrderEdges.csv"
```
To get the input files in the right path, run the "ISSI Data Package" from the CADRE Marketplace.
```
* Output files: N/A

The first 2 cells of the notebook read papers and 2nd degree edge list (2nd-degree queires is disabled at the GUI query-builde) from the input files.

Next 4 cells build paper citation lists from the 2nd degree edge list and generates PDF and CCDF plots.

Cell 7 replicates the original code for indirect citations from Yi Bu's slides "Difficulty 1: How to extract DCCPs?". It illustrates how simple python code can now handle the smaller data set filtered by our powerful query interface. Next 4 cells again generates PDF and CCDF plots for indirect citations.

The last cell produce a simple network visualization around the focal paper ""


### Demo 5: Full reproducible pipeline in the notebook environment (hosted by BinderHub): 
https://github.com/iuni-cadre/ReproducibilityDemo/wiki/A-demo-of-reproducibility

https://github.com/jupyterhub/binderhub
