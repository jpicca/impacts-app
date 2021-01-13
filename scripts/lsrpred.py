from pygridder import pygridder as pgrid

import datetime as dt
import numpy as np
import pandas as pd
import argparse
import glob
import pathlib

from outlookOrg import mlFeatures
from outlookOrg.reader import *

### CLI Parser ###
file_help = "The basename of the tornado file associated with these outlooks."
dir_help = "The directory where the outlook grib files can be found."
impacts_help = "The path to the impacts npz files."

# Parse arguments
parser = argparse.ArgumentParser()
parser.add_argument("-f", "--tor_file", required=True, help=file_help)
parser.add_argument("-p", "--path", required=True, help=dir_help)
parser.add_argument("-i", "--impacts", required=True, help=impacts_help)

args = parser.parse_args()

# Primary variables
tor_name_f = args.tor_file
outlook_dir = pathlib.Path(args.path)
impact_grids = pathlib.Path(args.impacts)


# Global variables
hazards = ['hail','sighail','wind','sigwind','torn','sigtorn']
cwas = ['FWD','OUN','SJT','EWX','HGX','SHV','TSA']

# Instantiate unprocessed features object
uf = mlFeatures()

# Gather meta info
file_details = tor_name_f.split('_')
haz_type =  file_details[0]
otlk_day = file_details[1].strip('day')
otlk_time = file_details[3]
timestamp = file_details[4]

# File names for all hazards
sigtorn_f = tor_name_f.replace(haz_type, 'sigtorn')
sigwind_f = tor_name_f.replace(haz_type, 'sigwind')
sighail_f = tor_name_f.replace(haz_type, 'sighail')
torn_f = tor_name_f.replace(haz_type, 'torn')
wind_f = tor_name_f.replace(haz_type, 'wind')
hail_f = tor_name_f.replace(haz_type, 'hail')

for idx,name in enumerate([sigtorn_f,sigwind_f,sighail_f,torn_f,wind_f,hail_f]):
    if name[0:3] == 'sig':
        sig = True
        haz_type = name[3:7]
    else:
        sig = False
        haz_type = name[0:4]

    # Open grib file
    print(f'Reading: {name}')
    probs = readOutlook(str(pathlib.Path(outlook_dir,name)))

    grids = getGrids(impact_grids)

    for i,cwa in enumerate(cwas):

        gridCount, popCount = extractFeatures(haz_type,sig,cwa,probs,grids)
        
        if idx == 0:
            uf.cwa.append(cwa)

            # change 0 array to 1 where necessary
            getattr(uf,cwa)[i] = 1
            getattr(uf,f'otlkday_{otlk_day}')[i] = 1
            getattr(uf,f'otlktime_{otlk_time}')[i] = 1


            uf.otlk_day.append(otlk_day)
            uf.otlk_time.append(otlk_time)
            uf.valid_date.append(timestamp)

        if sig:
            getattr(uf,f'gridCount_sig{haz_type}').append(gridCount)
            getattr(uf,f'popCount_sig{haz_type}').append(popCount)
        else:
            if haz_type == 'torn':
                getattr(uf,f'gridCount_torn2').append(gridCount[0])
                getattr(uf,f'gridCount_torn5').append(gridCount[1])
                getattr(uf,f'gridCount_torn10').append(gridCount[2])
                getattr(uf,f'gridCount_torn15').append(gridCount[3])
                getattr(uf,f'gridCount_torn30').append(gridCount[4])
                getattr(uf,f'gridCount_torn45').append(gridCount[5])
                getattr(uf,f'gridCount_torn60').append(gridCount[6])
                getattr(uf,f'popCount_torn2').append(popCount[0])
                getattr(uf,f'popCount_torn5').append(popCount[1])
                getattr(uf,f'popCount_torn10').append(popCount[2])
                getattr(uf,f'popCount_torn15').append(popCount[3])
                getattr(uf,f'popCount_torn30').append(popCount[4])
                getattr(uf,f'popCount_torn45').append(popCount[5])
                getattr(uf,f'popCount_torn60').append(popCount[6])
                
            else:
                getattr(uf,f'gridCount_{haz_type}5').append(gridCount[0])
                getattr(uf,f'gridCount_{haz_type}15').append(gridCount[1])
                getattr(uf,f'gridCount_{haz_type}30').append(gridCount[2])
                getattr(uf,f'gridCount_{haz_type}45').append(gridCount[3])
                getattr(uf,f'gridCount_{haz_type}60').append(gridCount[4])
                getattr(uf,f'popCount_{haz_type}5').append(popCount[0])
                getattr(uf,f'popCount_{haz_type}15').append(popCount[1])
                getattr(uf,f'popCount_{haz_type}30').append(popCount[2])
                getattr(uf,f'popCount_{haz_type}45').append(popCount[3])
                getattr(uf,f'popCount_{haz_type}60').append(popCount[4])

# Convert unprocessed attributes to a dataframe for processing
uf_df = pd.DataFrame.from_dict(uf.__dict__)

proc_feats = processFeatures(uf_df)

print(proc_feats.info())
print(proc_feats.shape)


