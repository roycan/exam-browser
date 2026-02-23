from PIL import Image
import os

# input and output directories
input_path = "assets/src-icon.png"
output_dir = "assets"
os.makedirs(output_dir, exist_ok=True)

# load image
img = Image.open(input_path)

# make sure its square and RGBA
img = img.convert("RGBA")
size = max(img.size)
new_img = img.resize((size, size), Image.LANCZOS)

# save .ico for windows
ico_path = os.path.join(output_dir, "icon.ico")
new_img.save(ico_path, format="ICO", sizes=[(256, 256), (128, 128), (64, 64), (32, 32), (16, 16)])  # adjust sizes as needed

#save .icns for macOS
icns_path = os.path.join(output_dir, "icon.icns")
new_img.save(icns_path, format="ICNS") 

# save .png for linux (common size is 256x256)
png_path = os.path.join(output_dir, "icon.png")
new_img = new_img.resize((256, 256), Image.LANCZOS)
new_img.save(png_path, format="PNG")

print(f"Icons saved to {output_dir}")