import pathlib
import shutil
import glob
import os

import argparse
import csv
import json

from datetime import datetime,timedelta

### CLI Parser ###
d_help = "The outlook day string (either day1 or day2"
t_help = "The specific outlook valid time"
ts_help = "The complete outlook timestamp from the issuance time"
approot_help = "The path to the root of the impacts app."

# Parse arguments
parser = argparse.ArgumentParser()
parser.add_argument("-d", "--otlkday", required=True, help=d_help)
parser.add_argument("-t", "--otlktime", required=True, help=t_help)
parser.add_argument("-ts","--timestamp", required=True, help=ts_help)
parser.add_argument("-r", "--approot", required=True, help=approot_help)
args = parser.parse_args()

day = args.otlkday
valid_time = args.otlktime
timestamp = args.timestamp
filedir_d1 = pathlib.Path(args.approot,'web',f'd1','includes','data')
filedir_d2 = pathlib.Path(args.approot,'web',f'd2','includes','data')

# The hour buffer allowed for reaching back to grab old outlooks
tbuf = 2
#cur_otlk_date = datetime.strptime(f'{timestamp[0:8]}-{time}','%Y%m%d-%H%M')
cur_otlk_date = datetime.strptime(timestamp, '%Y%m%d%H%M%S')
cur_otlk_time = datetime.strftime(cur_otlk_date,"%H%M")

def getForecastDay(daysBack,fcst):

    if fcst == '1':

        if daysBack == 1:
            forecastDay = (cur_otlk_date - timedelta(days=1)).strftime('%Y%m%d')
            files = glob.glob(f'{filedir_d2}/archive/*_{forecastDay}*')

        else:
            forecastDay = cur_otlk_date.strftime('%Y%m%d')
            files = glob.glob(f'{filedir_d1}/archive/*_{forecastDay}*')

        # Get the most recent file for that forecast day
        try:
            latest = max(files,key=os.path.getctime)        
        except ValueError:
            # Set a dummy file with an old date
            latest = 'data_v20000101_20000101120000.json'

        # Get the basename of the file
        filename = os.path.basename(latest)

        # Get the date and time
        ts = filename.split('_')[-1]

        date = ts[0:8]
        hour = ts[8:12]

        return (date,hour,latest)

    else:

        forecastDay = cur_otlk_date.strftime('%Y%m%d')

        files = glob.glob(f'{filedir_d2}/archive/*_{forecastDay}*')

        # Get the most recent file for that forecast day
        try:
            latest = max(files,key=os.path.getctime)        
        except ValueError:
            # Set a dummy file with an old date
            latest = 'data_v20000101_20000101120000.json'

        # Get the basename of the file
        filename = os.path.basename(latest)

        # Get the date and time
        ts = filename.split('_')[-1]

        date = ts[0:8]
        hour = ts[8:12]

        return (date,hour,latest)


# Based upon the day/time combo, make necessary changes to previous outlook stats file
if (day == '2'):

    d2_day,d2_time,d2_latest = getForecastDay(0,day)
    d2_date = datetime.strptime(f'{d2_day}-{d2_time}','%Y%m%d-%H%M')
    d2_diff_hr = (cur_otlk_date - d2_date).total_seconds()/3600
    
    if (int(cur_otlk_time) < 1300):

        print('Using empty prev file!')
        # Write out file
        with open(f'{filedir_d2}/init/data_prev.json', 'w') as fp:
            json.dump({}, fp)

    else:

        # Check day 2 otlk txt file, if hour diff > 11 hours, use empty prev file
        if d2_diff_hr > 11 + tbuf:

            print('Using empty prev file!')
            # Write out file
            with open(f'{filedir_d2}/init/data_prev.json', 'w') as fp:
                json.dump({}, fp)

        else:

            print('Using old d2 data file for the previous file')
            shutil.copy(d2_latest,f'{filedir_d2}/init/data_prev.json')

# ****** START HERE TOMORROW/TODAY, IDIOT *********

else:
    d2_day,d2_time,d2_latest = getForecastDay(1,day)
    d2_date = datetime.strptime(f'{d2_day}-{d2_time}','%Y%m%d-%H%M')
    d2_diff_hr = (cur_otlk_date - d2_date).total_seconds()/3600

    d1_day,d1_time,d1_latest = getForecastDay(0,day)
    d1_date = datetime.strptime(f'{d1_day}-{d1_time}','%Y%m%d-%H%M')
    d1_diff_hr = (cur_otlk_date - d1_date).total_seconds()/3600

    # Go through decision tree on what to do for day 1 outlook times

    if (valid_time == '1200'):

        # Check day 2 otlk txt file, if hour diff > 30 hour, use empty prev file

        if d2_diff_hr > 30 + tbuf:

            print('Using empty prev file!')
            # Write out file
            with open(f'{filedir_d1}/init/data_prev.json', 'w') as fp:
                json.dump({}, fp)

        else:

            print('Using old d2 data file for the previous file!')
            shutil.copy(d2_latest,f'{filedir_d1}/init/data_prev.json')

    elif (valid_time == '1300'):

        # Check day 1 otlk txt file, if hour diff > 1 hour, check day 2, if hour diff > 31 hours, use empty

        if d1_diff_hr > 1 + tbuf:

            if d2_diff_hr > 31 + tbuf:

                print('Using empty prev file!')
                # Write out file
                with open(f'{filedir_d1}/init/data_prev.json', 'w') as fp:
                    json.dump({}, fp)

            else:

                print('Using old d2 data file for the previous file!')
                shutil.copy(d2_latest,f'{filedir_d1}/init/data_prev.json')

        else:

            print('Using old d1 data file for the previous file!')
            shutil.copy(d1_latest,f'{filedir_d1}/init/data_prev.json')

    elif (valid_time == '1630'):

        # Check day 1 otlk txt file, if hour diff > 4.5 hour, check day 2, if hour diff > 34.5, use empty

        if d1_diff_hr > 4.5 + tbuf:

            if d2_diff_hr > 34.5 + tbuf:

                print('Using empty prev file!')
                with open(f'{filedir_d1}/init/data_prev.json', 'w') as fp:
                    json.dump({}, fp)

            else:

                print('Using old d2 data file for the previous file!')
                shutil.copy(d2_latest,f'{filedir_d1}/init/data_prev.json')
        else:

            print('Using old d1 data file for the previous file!')
            shutil.copy(d1_latest,f'{filedir_d1}/init/data_prev.json')

    elif (valid_time == '2000'):

        # Check day 1 otlk txt file, if hour diff > 8 hours, check day 2, if hour diff > 38

        if d1_diff_hr > 8 + tbuf:

            if d2_diff_hr > 38 + tbuf:

                print('Using empty prev file!')
                with open(f'{filedir_d1}/init/data_prev.json', 'w') as fp:
                    json.dump({}, fp)

            else:

                print('Using old d2 data file for the previous file!')
                shutil.copy(d2_latest,f'{filedir_d1}/init/data_prev.json')

        else:

            print('Using old d1 data file for the previous file!')
            shutil.copy(d1_latest,f'{filedir_d1}/init/data_prev.json')