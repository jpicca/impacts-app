#!/usr/bin/env bash
#
# This script performs the following...
#
# -- For Tornado Statistical Impacts --
# 1) Downloads the latest SPC D1 and D2 tor, wind, and hail outlooks
# 2) Runs the PAS python script to create a zipped psv of model impacts
# 3) Runs a second python script to write stats jsons/csvs from zipped psv

# -- For Wind/Hail LSRs --
# 1) Runs a python script to format outlook features properly for ML model,
#   then load ML model and perform prediction
# 2) Push prediction to the web

# ENV VARS
DIR_ROOT="/Users/josephpicca/Desktop/work2020/cimms-spc/IMPACTS-work/dev"
URL_ROOT="https://tgftp.nws.noaa.gov/SL.us008001/ST.opnl/DF.gr2/DC.ndfd/AR.conus/VP.001-003/"
SUFFIX_TOR="ds.ptornado.bin"
SUFFIX_SIG="ds.pxtornado.bin"
N_SIMS=10000
CURRENT_TIME=`date -u +"%Y%m%d%H%M%S"`

# PYTHON SETUP
PYTHON=/Users/josephpicca/anaconda/envs/impacts/bin/python
SCRIPT=pas.py
SCRIPT2=makestats.py
IMPACTS_DATA=$DIR_ROOT"/scripts/impacts-data"

D1_TOR=d1-tor_${CURRENT_TIME}.bin
D1_SIGTOR=d1-sigtor_${CURRENT_TIME}.bin

INPUT=$DIR_ROOT"/data/outlooks/"

# Download data // ** This will need updating for when actual outlooks are acquired **
echo "Downloading D1 tornado outlook..."
curl $URL_ROOT$SUFFIX_TOR -o $D1_TOR
echo "Downloading D1 sig tornado outlook..."
curl $URL_ROOT$SUFFIX_SIG -o $D1_SIGTOR

mv $D1_TOR $DIR_ROOT"/data/outlooks"
mv $D1_SIGTOR $DIR_ROOT"/data/outlooks"


# Run PAS
$PYTHON $DIR_ROOT"/scripts/"$SCRIPT -f $INPUT$D1_TOR -n $N_SIMS -p $IMPACTS_DATA




