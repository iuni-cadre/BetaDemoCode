# ISSI 2019 CADRE Tutorial 
This is a repository for code and demo of ISSI 2019 CADRE Tutorial. Event website:
https://cadre.iu.edu/news-and-events/events/rome

The tutorial is consists of 5 demos:

### Demo 1: Query on the GUI-query builder (step by step using drop-down menus) with simple plotting in notebook.

### Demo 2: Visualizations and word clouds. Illustrate how we can reproduce with packages and interact with the code in a notebook environment.

### Demo 3: Advanced interactive visualizations.

### Demo 4: Scalable query and bring additional computational resources to CADRE notebook (databricks backend).

***
```
Non-interactive/2nd-degree-analysis.ipynb
```
In the notebook environment (databricks backend).

* Input files: "/packages/issi_data_package/output_files/data/774e7eb6-6ac7-4dd5-9339-531b746cb8ec.csv"
"/packages/issi_data_package/output_files/data/2ndOrderEdges.csv"

* Output files: To get the input files in the right path, run the "ISSI Data Package" from the CADRE Marketplace.

This notebook illustrates how to bring scalable computing resources to the CADRE notebook environment. The notebook requres external credentals and will not be runnable for the audence. 

We will illustrate how to generate edge lists from large citation data set using distributed cluster and the result is delivered through the "ISSI Data Package".

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
