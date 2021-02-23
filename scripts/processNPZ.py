import fiona
import numpy as np
import pyproj
import shapely.geometry as sgeom
import parser
import argparse
import pathlib
import zipfile

import json
from io import StringIO

from pygridder import pygridder as pgrid

ipth_help = "Path to the Impacts Data Root. If not provided, check for environment variable."
day_help = "Day of the outlook (1 or 2)"
day_c_help = "The custom date of the outlook"
geo_help = "If there's a geojson available for this date (Pass a 1 or really anything if no geojson is available)"

parser = argparse.ArgumentParser()
parser.add_argument("-p", "--path", type=str, required=True, help=ipth_help)
parser.add_argument("-d", "--day", type=int, required=True, help=day_help)
parser.add_argument("-c", "--custom", type=str, required=False, help=day_c_help)
parser.add_argument("-g", "--nogeo", required=True, nargs='?', const='', help=geo_help)
args = parser.parse_args()

### Parse CLI Arguments ###
otlk_day = args.day
ndfd_file = pathlib.Path(args.path,'orig-gis-data','ndfd.npz')
zip_dir = pathlib.Path(args.path, '..','..','data','outlooks-shp')
outdir = pathlib.Path(args.path, '..','..','data','outlooks-npz')

# load the ndfd file
with np.load(ndfd_file) as NPZ:
    X = NPZ["X"]
    Y = NPZ["Y"]
    proj = pyproj.Proj(NPZ["srs"].item())

G = pgrid.Gridder(X, Y, dx=4000)

# Extract zip file
zippy = zipfile.ZipFile(f'{zip_dir}/day{otlk_day}_shapefile.zip')
zippy.extractall(zip_dir)

hazards = {'wind':[],'sigwind':[],'hail':[],'sighail':[],'torn':[],'sigtorn':[]}
haz_arrs = []

if args.custom:
    shp_file_base = f'{zip_dir}/day{otlk_day}otlk_{args.custom}_'
else:
    shp_file_base = f'{zip_dir}/day{otlk_day}otlk_'

for haz in hazards.keys():

    outlook = G.make_empty_grid().astype(str)
    lons = []
    lats = []
    cats = []

    shp_file = f'{shp_file_base}{haz}.shp'
    #shp_file = f'{zip_dir}/day{otlk_day}otlk_{haz}.shp'
    print(haz)

    with fiona.open(shp_file) as c: 
        for shp in c:

            props = shp["properties"]

            try:
                cat = props['LABEL']

                # Skip the SIGN labels in the regular haz shape files (not sure why they're in these shape files)
                if cat == 'SIGN':
                    if haz in ['torn','hail','wind']:
                        continue
                    else:
                        cat = '0.1'

                geom = sgeom.shape(shp["geometry"])
            
                try:
                    lon = geom.exterior.xy[0]
                    lat = geom.exterior.xy[1]
                    lon, lat = proj(lon, lat)
                    lons.append(lon)
                    lats.append(lat)
                    cats.append(cat)
                # If a multi polygon record
                except AttributeError:
                    for g in geom:
                        #print(g.exterior.xy[0])
                        lon = g.exterior.xy[0]
                        lat = g.exterior.xy[1]
                        lon, lat = proj(lon, lat)
                        lons.append(lon)
                        lats.append(lat)
                        cats.append(cat)
                        
                polys = G.grid_polygons(lons, lats)
                for poly, cat in zip(polys, cats):
                    outlook[poly] = cat
            
            except KeyError:
                print('no hazard probabilities... keeping entire grid at 0')
                
        
        # Multiply grid by 100 to get it into proper format for PAS and ml
        outlook = outlook.astype(float)*100
        hazards[haz] = outlook

# get the timestamp of the outlook
if not args.nogeo:

    geofile = pathlib.Path(args.path, '..','..','data','geojson',f'day{otlk_day}.geojson')
    with open(geofile,'r') as f:
        test = f.read()
        outjs = json.load(StringIO(test))

    # Get timestamp
    ts_issue = outjs['features'][0]['properties']['ISSUE']
    ts_valid = outjs['features'][0]['properties']['VALID']

else:

    print('no geojson available currently')

    formatted = args.custom.replace('_','')
    ts_issue = formatted
    ts_valid = formatted


# Save the grids into an npz file (00s appended just to meet format of grib file convention)
np.savez(f'{outdir}/day{otlk_day}_{ts_valid[-4:]}_{ts_issue}00_NPZ.npz', **hazards)