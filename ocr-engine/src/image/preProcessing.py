import cv2
import math
import numpy as np
from PIL import Image
from deskew import determine_skew

import cv2
import numpy as np
import math

def deskew_img(image: np.ndarray) -> np.ndarray:
    try:
        # Get the raw angle from your utility
        angle = determine_skew(image)
        print(f"[deskew_img] Raw detected angle: {angle}")

        # STEP 1: Constrain the angle to [-45, 45]
        # This prevents 90-degree flips if the logic detects vertical lines
        orig_angle = angle
        while angle > 45:
            angle -= 90
        while angle < -45:
            angle += 90
        print(f"[deskew_img] Constrained angle: {angle} (original: {orig_angle})")

        # Grab original dimensions: NumPy uses (Height, Width)
        old_h, old_w = image.shape[:2]
        print(f"[deskew_img] Original shape: (h={old_h}, w={old_w})")
        
        # STEP 2: Calculate the new bounding box dimensions
        theta = math.radians(angle)
        cos_t = abs(math.cos(theta))
        sin_t = abs(math.sin(theta))
        
        # New Width/Height to prevent cropping
        new_w = int((old_w * cos_t) + (old_h * sin_t))
        new_h = int((old_w * sin_t) + (old_h * cos_t))
        print(f"[deskew_img] New shape after rotation: (h={new_h}, w={new_w})")

        # STEP 3: Create the Rotation Matrix
        # We rotate around the original center
        center = (old_w / 2, old_h / 2)
        rot_mat = cv2.getRotationMatrix2D(center, angle, 1.0)

        # STEP 4: Shift the Matrix
        # Because the canvas size changed, we must move the center 
        # to the middle of the NEW width and height
        rot_mat[0, 2] += (new_w - old_w) / 2
        rot_mat[1, 2] += (new_h - old_h) / 2

        # STEP 5: Warp the Image
        # CRITICAL: dsize must be (Width, Height)
        result = cv2.warpAffine(
            image,
            rot_mat,
            (new_w, new_h),
            flags=cv2.INTER_CUBIC,
            borderMode=cv2.BORDER_CONSTANT,
            borderValue=(0, 0, 0)
        )
        print(f"[deskew_img] Finished warping. Result shape: {result.shape}")
        return result

    except Exception as e:
        print(f"Error deskewing: {e}")
        return image


def convert_img(img: "Image") -> np.ndarray:
    img = np.array(img)
    return img


def normalize_img(img: np.ndarray) -> np.ndarray:
    return cv2.normalize(img, None, alpha=0, beta=255, norm_type=cv2.NORM_MINMAX)


def denoise_img(img: np.ndarray) -> np.ndarray:
    return cv2.bilateralFilter(img, 5, 55, 60)


def grayscale_img(img: np.ndarray) -> np.ndarray:
    return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)


def threshold_img(img: np.ndarray, threshold_val: int) -> np.ndarray:
    _, img_thresh = cv2.threshold(img, threshold_val, 255, 1)
    return img_thresh
