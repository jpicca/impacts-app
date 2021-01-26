import pygrib as pg
import numpy as np
import pandas as pd

probLevels = {
    'torn': [2,5,10,15,30,45,60],
    'hail': [5,15,30,45,60],
    'wind': [5,15,30,45,60]
}

def getGrids(impact_grids):
    cwa_grid = np.load(f'{impact_grids}/cwas.npz')['cwas']
    pop_grid = np.load(f'{impact_grids}/impact-grids.npz')['population']

    return cwa_grid, pop_grid

# Mask grid except for CWA
def cwaMask(cwa, toMask, maskingGrid):
    return np.ma.masked_where(maskingGrid != cwa, toMask)

def readOutlook(outlook):
    with pg.open(outlook) as GRB:
        try:
            probs = GRB[1].values.filled(-1)
        except AttributeError:
            probs = GRB[1].values

    return probs

def extractFeatures(haz,sig,cwa,probs,grids):

    # Unpack grids tuple
    cwa_grid = grids[0]
    pop_grid = grids[1]

    # Mask prob grid for specific CWAs
    CWAprobs = cwaMask(cwa,probs,cwa_grid)
    CWApop = cwaMask(cwa,pop_grid,cwa_grid)

    if sig:
        gridCount = np.count_nonzero(CWAprobs == 10)
        popCount = np.sum(np.ma.filled(np.ma.masked_where(CWAprobs != 10, CWApop),fill_value=0))
    else:
        gridCount = []
        popCount = []

        for prob in probLevels[haz]:
            gridCount.append(np.count_nonzero(CWAprobs == prob))
            popCount.append(np.sum(np.ma.filled(np.ma.masked_where(CWAprobs != prob, CWApop),fill_value=0)))

    return gridCount, popCount

def processFeatures(df):

    df['valid_doy'] = pd.to_datetime(df['valid_date'], format='%Y%m%d%H%M%S').dt.dayofyear

    proc_feats = df.drop(columns=['cwa','valid_date','otlk_day','otlk_time'])

    return proc_feats

def makePredictions(df,model):

    # Make predictions
    preds = model.predict(df)

    # Set any negative values to 0 (the Grad Boosting regressor can predict slight negative values)
    preds[preds < 0] = 0

    # Round the remaining non-zero, positive values
    format_preds = np.round_(preds,decimals=0)

    return format_preds

    

