from PIL import Image

def pad_image(input_path, output_path):
    # Open the original image
    img = Image.open(input_path).convert("RGBA")
    
    # Target size
    canvas_size = (1024, 1024)
    canvas = Image.new("RGBA", canvas_size, (255, 255, 255, 0)) # Transparent background
    
    # Calculate new logo size (60% of original, assuming original is 1024x1024 or similar)
    # We want the logo to fit in the "Safe Zone" (approx 66% circle).
    # Let's target 600x600 px for the logo itself.
    
    # Resize keeping aspect ratio
    img.thumbnail((600, 600), Image.Resampling.LANCZOS)
    
    # Calculate position to center
    x = (canvas_size[0] - img.size[0]) // 2
    y = (canvas_size[1] - img.size[1]) // 2
    
    # Paste logo onto canvas
    canvas.paste(img, (x, y), img)
    
    # Save
    canvas.save(output_path, "PNG")
    print(f"Created padded icon at {output_path}")

if __name__ == "__main__":
    pad_image(r"C:\Users\zoukh\.gemini\antigravity\brain\ae960bea-f9c1-4e01-8fbc-9ab90ffc41a4\uploaded_image_1766149778938.png", r"d:\WRtour\mobile\assets\adaptive-icon-padded.png")
