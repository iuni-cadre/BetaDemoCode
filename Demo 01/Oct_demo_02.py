import pandas as pd
import matplotlib.pyplot as plt
import sys


def create_plot(input_files, input_dir, output_dir):
    # read csv file
    j_of_inf = pd.read_csv(input_dir + '/' + input_files[0])
    j_of_inf.columns = j_of_inf.columns.str.strip()
    inf = j_of_inf.groupby(['Paper_year']).count() 
    inf2 = inf['Paper_paperTitle']
    inf2 = inf2[1:-1]
    inf2.columns=["Year","Total"]    
    inf2.plot(x='Year', y=['Total'], color=['blue'], kind='line')
    inf_plot = plt.legend(loc=2)
    inf_plot = plt.ylabel(ylabel='No. of Publications')
    inf_plot = plt.title(label='Sum of Total Articles')
    
    plot_output_png = output_dir + '/' + 'articles_count.png'
    inf_plot.figure.savefig(plot_output_png)
    print('Plot generated at ' + plot_output_png)


# Python entrypoint
if __name__ == "__main__":
    """
        How to run script:
            copy example files to input directory
            run with python Feb_demo_02.py example1.csv /file_path/input /file_path/output
        What it does:
            Get the input file from command line and aggregate publications per year and plot it
        system arguments:
            [1] : comma separated input file names (eg: 'file1.csv, file2.csv')
            [2] : input dir
            [3] : output dir   
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
    create_plot(_input_filenames, _input_dir, _output_dir)
