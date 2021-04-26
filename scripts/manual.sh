#!/bin/bash

# command line variable to indicate if it's a d1 or d2 outlook
DAY=$1
GRIB=0
DIR_ROOT="/Users/josephpicca/projects/impacts/dev/impacts-app"
SCRIPT="/scripts/process.sh"

echo "Running script for day${DAY}"
$DIR_ROOT$SCRIPT $DAY $GRIB

echo "rsyncing to remote web server"
rsync -a --delete $DIR_ROOT"/web/" spcsounding@soundingclimo.pmarshwx.com:~/www/impacts.pmarshwx.com/current 
