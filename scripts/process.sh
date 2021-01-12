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
DIR_ROOT="/Users/josephpicca/projects/impacts/dev/impacts-app"
#URL_ROOT=Set to wherever we will fetch the outlook grib files
#SUFFIX_TOR=Set to naming convention of the grib files
#SUFFIX_SIG=Set to naming convention of the grib files
N_SIMS=10000
CURRENT_TIME=`date -u +"%Y%m%d"`
CURRENT_TIME="20201011"
echo $CURRENT_TIME

# PYTHON SETUP
PYTHON="/Users/josephpicca/opt/anaconda3/envs/impacts/bin/python"
SCRIPT_DIR="/scripts"
SCRIPT=$SCRIPT_DIR"/pas.py"
SCRIPT2=$SCRIPT_DIR"/makestats.py"
IMPACTS_DATA=$DIR_ROOT$SCRIPT_DIR"/impacts-data"

INPUT=$DIR_ROOT"/data/outlooks"

# # Download data // ** This will need updating for when actual outlooks are acquired **
# echo "Downloading D1 tornado outlook..."
# curl $URL_ROOT$SUFFIX_TOR -o $D1_TOR
# echo "Downloading D1 sig tornado outlook..."
# curl $URL_ROOT$SUFFIX_SIG -o $D1_SIGTOR

# Testing purposes -- download old outlooks as a test from pmarsh site
TEST_URL_ROOT="http://impacts.pmarshwx.com/test-grib/"

echo "Removing old files..."
#rm $INPUT"*"

echo "Downloading outlook files..."
#wget -r --no-parent -P $INPUT -A "*_day1_*"$CURRENT_TIME"*" $TEST_URL_ROOT

echo "Running PAS script on grib files"
D1_TOR=`find ../data/outlooks/impacts.pmarshwx.com/test-grib -maxdepth 1 -type f -name "torn_day1_grib2_*"$CURRENT_TIME"*"`
filename=`basename $D1_TOR`
#echo $D1_TOR
#echo $filename

# Get outlook date and outlook time
IFS="_" read -ra FILE_ARR <<< "$filename"
OUTLOOK_TIME=${FILE_ARR[3]}
OUTLOOK_TS=${FILE_ARR[4]}

# Run PAS
#$PYTHON $DIR_ROOT$SCRIPT -f $D1_TOR -n $N_SIMS -p $IMPACTS_DATA

# Run the stat maker
$PYTHON $DIR_ROOT$SCRIPT2 -f $IMPACTS_DATA"/output/"$OUTLOOK_TS".psv.gz"




