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

# either set current date to actual current date (first line) or set current date to custom date
CURRENT_DATE=`date -u +"%Y%m%d"`
CURRENT_DATE="20200318"
echo "Today's date is... ${CURRENT_DATE}"

# set current outlook time
CURRENT_TIME=`date -u +"%H%M"`
VALID_TIME="1630"
DAY=$1

# PYTHON SETUP
PYTHON="/Users/josephpicca/opt/anaconda3/envs/impacts/bin/python"
SCRIPT_DIR="/scripts"
SCRIPT=$SCRIPT_DIR"/pas.py"
SCRIPT2=$SCRIPT_DIR"/makestats.py"
SCRIPT3=$SCRIPT_DIR"/lsrpred.py"
SCRIPT4=$SCRIPT_DIR"/prevOtlkFormatter.py"
IMPACTS_DATA=$DIR_ROOT$SCRIPT_DIR"/impacts-data"

INPUT=$DIR_ROOT"/data/outlooks"
OUTLOOK_DIR=$INPUT"/impacts.pmarshwx.com/test-grib"

# Testing purposes -- download old outlooks as a test from pmarsh site
TEST_URL_ROOT="http://impacts.pmarshwx.com/test-grib/"

# Remove old outlook grib files
#echo "Removing old files..."
#rm -r $OUTLOOK_DIR
#ls $OUTLOOK_DIR"/*"

#echo "Downloading outlook files..."
#wget -r --no-parent -P $INPUT -A "*_day"$DAY"_*"$CURRENT_DATE"*" $TEST_URL_ROOT

#echo "Downloading tornado outlook geojson..."
#wget -O $DIR_ROOT"/web/d1/includes/geo/test.geojson" https://www.spc.noaa.gov/products/outlook/day1otlk_torn.nolyr.geojson

D_TOR=`find $OUTLOOK_DIR -maxdepth 1 -type f -name "torn_day"$DAY"_grib2_"$VALID_TIME"*"$CURRENT_DATE"*" | sort -nr | head -1`
filename=`basename $D_TOR`
#echo $D_TOR
#echo $filename

# Get outlook date and outlook time by splitting basename at underscore
IFS="_" read -ra FILE_ARR <<< "$filename"
OUTLOOK_TIME=${FILE_ARR[3]}
OUTLOOK_TS=${FILE_ARR[4]}
OUTLOOK_DY=${FILE_ARR[1]}

# Copy the init data file (with nat/st/cwa quants to a new file)
#cp $DIR_ROOT"/web/d1/includes/data/init/data.json" $DIR_ROOT"/web/d1/includes/data/init/data_prev.json"

# Run the script that properly formats the prior outlook file (for colored tabular viz on the web page)
echo "Formatting previous outlook file. Current outlook is... ${OUTLOOK_DY}, ${OUTLOOK_TIME}"
$PYTHON $DIR_ROOT$SCRIPT4 -d $DAY -t $OUTLOOK_TIME -ts $OUTLOOK_TS -r $DIR_ROOT

# Update outlook time file
rm $DIR_ROOT"/web/d1/includes/data/init/otlk.txt"
echo {$OUTLOOK_TIME,$OUTLOOK_TS,$OUTLOOK_DY} | tr ' ' , >> $DIR_ROOT"/web/d1/includes/data/init/otlk.txt"

# Run PAS
#echo "Running PAS script on grib files"
#$PYTHON $DIR_ROOT$SCRIPT -f $D_TOR -n $N_SIMS -p $IMPACTS_DATA

# Run the stat maker
$PYTHON $DIR_ROOT$SCRIPT2 -f $IMPACTS_DATA"/output/"$OUTLOOK_TS".psv.gz" -r $DIR_ROOT$SCRIPT_DIR -d $DAY

# Run lsr feature engineering / prediction
#$PYTHON $DIR_ROOT$SCRIPT3 -r $DIR_ROOT -f $filename -i $IMPACTS_DATA"/pas-input-data"




