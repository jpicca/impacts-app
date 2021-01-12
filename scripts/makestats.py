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
parser.add_argument("-c", "--climopath", required=False, default="../data/climo-data", type=str, help=climo_help)
parser.add_argument("-d", "--day", required=False, default="1", type=str, help=d_help)

args = parser.parse_args()

# Primary variables
f = pathlib.Path(args.file)
