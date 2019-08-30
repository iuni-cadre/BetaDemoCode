# ISSI 2019 CADRE Tutorial 
This is a repository for code and demo of ISSI 2019 CADRE Tutorial. Event website:
https://cadre.iu.edu/news-and-events/events/rome

The tutorial is consists of 5 demos:

## Demo 1: Query on the GUI-query builder (step by step using drop-down menus) with simple plotting in notebook.

## Demo 2: Visualizations and word clouds. Illustrate how we can reproduce with packages and interact with the code in a notebook environment.

## Demo 3: Advanced interactive visualizations.

## Demo 4: Bring scalable computing resources to CADRE. In the notebook environment (databricks backend).

Notebook: demo04.ipynb Non-interactive/2nd-degree-analysis.ipynb

* Input files: "/packages/issi_data_package/output_files/data/774e7eb6-6ac7-4dd5-9339-531b746cb8ec.csv", "/packages/issi_data_package/output_files/data/2ndOrderEdges.csv"
* Output files: N/A

***

The first 3 cells of the notebook read papers from "newdataCombined.csv" within the 2010-2017 range. Then we we use "Year2" for birth year estimate, i.e. assuming authors are in the age range [35-55] when they publish. 

Next 2 cells break the author list into names and further into name parts for gender detection. We use the [gender package]( https://github.com/ropensci/gender) in R (Lincoln Mullen (2015)) to predict the probability of each name part (in reversed order, i.e. last name first) being female. We exclude parts representing initials. Authors with probability over 0.5 are labeled “female” and those with probability below 0.5 are labeled “male”.  Authors with no usable name parts are labeled “unknown”.  

The gender labeled data is then aggregated back to paper level according to author orders and reorganized as "OpenSci3.csv" for further statistical analysis. We also group the paper level data into categories in preparation for plotting. The last 4 cells reorganize the data and uses [ggplot2](https://ggplot2.tidyverse.org/) to generate pie charts in Figure 2 of the paper.
![](https://github.com/iuni-cadre/ReproducibilityDemo/blob/master/code-data/MultiPie.png)


## Demo 5: Full reproducible pipeline in the notebook environment (hosted by BinderHub): 
https://github.com/iuni-cadre/ReproducibilityDemo/wiki/A-demo-of-reproducibility

https://github.com/jupyterhub/binderhub
