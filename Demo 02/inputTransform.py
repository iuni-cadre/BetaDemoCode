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

# + jupyter={"outputs_hidden": true}
import os
import pandas as pd
import numpy as np
import sys

def create_coauthor_network(input_filenames, input_dir, output_dir):
    path_to_data = input_dir + '/' + input_filenames[0]
    converterS = {col: lambda x: "" if x=="[]" else x.strip("[]").split(", ") for col in ['Author_authorId','Author_displayName','Author_lastKnownAffiliationId']}
    queryResults = pd.read_csv(path_to_data,converters=converterS)

    # + jupyter={"outputs_hidden": true}
    #queryResults[queryResults['Author_lastKnownAffiliationId']]
    queryResults["LastAffiliateCount"] = queryResults['Author_lastKnownAffiliationId'].apply(len)
    queryResults["AuthorCount"] = queryResults['Author_authorId'].apply(len)
    queryResults[queryResults['LastAffiliateCount']==0]

    # + jupyter={"outputs_hidden": true}
    queryResults2 = queryResults.loc[queryResults["LastAffiliateCount"]==queryResults["AuthorCount"],:].copy()

    # + jupyter={"outputs_hidden": true}
    Author_lastKnownAffiliationId = queryResults2.explode('Author_lastKnownAffiliationId')[['Author_lastKnownAffiliationId']]
    Author_displayName = queryResults2.explode('Author_displayName')[['Author_displayName']]
    PApairs = queryResults2.drop(['Author_lastKnownAffiliationId','Author_displayName'], axis = 1).explode('Author_authorId')
    PApairs2 = pd.concat([Author_displayName,Author_lastKnownAffiliationId,PApairs], axis=1)
    # -
    PApairs3 = PApairs2[["Author_displayName","Author_lastKnownAffiliationId","Author_authorId","Paper_doi","Paper_originalTitle","Paper_paperId","Paper_year"]]
    PApairs3.columns = ['author_name','last_known_affiliation_id','author_id','doi','original_title','paper_id','year']
    
    output_file = output_dir + '/' + 'testInputTransformed.csv'
    PApairs3.to_csv(output_file)

if __name__ == "__main__":
    """
    How to run script:
        copy example files to input directory
        run with python line_count.py example1.csv,example2.csv /efs/input /efs/output
    What it does:
        gets the list of filenames from the commandline
        counts the lines from each file in /efs/input (which will be available within docker)
    """

    # Required cadre boilerplate to get commandline arguments:
    try:
        _input_filenames = sys.argv[1].split(',')
        _input_dir = sys.argv[2]
        _output_dir = sys.argv[3]
    except IndexError:
        print("Missing Parameter")
        sys.exit(1)
    except:
        print("Unknown Error")
        sys.exit(1)

    #  calling create_plot function
    create_coauthor_network(_input_filenames, _input_dir, _output_dir)
                
