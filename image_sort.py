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
#img_root_dir = 'nasa-space-apps-challenge-2026/img_root' #Path('/home/img_root')
img_root_dir = Path('img_root_dir')

for obj in range(len(obj_names)): 
    # create main object directory under the root
    img_obj_dir = img_root_dir / f"{obj_names[obj]}_dir"
    # create directories for linear and asinh stretched images
    (img_obj_dir / 'lin_dir').mkdir(parents=True, exist_ok=True)
    (img_obj_dir / 'stretch_dir').mkdir(parents=True, exist_ok=True)

### ---------- LOAD IN IMAGES ----------- ###
# loop over objects
for obj in range(len(obj_names)):

    # directories for sorting of THIS object
    img_obj_dir     = img_root_dir / f"{obj_names[obj]}_dir"
    img_lin_dir     = img_obj_dir / 'lin_dir'
    img_stretch_dir = img_obj_dir / 'stretch_dir'
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
        if obj_fits_path.exists():
            print(obj_fits_path.resolve())
        # open the .fits file, then load data into a NumPy array and also save main header
        with fits.open(obj_fits_path) as hdul:
            hdul.info()
            # extract 2D image array 
            img_data = hdul[1].data
            # extract headers
            hdr_main = hdul[0].header
            hdr_img  = hdul[1].header
        # print diagnostics (check data type and shape)
        print(type(img_data))  # <class 'numpy.ndarray'>
        print(img_data.shape)  # (height, width)

        ### --- TRIM EXTREMES AND ASINH STRETCH --- ###
        # Convert to float and mask out NaNs orinfs so percentile calculations don't break
        clean_data = np.array(img_data, dtype=np.float64)
        
        # Use nanpercentile to safely ignore bad pixels/NaNs
        vmin, vmax = np.nanpercentile(clean_data, [1.0, 99.0])
        
        # Guard against flat images
        if vmin == vmax or np.isnan(vmin):
            normalized_data = np.zeros_like(clean_data)
        else:
            # Linearly normalize and clip to [0, 1]
            normalized_data = (clean_data - vmin) / (vmax - vmin)
            normalized_data = np.nan_to_num(normalized_data, nan=0.0)
            normalized_data = np.clip(normalized_data, 0.0, 1.0)
            
        # Asinh stretch onto array directly 
        a_stretch = 0.1
        stretch = AsinhStretch(a=a_stretch)
        stretched_data = stretch(normalized_data)

        ### --- SAVE NEW IMAGES --- ###
        obs_time = hdr_img.get('MJD-OBS', 0)
        det_id   = hdr_img.get('DETECTOR', 1)
        
        obs_time_str = str(obs_time).replace('.', '_')
        det_id_str   = str(det_id)
        
        new_lin_filename     = f'{obs_time_str}_{prefix}_{det_id_str}_lin.png'
        new_stretch_filename = f'{obs_time_str}_{prefix}_{det_id_str}_stretch.png'
        
        # Pass vmin=0, vmax=1 explicitly because data is already scaled
        plt.imsave(img_lin_dir / new_lin_filename, normalized_data, cmap="gray", vmin=0, vmax=1)
        plt.imsave(img_stretch_dir / new_stretch_filename, stretched_data, cmap="gray", vmin=0, vmax=1)
