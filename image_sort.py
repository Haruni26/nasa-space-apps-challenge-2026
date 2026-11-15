from pathlib import Path

import numpy as np
import matplotlib.pyplot as plt

import astropy.units as u
import matplotlib.pyplot as plt
from astropy.coordinates import SkyCoord
from astropy.io import fits
from astropy.table import Table
from astropy.visualization import quantity_support
from astropy.wcs import WCS
from astropy.visualization import AsinhStretch, LogStretch, PercentileInterval, ImageNormalize

# let matplotlib recognize astropy Quantities and auto-label axes with their units.
quantity_support()

### ---------- CREATE FOLDERS FOR SORTING ---------- ###
obj_names = ['barnards_star', 'epsilon_indi', 
             'r_draconis', 'rw_aurigae', 
             'wise_0855']

# find img_root directory and create folders after it
img_root_dir = Path('/home/img_root')
for obj in range(len(obj_names)): 
    # create main object directory
    img_obj_dir = img_root_dir / f'{obj_names[obj]}_dir'
    img_obj_dir.mkdir(parents=True, exist_ok=True)
    # create sub-directories for linear and asinh images
    img_lin_dir     = img_obj_dir / 'lin_dir'
    img_stretch_dir = img_obj_dir / 'stretch_dir'

### ---------- LOAD IN IMAGES ----------- ###
# loop over objects
for obj in range(len(obj_names)):
    # current directory path
    current_dir = Path('.')
    # find all images with object name as start of filename
    prefix = obj_names[obj]
    obj_fits_paths = [f for f in current_dir.glob(f"{prefix}*") if f.is_file()]

    # looping over images of object
    for img in range(len(obj_fits_paths)):

        ### --- LOAD IN IMAGE --- ###
        obj_fits_path = obj_fits_paths[img]
        # check if the file exists
        if object_folder_path.exists():
            print(object_folder_path.resolve())
        # open the .fits file, then load data into a NumPy array and also save main header
        with fits.open(object_folder_path) as hdul:
            hdul.info()
            # extract 2D image array 
            img_data = hdul[1].data
            # extract headers
            hdr_main = hdul[0].header
            hrd_img  = hdul[1].header
        # print diagnostics (check data type and shape)
        print(type(image_data))  # <class 'numpy.ndarray'>
        print(image_data.shape)  # (height, width)

        ### --- TRIM EXTREMES AND ASINH STRETCH --- ###
        # take interval (ignore bottom and top 1%)
        interval = PercentileInterval(98.0)
        vmin, vmax = interval.get_limits(image_data)
        # linearly normalize and clip the data to the [0, 1] range
        normalized_data = (image_data - vmin) / (vmax - vmin)
        normalized_data = np.clip(normalized_data, 0.0, 1.0)
        # asinh stretch (a=0.1) onto array directly 
        a_stretch  = 0.1
        stretch = AsinhStretch(a=a_stretch)
        stretched_data = stretch(normalized_data)

        ### --- SAVE NEW IMAGES --- ###
        # take observation time and detector ID from image header
        obs_time = hdr_img['MJD-OBS']  # obs time, modified Julian date
        det_id   = hdr_img['DETECTOR'] # 1-3 is shortwave IR, 4-6 is midwave IR
        # create strings of this data to put into filenames
        obs_time_str = str(obs_time).replace('.', '_') # replace the period in MJD with underscore
        det_id_str   = str(det_id)
        # create new filenames
        new_lin_filename     = f'{obs_time_str}_{prefix}_{det_id_str}_lin.png'
        new_stretch_filename = f'{obs_time_str}_{prefix}_{det_id_str}_stretch.png'
        # save new images with new filenames as PNGs to respective directories
        plt.imsave(img_lin_dir/new_lin_filename, image_data, cmap="gray")
        plt.imsave(img_stretch_dir/new_stretch_filename, stretched_data, cmap="gray")
