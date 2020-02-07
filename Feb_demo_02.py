import pandas as pd
import matplotlib.pyplot as plt
import os
import sys


def create_plot(input_files, input_dir, output_dir):
    # write code
    j_of_inf = pd.read_csv(input_dir + '/' + input_files[0])
    order = [1,0] 
    inf_yd = j_of_inf[[j_of_inf.columns[i] for i in order]]

    inf = inf_yd.groupby(['year']).count()

    inf.reset_index(inplace=True)

    inf = inf.sort_values('year')

    inf = inf[1:-1]

    inf.columns=["Year","Total"]
    print("******")

    inf.plot(x='Year', y=['Total'], color=['blue'], kind='line')
    inf_plot = plt.legend(loc = 2)
    inf_plot = plt.ylabel(ylabel='No. of Publications')
    inf_plot = plt.title(label = 'Sum of Total Articles')
    
    plot_output_png = output_dir + '/' + 'articles_count.png'
    inf_plot.figure.savefig(plot_output_png)
    print('Plot generated at ' + plot_output_png )
    
    
if __name__ == "__main__":
    create_plot(sys.argv[1].split(','),sys.argv[2], sys.argv[3])    