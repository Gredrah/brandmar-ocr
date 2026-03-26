import io
from PIL import Image, ImageOps

from preProcessing import convert_img, normalize_img, grayscale_img, denoise_img, deskew_img, threshold_img

def clean_document(input_path, output_path):
    debug_counter = 0
    
    with open(input_path, "rb") as f:
        bytes_data = f.read()
        img = Image.open(io.BytesIO(bytes_data))
        img = ImageOps.exif_transpose(img)
    if img is None:
        raise FileNotFoundError(f"Failed to load: {input_path}")
    
    img = convert_img(img)
    Image.fromarray(img).save(f"{output_path}{[debug_counter]}.png")
    debug_counter += 1
    img = normalize_img(img)
    Image.fromarray(img).save(f"{output_path}{[debug_counter]}.png")
    debug_counter += 1
    img = grayscale_img(img)
    Image.fromarray(img).save(f"{output_path}{[debug_counter]}.png")
    debug_counter += 1
    img = denoise_img(img)
    Image.fromarray(img).save(f"{output_path}{[debug_counter]}.png")
    debug_counter += 1
    img = deskew_img(img)
    Image.fromarray(img).save(f"{output_path}{[debug_counter]   }.png")
    debug_counter += 1
    print(f"[clean_document] Before thresholding: shape={img.shape}, dtype={img.dtype}")
    img = threshold_img(img, 165)
    print(f"[clean_document] After thresholding: shape={img.shape}, dtype={img.dtype}")
    return Image.fromarray(img)
    
if __name__ == "__main__":
    input_path = "../../test/samples/Dist_gross_profit_held.jpg"
    input_path1 = "../../test/samples/dist_gross_profit_flat.jpg"
    output_path = "../../data/processed/test_cleanedHeld.png"
    output_path1 = "../../data/processed/test_cleanedFlat.png"
    cleaned_img = clean_document(input_path, output_path)
    cleaned_img.save(output_path)
    cleaned_img = clean_document(input_path1, output_path1)
    cleaned_img.save(output_path1)

    