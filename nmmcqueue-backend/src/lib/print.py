import sys
import json
import os
import win32print
from escpos.printer import Win32Raw
from PIL import Image, ImageEnhance

def prepare_logo(logo1_path, logo2_path):
    """
    Creates a single horizontal 384px image combining both logos properly.
    """
    img1 = None
    if os.path.exists(logo1_path):
        try:
            img1 = Image.open(logo1_path).convert("RGBA")
        except Exception:
            pass
            
    img2 = None
    if os.path.exists(logo2_path):
        try:
            img2 = Image.open(logo2_path).convert("RGBA")
        except Exception:
            pass

    if not img1 and not img2:
        return None

    def process_logo(img, target_h=80):
        bg = Image.new("RGBA", img.size, (255, 255, 255, 255))
        if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
            bg.paste(img, mask=img.convert('RGBA').split()[3])
        else:
            bg.paste(img)
            
        bg = bg.convert("L")
        
        enhancer = ImageEnhance.Contrast(bg)
        bg = enhancer.enhance(2.0)
        
        bg = bg.point(lambda x: 255 if x > 200 else x)
        
        w, h = bg.size
        new_w = int(w * (target_h / h))
        bg = bg.resize((new_w, target_h), Image.Resampling.LANCZOS)
        return bg

    p1 = process_logo(img1) if img1 else None
    p2 = process_logo(img2) if img2 else None
    
    gap = 20
    w1 = p1.size[0] if p1 else 0
    w2 = p2.size[0] if p2 else 0
    total_w = w1 + w2 + (gap if p1 and p2 else 0)
    
    canvas_w = 384
    canvas_h = 80
    
    # Needs to be "L" or "1" for python-escpos
    canvas = Image.new('L', (canvas_w, canvas_h), 255) 
    
    start_x = (canvas_w - total_w) // 2
    if p1:
        canvas.paste(p1, (start_x, 0))
        start_x += w1 + gap
    if p2:
        canvas.paste(p2, (start_x, 0))
        
    return canvas

def print_ticket(data):
    try:
        printer_name = win32print.GetDefaultPrinter()
    except Exception as e:
        print(f"Failed to get default printer: {e}", file=sys.stderr)
        raise

    printer = Win32Raw(printer_name)

    # Print Logos
    logo_path = data.get('logo_path', '')
    doh_logo_path = data.get('doh_logo_path', '')
    
    composite_img = prepare_logo(logo_path, doh_logo_path)
    if composite_img:
        printer.set(align='center')
        printer.image(composite_img)
        
    # Text
    printer.set(align='center')
    printer.text("Northern Mindanao Medical Center\n")
    printer.text(data.get('station', 'Station') + "\n")
    printer.text("--------------------------------\n")
    printer.text(data.get('label', 'Queue Number') + "\n\n")
    
    # Big Ticket Number
    printer.set(align='center', width=5, height=5, bold=True)
    printer.text(data.get('ticketNumber', '000') + "\n")
    
    # Reset size
    printer.set(align='center', width=1, height=1, bold=False)
    printer.text("\n" + data.get('date', '') + "\n")
    printer.text("--------------------------------\n")
    
    if 'windowAssignment' in data:
        printer.set(align='center', bold=True)
        printer.text(data['windowAssignment'] + "\n")
        printer.set(bold=False)
    else:
        printer.text("\n")
        
    footer = data.get('footer', '')
    if footer:
        import textwrap
        wrapped = textwrap.wrap(footer, width=32)
        for line in wrapped:
            printer.text(line + "\n")
            
    printer.text("\n\n")
    printer.cut()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        json_str = sys.argv[1]
        try:
            data = json.loads(json_str)
            print_ticket(data)
            print("Successfully printed")
        except Exception as e:
            print(f"Error printing ticket: {e}", file=sys.stderr)
            sys.exit(1)
    else:
        print("No JSON payload provided.", file=sys.stderr)
        sys.exit(1)
