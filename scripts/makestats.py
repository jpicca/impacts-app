import pathlib
import glob
import os

import argparse
import geojson
import pandas as pd
import json

### CLI Parser ###
file_help = "The sim file to be used to create stats output."
nsim_help = "The number of simulations to run. Default is 10,000."
climo_help = "The location where the climo files are stored."
d_help = "Which day (D1 or D2) is being processed."
out_help = "The location where state/cwa files are written."

# Parse arguments
parser = argparse.ArgumentParser()
parser.add_argument("-f", "--file", required=True, help=file_help)
parser.add_argument("-o", "--outdir", required=False, default="../web", type=str, help=out_help)
parser.add_argument("-n", "--nsims", required=False, default=10000, type=int, help=nsim_help)
parser.add_argument("-c", "--climopath", required=False, default="../data/climo", type=str, help=climo_help)
parser.add_argument("-d", "--day", required=False, default=1, type=int, help=d_help)

args = parser.parse_args()

# Primary variables
f = pathlib.Path(args.file)
nsims = args.nsims
climo = pathlib.Path(args.climopath)
outdir = pathlib.Path(args.outdir)
otlk_day = args.day

# Helper array for day indexing
aggregateMonths = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];

# Remove old state and CWA files
oldfiles = glob.glob(f'{outdir}/d{otlk_day}/includes/data/followup/*')
for file in oldfiles:
    os.remove(file)

# Load saved climo data
with open(f'{climo}/pop_climo_torSmAvg.json') as file:
        pop_data = json.load(file)
        
with open(f'{climo}/hosp_climo_torSmAvg.json') as file:
    hosp_data = json.load(file)
    
with open(f'{climo}/mob_climo_torSmAvg.json') as file:
    mob_data = json.load(file)
    
with open(f'{climo}/pow_climo_torSmAvg.json') as file:
    pow_data = json.load(file)

def getDayIdx(file):
    dayStr = str(file).split('/')[-1].split('.')[0][4:8]
    
    month = int(dayStr[:2])
    day = int(dayStr[2:])

    if otlk_day == 1:
        return aggregateMonths[month-1]+day-1
    else:
        return aggregateMonths[month-1]+day

# Function to count tornadoes in each simulation
def torCounter(df,filled_df):
    # Use arbitrary column to get count of entries for each sim (i.e., count of tornadoes)
    torsBySim = df.groupby("sim").count().loc[:,'wfos']
    
    # Merge this count with the original 
    merged = filled_df.merge(torsBySim,how='left',on='sim')
    merged.fillna(value=0,inplace=True)
    merged.rename(columns={'wfos':'tors'},inplace=True)
    return merged

# Get index of the valid day from the file
dayIdx = getDayIdx(f)

# Define climo function
def getClimo():

    # Prep the dictionary file to receive climo data
    masterDict['natClimo'] = {'pop': {},
                            'pow': {},
                            'mob': {},
                            'hosp': {}}

    # Load nat climo data into dictionary using the proper day
    for key in pop_data['nat'].keys():
        
        masterDict['natClimo']['pop'][key] = pop_data['nat'][key][dayIdx]
        masterDict['natClimo']['hosp'][key] = hosp_data['nat'][key][dayIdx]
        masterDict['natClimo']['mob'][key] = mob_data['nat'][key][dayIdx]
        masterDict['natClimo']['pow'][key] = pow_data['nat'][key][dayIdx]

masterDict = {}
ind_torDict = {}

# Read data into dataframe
try:
    df = pd.read_csv(f, sep="|")
except EmptyDataError:
    import sys
    print("The sims file is empty (presumably due to there being no simulated tornadoes).")

    # Code to write out an empty csv
    masterDict['sims'] = []
    masterDict['states'] = []
    masterDict['cwas'] = []
    getClimo()

    # Write master json data
    with open(f'{outdir}/d{otlk_day}/includes/data/init/data_test.json', 'w') as fp:
        json.dump(masterDict, fp)

    sys.exit(0)


sims = df.groupby("sim")
fields = sims.sum().loc[:,('population','hospitals','mobilehomes','psubstations')]

# Fill missing sims with 0s (artifact of how pas writes out files)
fill_fields = fields.reindex(list(range(1,nsims+1)),fill_value=0)

## ** Grabbing tornado tracks **
quants = fill_fields.quantile(q=[0,0.1,0.5,0.9,1],interpolation='nearest')
for impact in ['population','hospitals','mobilehomes','psubstations']:
    tmin = fill_fields[fill_fields[impact] == quants.loc[0,impact]].index[0]
    tten = fill_fields[fill_fields[impact] == quants.loc[0.1,impact]].index[0]
    tmed = fill_fields[fill_fields[impact] == quants.loc[0.5,impact]].index[0]
    tnine = fill_fields[fill_fields[impact] == quants.loc[0.9,impact]].index[0]
    tmax = fill_fields[fill_fields[impact] == quants.loc[1,impact]].index[0]

    ind_torDict[impact] = {}

    ind_torDict[impact]['min'] = df[df['sim'] == tmin].loc[:,['slon','slat','elon','elat',impact]].values.tolist()
    ind_torDict[impact]['ten'] = df[df['sim'] == tten].loc[:,['slon','slat','elon','elat',impact]].values.tolist()
    ind_torDict[impact]['med'] = df[df['sim'] == tmed].loc[:,['slon','slat','elon','elat',impact]].values.tolist()
    ind_torDict[impact]['ninety'] = df[df['sim'] == tnine].loc[:,['slon','slat','elon','elat',impact]].values.tolist()
    ind_torDict[impact]['max'] = df[df['sim'] == tmax].loc[:,['slon','slat','elon','elat',impact]].values.tolist()

# Get tornado counts
merged = torCounter(df,fill_fields)

# Place sims into dict
masterDict['sims'] = merged.values.tolist()

# Get Climo data
getClimo()

################
#### States ####
################
stBrokenOut = df.assign(category=df['states'].str.split(',')).explode('category').reset_index(drop=True)

# Remove row if state is NaN
stBrokenOut = stBrokenOut[stBrokenOut['category'].notna()]

# Grab a list of the unique states in the simulation
statesImpacted = stBrokenOut['category'].unique().tolist()

# Helper dictionary to point to loaded climo data
parmHelper = {
    'population': pop_data,
    'hospitals': hosp_data,
    'mobilehomes': mob_data,
    'psubstations': pow_data
}

masterDict['states'] = []

for state in statesImpacted:
    
    stateDict = {
        'state': state,
        'population': [],
        'hospitals': [],
        'mobilehomes': [],
        'psubstations': [],
        'tors': []
    }

    st_ind_torDict = {}

    ind_state = stBrokenOut[stBrokenOut['category'] == state]
    #print(f'State: {state}')
    ind_state_group = ind_state.groupby("sim").sum().loc[:,['population','hospitals','mobilehomes','psubstations']]
    ind_state_tot = ind_state_group.reindex(list(range(1,10001)),fill_value=0)

    ## ** Grabbing tornado tracks **
    st_quants = ind_state_tot.quantile(q=[0,0.1,0.5,0.9,1],interpolation='nearest')
    for impact in ['population','hospitals','mobilehomes','psubstations']:
        tmin = ind_state_tot[ind_state_tot[impact] == st_quants.loc[0,impact]].index[0]
        tten = ind_state_tot[ind_state_tot[impact] == st_quants.loc[0.1,impact]].index[0]
        tmed = ind_state_tot[ind_state_tot[impact] == st_quants.loc[0.5,impact]].index[0]
        tnine = ind_state_tot[ind_state_tot[impact] == st_quants.loc[0.9,impact]].index[0]
        tmax = ind_state_tot[ind_state_tot[impact] == st_quants.loc[1,impact]].index[0]

        st_ind_torDict[impact] = {}

        st_ind_torDict[impact]['min'] = ind_state[ind_state['sim'] == tmin].loc[:,['slon','slat','elon','elat',impact]].values.tolist()
        st_ind_torDict[impact]['ten'] = ind_state[ind_state['sim'] == tten].loc[:,['slon','slat','elon','elat',impact]].values.tolist()
        st_ind_torDict[impact]['med'] = ind_state[ind_state['sim'] == tmed].loc[:,['slon','slat','elon','elat',impact]].values.tolist()
        st_ind_torDict[impact]['ninety'] = ind_state[ind_state['sim'] == tnine].loc[:,['slon','slat','elon','elat',impact]].values.tolist()
        st_ind_torDict[impact]['max'] = ind_state[ind_state['sim'] == tmax].loc[:,['slon','slat','elon','elat',impact]].values.tolist()

    # Write out tornado json data
    with open(f'{outdir}/d{otlk_day}/includes/data/followup/{state}_ind_tors.json', 'w') as fp:
        json.dump(st_ind_torDict, fp)

    # Get tor counts for each state
    ind_state_tot = torCounter(ind_state,ind_state_tot)
    
    ind_state_tot.to_csv(f'{outdir}/d{otlk_day}/includes/data/followup/{state}_data.csv')

    for impact in ['hospitals','population','mobilehomes','psubstations','tors']:
        stats = ind_state_tot.describe(percentiles=[0.1,0.5,0.9]).loc[['min','10%','50%','90%','max'],[impact]][impact].values.tolist()
        
        stateDict[impact].append(stats)

        # This currently exists because we're not adding a tor climo
        if impact == 'tors':
            break
        
        # Append climo (gathered from a climo file)
        stateDict[impact].append([parmHelper[impact]['states'][state]['min'][dayIdx],
                                 parmHelper[impact]['states'][state]['ten'][dayIdx],
                                 parmHelper[impact]['states'][state]['med'][dayIdx],
                                 parmHelper[impact]['states'][state]['ninety'][dayIdx],
                                 parmHelper[impact]['states'][state]['max'][dayIdx]])

    masterDict['states'].append(stateDict)

    ################
##### CWAs #####
################
wfoBrokenOut = df.assign(category=df['wfos'].str.split(',')).explode('category').reset_index(drop=True)

# Remove row if cwa is NaN
wfoBrokenOut = wfoBrokenOut[wfoBrokenOut['category'].notna()]

# Grab a list of the unique states in the simulation
wfoImpacted = wfoBrokenOut['category'].unique().tolist()

masterDict['cwas'] = []

for wfo in wfoImpacted:
    cwaDict = {
        'cwa': wfo,
        'population': [],
        'hospitals': [],
        'mobilehomes': [],
        'psubstations': [],
        'tors': []
    }

    cwa_ind_torDict = {}

    ind_cwa = wfoBrokenOut[wfoBrokenOut['category'] == wfo]
    #print(f'CWA: {wfo}')
    ind_cwa_group = ind_cwa.groupby("sim").sum().loc[:,['population','hospitals','mobilehomes','psubstations']]
    ind_cwa_tot = ind_cwa_group.reindex(list(range(1,10001)),fill_value=0)

    ## ** Grabbing tornado tracks **
    cwa_quants = ind_cwa_tot.quantile(q=[0,0.1,0.5,0.9,1],interpolation='nearest')
    for impact in ['population','hospitals','mobilehomes','psubstations']:
        tmin = ind_cwa_tot[ind_cwa_tot[impact] == cwa_quants.loc[0,impact]].index[0]
        tten = ind_cwa_tot[ind_cwa_tot[impact] == cwa_quants.loc[0.1,impact]].index[0]
        tmed = ind_cwa_tot[ind_cwa_tot[impact] == cwa_quants.loc[0.5,impact]].index[0]
        tnine = ind_cwa_tot[ind_cwa_tot[impact] == cwa_quants.loc[0.9,impact]].index[0]
        tmax = ind_cwa_tot[ind_cwa_tot[impact] == cwa_quants.loc[1,impact]].index[0]

        cwa_ind_torDict[impact] = {}

        cwa_ind_torDict[impact]['min'] = ind_cwa[ind_cwa['sim'] == tmin].loc[:,['slon','slat','elon','elat',impact]].values.tolist()
        cwa_ind_torDict[impact]['ten'] = ind_cwa[ind_cwa['sim'] == tten].loc[:,['slon','slat','elon','elat',impact]].values.tolist()
        cwa_ind_torDict[impact]['med'] = ind_cwa[ind_cwa['sim'] == tmed].loc[:,['slon','slat','elon','elat',impact]].values.tolist()
        cwa_ind_torDict[impact]['ninety'] = ind_cwa[ind_cwa['sim'] == tnine].loc[:,['slon','slat','elon','elat',impact]].values.tolist()
        cwa_ind_torDict[impact]['max'] = ind_cwa[ind_cwa['sim'] == tmax].loc[:,['slon','slat','elon','elat',impact]].values.tolist()

    # Write out tornado json data
    with open(f'{outdir}/d{otlk_day}/includes/data/followup/{wfo}_ind_tors.json', 'w') as fp:
        json.dump(cwa_ind_torDict, fp)

    # Get tor counts for CWAs
    ind_cwa_tot = torCounter(ind_cwa,ind_cwa_tot)

    ind_cwa_tot.to_csv(f'{outdir}/d{otlk_day}/includes/data/followup/{wfo}_data.csv',index=False)

    for impact in ['hospitals','population','mobilehomes','psubstations','tors']:
        stats = ind_cwa_tot.describe(percentiles=[0.1,0.5,0.9]).loc[['min','10%','50%','90%','max'],[impact]][impact].values.tolist()
        
        cwaDict[impact].append(stats)

        # This currently exists because we're not adding a tor climo
        if impact == 'tors':
            break
        
        # Append climo (gathered from a climo file)
        cwaDict[impact].append([parmHelper[impact]['cwas'][wfo]['min'][dayIdx],
                                 parmHelper[impact]['cwas'][wfo]['ten'][dayIdx],
                                 parmHelper[impact]['cwas'][wfo]['med'][dayIdx],
                                 parmHelper[impact]['cwas'][wfo]['ninety'][dayIdx],
                                 parmHelper[impact]['cwas'][wfo]['max'][dayIdx]])

    masterDict['cwas'].append(cwaDict)

# Write out tornado json data
with open(f'{outdir}/d{otlk_day}/includes/data/init/ind_tors.json', 'w') as fp:
    json.dump(ind_torDict, fp)

# Write master json data
with open(f'{outdir}/d{otlk_day}/includes/data/init/data.json', 'w') as fp:
    json.dump(masterDict, fp)