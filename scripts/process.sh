#!/usr/bin/env bash
#
# This script performs the following...
#

# This list may need to be updated

# -- For Tornado Statistical Impacts --
# 1) Downloads the latest SPC D1/D2 tor, wind, and hail outlooks (either grib or shapefile)
# 2) If necessary, runs a python script to convert shapefile to np grids and then saves to npz
# 3) Runs the PAS python script to create a zipped psv of model impacts
# 4) Runs a second python script to write stats jsons/csvs from zipped psv

# -- For Wind/Hail LSRs --
# 1) Runs a python script to format outlook features properly for ML model,
#   then load ML model and perform prediction
# 2) Push prediction to the web

# ENV VARS
DIR_ROOT="/Users/josephpicca/projects/impacts/dev/impacts-app"
N_SIMS=10000

# either set current date to actual current date (first line) or set current date to custom date
CURRENT_DATE=`date -u +"%Y%m%d"`
echo "Today's date is... ${CURRENT_DATE}"

# set outlook time
CURRENT_TIME=`date -u +"%H%M"`
DAY=$1

# PYTHON SETUP
PYTHONML="/Users/josephpicca/opt/anaconda3/envs/impacts/bin/python"
PYTHON="/Users/josephpicca/opt/anaconda3/envs/impacts-prod/bin/python"

# Second python interpreter because the first environment makes the npz processor break
PYTHON2="/Users/josephpicca/opt/anaconda3/envs/impacts-new/bin/python"
SCRIPT_DIR="/scripts"
SCRIPT=$SCRIPT_DIR"/pas.py"
SCRIPT2=$SCRIPT_DIR"/makestats.py"
SCRIPT3=$SCRIPT_DIR"/lsrpred.py"
SCRIPT4=$SCRIPT_DIR"/prevOtlkFormatter.py"
SCRIPT5=$SCRIPT_DIR"/processNPZ.py"
IMPACTS_DATA=$DIR_ROOT$SCRIPT_DIR"/impacts-data"

INPUT=$DIR_ROOT"/data/outlooks"
OUTLOOK_DIR=$INPUT"/impacts.pmarshwx.com/test-grib"
OUTLOOK_NPZ=$DIR_ROOT"/data/outlooks-npz"

# Testing purposes -- download old outlooks as a test from pmarsh site
TEST_URL_ROOT="http://impacts.pmarshwx.com/test-grib/"
SHAPE_URL="https://www.spc.noaa.gov/products/outlook/day"$DAY"otlk-shp.zip"






## ~~~~~~~~~~~~~~~~~

# ******
# Download the shapefile for conversion (Use the second line for specific past outlooks)
# *** Need to change the two following wgets if we use a custom time by commenting out respective first lines and uncommenting second lines ***
# ******

##########################################
## ** USE THIS BLOCK FOR CUSTOM DATE ** ##
##########################################

CUSTOM_YR="2021"
CUSTOM_MO="02"
CUSTOM_DY="28"
CUSTOM_DATE=$CUSTOM_YR$CUSTOM_MO$CUSTOM_DY
ISSUE_TIME="1630"

# Get the shapefile.zip and geojson
# wget -O $DIR_ROOT"/data/outlooks-shp/day"$DAY"_shapefile.zip" "https://www.spc.noaa.gov/products/outlook/archive/"$CUSTOM_YR"/day"$DAY"otlk_"$CUSTOM_DATE"_"$ISSUE_TIME"-shp.zip"
# wget -O $DIR_ROOT"/data/geojson/day"$DAY".geojson" "https://www.spc.noaa.gov/products/outlook/archive/"$CUSTOM_YR"/day"$DAY"otlk_"$CUSTOM_DATE"_"$ISSUE_TIME"_torn.nolyr.geojson"

# # Copy the geojson to the web folder for plotting
# cp $DIR_ROOT"/data/geojson/day"$DAY".geojson" $DIR_ROOT"/web/d"$DAY"/includes/geo/day"$DAY"_torn.geojson"

# echo "*** Running the shapefile to npz script ***"
# $PYTHON $DIR_ROOT$SCRIPT5 -p $IMPACTS_DATA -d $DAY -c $CUSTOM_DATE"_"$ISSUE_TIME -g


###########################################
## ** USE THIS BLOCK FOR CURRENT DATE ** ##
###########################################

# Get shapefile.zip and geojson
/usr/local/bin/wget -O $DIR_ROOT"/data/outlooks-shp/day"$DAY"_shapefile.zip" $SHAPE_URL
/usr/local/bin/wget -O $DIR_ROOT"/data/geojson/day"$DAY".geojson" "https://www.spc.noaa.gov/products/outlook/day"$DAY"otlk_torn.nolyr.geojson"

# Copy the geojson to the web folder for plotting
cp $DIR_ROOT"/data/geojson/day"$DAY".geojson" $DIR_ROOT"/web/d"$DAY"/includes/geo/day"$DAY"_torn.geojson"

echo "*** Running the shapefile to npz script ***"
$PYTHON $DIR_ROOT$SCRIPT5 -p $IMPACTS_DATA -d $DAY -g

## ~~~~~~~~~~~~~~~~~




# Remove old outlook grib files
#echo "Removing old files..."
#rm -r $OUTLOOK_DIR
#ls $OUTLOOK_DIR"/*"

#echo "Downloading outlook files..."
#wget -r --no-parent -P $INPUT -A "*_day"$DAY"_*"$CURRENT_DATE"*" $TEST_URL_ROOT



## ~~~~~~~~~~~~~~~~~

# *** The following section searches for the latest outlook file. Use first line for grib, second line for npz ***

#D_TOR=`find $OUTLOOK_DIR -maxdepth 1 -type f -name "torn_day"$DAY"_grib2_"$VALID_TIME"*"$CURRENT_DATE"*" | sort -nr | head -1`
D_TOR=`find $OUTLOOK_NPZ -maxdepth 1 -type f -name "day"$DAY"*" | xargs stat -f '%c %N' | sort -r | head -1 | sed 's/.* //'`
filename=`basename $D_TOR`
echo "The gridded file to be used is... ${filename}"

# Get outlook date and outlook time by splitting basename at underscore
IFS="_" read -ra FILE_ARR <<< "$filename"

# ** FOR GRIB FILE **

# OUTLOOK_TIME=${FILE_ARR[3]}
# OUTLOOK_TS=${FILE_ARR[4]}
# OUTLOOK_DY=${FILE_ARR[1]}

# ** FOR NPZ FILE **

OUTLOOK_TIME=${FILE_ARR[1]}
OUTLOOK_TS=${FILE_ARR[2]}
#OUTLOOK_DY=${FILE_ARR[1]}

echo "Outlook valid time..."
echo $OUTLOOK_TIME

echo "Outlook timestamp..."
echo $OUTLOOK_TS

echo "Impacts data source..."
echo $IMPACTS_DATA


## ~~~~~~~~~~~~~~~~~



## ~~~~~~~~~~~~~~~~~

# Run the script that properly formats the prior outlook file (for colored tabular viz on the web page)
echo "***Formatting previous outlook file. Current outlook is... D${DAY}, ${OUTLOOK_TS}"
$PYTHON $DIR_ROOT$SCRIPT4 -d $DAY -t $OUTLOOK_TIME -ts $OUTLOOK_TS -r $DIR_ROOT

# Run PAS
echo "***Running PAS script on grib files"
$PYTHON $DIR_ROOT$SCRIPT -f $D_TOR -n $N_SIMS -p $IMPACTS_DATA -ig 0

# Run the stat maker
echo "***Post processing PAS output for web viz tornado stats..."
$PYTHON $DIR_ROOT$SCRIPT2 -f $IMPACTS_DATA"/output/"$OUTLOOK_TS".psv.gz" -r $DIR_ROOT$SCRIPT_DIR -d $DAY

# Run lsr feature engineering / prediction
echo "***Extracting and feature processing PAS output for hail/wind prediction..."
$PYTHONML $DIR_ROOT$SCRIPT3 -r $DIR_ROOT -f $filename -i $IMPACTS_DATA"/pas-input-data" -d $DAY

#echo "rsync-ing to the remote web server..."
#rsync -a --delete $DIR_ROOT"/web/" spcsounding@soundingclimo.pmarshwx.com:~/www/impacts.pmarshwx.com/current


