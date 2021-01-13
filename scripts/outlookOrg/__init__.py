"""
Python class to 

"""
import numpy as np

class mlFeatures(object):
    """
    A class to hold features and run predictions
    """

    def __init__(self):
        """
        Create an object to hold ml features
        """
        
        self.cwa = []
        self.otlk_day = [] #D1 or D2 (categorical)
        self.otlk_time = [] #1200, 1300, etc. (categorical)
        self.valid_date = [] #1,2,3,... 366 (categorical)
        self.gridCount_torn2 = []
        self.gridCount_torn5 = []
        self.gridCount_torn10 = []
        self.gridCount_torn15 = []
        self.gridCount_torn30 = []
        self.gridCount_torn45 = []
        self.gridCount_torn60 = []
        self.popCount_torn2 = []
        self.popCount_torn5 = []
        self.popCount_torn10 = []
        self.popCount_torn15 = []
        self.popCount_torn30 = []
        self.popCount_torn45 = []
        self.popCount_torn60 = []
        self.gridCount_hail5 = []
        self.gridCount_hail15 = []
        self.gridCount_hail30 = []
        self.gridCount_hail45 = []
        self.gridCount_hail60 = []
        self.popCount_hail5 = []
        self.popCount_hail15 = []
        self.popCount_hail30 = []
        self.popCount_hail45 = []
        self.popCount_hail60 = []
        self.gridCount_wind5 = []
        self.gridCount_wind15 = []
        self.gridCount_wind30 = []
        self.gridCount_wind45 = []
        self.gridCount_wind60 = []
        self.popCount_wind5 = []
        self.popCount_wind15 = []
        self.popCount_wind30 = []
        self.popCount_wind45 = []
        self.popCount_wind60 = []
        self.gridCount_sigtorn = []
        self.popCount_sigtorn = []
        self.gridCount_sighail = []
        self.popCount_sighail = []
        self.gridCount_sigwind = []
        self.popCount_sigwind = []
        self.valid_doy = np.zeros(7)
        self.EWX = np.zeros(7)
        self.FWD = np.zeros(7)
        self.HGX = np.zeros(7)
        self.OUN = np.zeros(7)
        self.SHV = np.zeros(7)
        self.SJT = np.zeros(7)
        self.TSA = np.zeros(7)
        self.otlkday_1 = np.zeros(7)
        self.otlkday_2 = np.zeros(7)
        self.otlktime_0100 = np.zeros(7)
        self.otlktime_0600 = np.zeros(7)
        self.otlktime_0700 = np.zeros(7)
        self.otlktime_1200 = np.zeros(7)
        self.otlktime_1300 = np.zeros(7)
        self.otlktime_1630 = np.zeros(7)
        self.otlktime_1700 = np.zeros(7)
        self.otlktime_2000 = np.zeros(7)
                        
        
