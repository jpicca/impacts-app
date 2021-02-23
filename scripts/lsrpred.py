from pygridder import pygridder as pgrid

import datetime as dt
import numpy as np
import pandas as pd
import argparse
import glob
import pathlib
from joblib import load
import json

from outlookOrg import mlFeatures
from outlookOrg.reader import *

### CLI Parser ###
root_help = "The path to the root of the impacts app"
file_help = "The basename of the tornado file associated with these outlooks."
impacts_help = "The path to the impacts npz files."
day_c_help = "The custom date of the outlook"

# Parse arguments
parser = argparse.ArgumentParser()
parser.add_argument("-r", "--app_root", required=True, help=root_help)
parser.add_argument("-f", "--tor_file", required=True, help=file_help)
parser.add_argument("-i", "--impacts", required=True, help=impacts_help)
parser.add_argument("-d", "--day", type=int, required=True, help=day_c_help)

args = parser.parse_args()

# Primary variables
app_root = pathlib.Path(args.app_root)
tor_name_f = args.tor_file
impact_grids = pathlib.Path(args.impacts)
otlk_day = args.day

hazards = ['hail','sighail','wind','sigwind','torn','sigtorn']
cwas = ['FWD','OUN','SJT','EWX','HGX','SHV','TSA']

final_dict = {}

# Instantiate unprocessed features object
uf = mlFeatures()

# Get cwa and pop grids
grids = getGrids(impact_grids)

#### Section to process npz files instead of grib files ####
if tor_name_f[-4:] == '.npz':

    # Gather meta info
    _npz_deets = tor_name_f.split('_')
    otlk_time = _npz_deets[1]
    timestamp = _npz_deets[2]

    print('Using npz!')
    all_probs = np.load(pathlib.Path(app_root,'data','outlooks-npz',tor_name_f))

    for idx, haz in enumerate(hazards):

        sig = False
        print(f'Reading: *npz* {haz}')

        if haz[:3] == 'sig':
            sig = True

        # Get 2d array for the hazard
        probs = all_probs[haz]

        for i,cwa in enumerate(cwas):

            gridCount, popCount = extractFeatures(haz,sig,cwa,probs,grids)

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
                getattr(uf,f'gridCount_{haz}').append(gridCount)
                getattr(uf,f'popCount_{haz}').append(popCount)
            else:
                if haz == 'torn':
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
                    getattr(uf,f'gridCount_{haz}5').append(gridCount[0])
                    getattr(uf,f'gridCount_{haz}15').append(gridCount[1])
                    getattr(uf,f'gridCount_{haz}30').append(gridCount[2])
                    getattr(uf,f'gridCount_{haz}45').append(gridCount[3])
                    getattr(uf,f'gridCount_{haz}60').append(gridCount[4])
                    getattr(uf,f'popCount_{haz}5').append(popCount[0])
                    getattr(uf,f'popCount_{haz}15').append(popCount[1])
                    getattr(uf,f'popCount_{haz}30').append(popCount[2])
                    getattr(uf,f'popCount_{haz}45').append(popCount[3])
                    getattr(uf,f'popCount_{haz}60').append(popCount[4])
            

else:

    # Gather meta info
    _file_details = tor_name_f.split('_')
    haz_type =  _file_details[0]
    #otlk_day = _file_details[1].strip('day')
    otlk_time = _file_details[3]
    timestamp = _file_details[4]

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
        probs = readOutlook(str(pathlib.Path(app_root,'data','outlooks','impacts.pmarshwx.com','test-grib',name)))

        #grids = getGrids(impact_grids)

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



#############################################################
### Convert processed features to df and make predictions ###
#############################################################

# Convert unprocessed attributes to a dataframe for processing
uf_df = pd.DataFrame.from_dict(uf.__dict__)

proc_feats = processFeatures(uf_df)

# Load models and make predictions for CWAs
hail_model = load(pathlib.Path(app_root,'scripts','models','FWD_CWA_hailLSR_gbr.joblib'))
wind_model = load(pathlib.Path(app_root,'scripts','models','FWD_CWA_windLSR_gbr.joblib'))

# Get initial predictions
lsr_preds = zip(cwas,makePredictions(proc_feats,hail_model),makePredictions(proc_feats,wind_model))

#-----* Read in climo LSR data *-----#

# Get the date index
# Helper array for day indexing
aggregateMonths = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335]

def getDayIdx(ts):
    dayStr = ts[4:8]
    
    month = int(dayStr[:2])
    day = int(dayStr[2:])

    if otlk_day == '1':
        return aggregateMonths[month-1]+day-1
    else:
        # Logic for when the D2 outlook is valid for Jan 1
        day2idx = aggregateMonths[month-1]+day
        if day2idx < 366:
            return day2idx
        else:
            return 0

dayIdx = getDayIdx(timestamp)

# Load saved climo data
lsr_path = pathlib.Path(app_root,'data','climo','lsr_climo_smAvg.json')

with open(lsr_path) as c:
    lsr_data = json.load(c)

for cwa, hail_pred, wind_pred in lsr_preds:   
    hail_climo = lsr_data[cwa]['movAvg_hail'][dayIdx]
    wind_climo = lsr_data[cwa]['movAvg_wind'][dayIdx]

    final_dict[cwa] = {
        'hail': {
            'forecast': hail_pred,
            'climo': hail_climo
        },
        'wind': {
            'forecast': wind_pred,
            'climo': wind_climo
        }
    }

# Path to save LSR preds/climo
write_path = pathlib.Path(app_root,'web',f'd{otlk_day}','includes','data','init','ml-lsr.json')

# Write out LSR preds/climo
with open(write_path, 'w') as fp:
    json.dump(final_dict, fp)

