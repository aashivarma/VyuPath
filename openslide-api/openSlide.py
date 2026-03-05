import os, json, math
import xml.etree.ElementTree as ET
import numpy as np
from io import BytesIO
from flask import Response

from PIL import Image
# import openslide


def initiateTile(Doctor, Patient, openslide):

    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    tileName = Patient + '.ndpi'

    dir = os.path.join(current_dir ,'static', 'tiles', 'Doctors', Doctor, Patient, tileName)
    slide = openslide.open_slide(dir)

    width, height = slide.dimensions

    return slide, width, height


#Returns the predicted cell coordinates
def tileSlide(Doctor, tileSlide, openslide):
    
    slide, width, height = initiateTile(Doctor, tileSlide, openslide)
#     # Get the specified tile
    predict_list = get_box_list(Doctor, tileSlide, openslide)
    predictArr = []
    
    for i in range(len(predict_list)):
        title,x1,y1,x2,y2,id,cat = predict_list[i]
        left = int(int((x1+x2)/2))
        top = int(int((y1+y2)/2))
     
        # openSeaXCoord = (1/width)*left
        # openSeaYCoord = (1/width) * top  
        openSeaXCoord = left / width
        openSeaYCoord = top / height  
        
        predictArr.append({
            "id": id,
            "title": title,
            "x1": x1,
            "y1": y1,
            "x2": x2,
            "y2": y2,            
            "cat": cat,
            "left": left,
            "top": top,
            "openSeaXCoord": openSeaXCoord,
            "openSeaYCoord": openSeaYCoord
        })
        
        tileDetail = {
            "width": width,
            "height": height            
        }
        
    
        
    returnObj = {"Predicts": predictArr, "tileDetail": tileDetail}

    return returnObj



#Creates the predicted images based on the annotation coordinates
def get_image(Doctor, tileSlide, annotNo, openslide):

    slide, width, height = initiateTile(Doctor, tileSlide, openslide)
    
    predict_list = get_box_list(Doctor, tileSlide, openslide)    
    title,x1,y1,x2,y2,id,cat = predict_list[int(annotNo)]
    
    # print(x1, y1, x2, y2)
    
    tile_anote = []                
    # centre of annotation in pixels
    cx = int((x1+x2)/2)  # int(gt[1])
    cy = int((y1+y2)/2)  # int(gt[2])        
    # centering the Groundtruth
    xc, yc = 512/2, 512/2
    left = int(cx - xc)
    top = int(cy - yc)  
    
    print(left, top)   
    
    tile = slide.read_region((left ,top), 0, (512, 512))
    
    tile = tile.convert('RGB')
    
    np_img = np.array(tile)
    np_img = get_bnc_adjusted(np_img,0)
    tile = Image.fromarray(np_img)
    
    # tile = cutoff_intensities(tile)
    
    output = BytesIO()
    
    # adjusted_tile.save(output, format='JPEG')
    tile.save(output, format='JPEG')
    
    tile_bytes = output.getvalue()
  
    tile.convert("RGB").save(output, format='JPEG')
    tile_bytes = output.getvalue()
    
    # plot_rgb_histogram(tile_bytes)
    print("GET_IMAGE FROM OPENSLIDE")
    
    return Response(tile_bytes, mimetype='image/jpeg')


def tile2(Doctor, tileName, level, row, col, openslide):
    try:
        slide, width, height = initiateTile(Doctor, tileName, openslide)   
        
        tile = slide.read_region((row ,col), 0, (512, 512))
    
        tile = tile.convert('RGB')
        
        np_img = np.array(tile)
        np_img = get_bnc_adjusted(np_img,0)
        tile = Image.fromarray(np_img)
        
        # tile = cutoff_intensities(tile)
        
        output = BytesIO()
        
        # adjusted_tile.save(output, format='JPEG')
        tile.save(output, format='JPEG')
        
        tile_bytes = output.getvalue()
    
        tile.convert("RGB").save(output, format='JPEG')
        tile_bytes = output.getvalue()
        
        # plot_rgb_histogram(tile_bytes)
    
        return Response(tile_bytes, mimetype='image/jpeg')
    except:
        print('Error in opening slide')
    finally:
        print('something')

def tile(Doctor, tileName, level, row, col, openslide):
    try:
        slide, width, height = initiateTile(Doctor, tileName, openslide)
        
        # # Calculate maximum DZI level
        # # Max dimension corresponds to level N where 2^N >= max_dim
        # # But DZI usually defines level 0 as 1x1.
        # # OpenSeadragon logic: Level N has width/height approx max_dim / 2^(max_level - N) ?? 
        # # Actually DZI standard: Level 0 is 1px. Level max is full size.
        # # Let's verify max level calculation.
        # max_dimension = max(width, height)
        # max_level = int(math.ceil(math.log2(max_dimension)))
        
        # # Calculate downsample factor for the requested level
        # # If requested level is max_level, downsample is 1.
        # # If requested level is max_level - 1, downsample is 2.
        # downsample = 2 ** (max_level - level)
        
        # # Get the best OpenSlide level for this downsample
        # best_level = slide.get_best_level_for_downsample(downsample)
        
        # # Adjust calculations based on the actual downsample of the OpenSlide level
        # level_downsample = slide.level_downsamples[best_level]
        
        # # We want to read a region that corresponds to the DZI tile (512x512 usually, but strict mapping needed)
        # # DZI Tile at 'level' (row, col) covers (col*512, row*512) to ((col+1)*512, (row+1)*512) in 'level' coordinates.
        # # Convert to Level 0 coordinates.
        
        # # Coordinates in the requested DZI level
        # tile_size = 512
        # x_dzi = col * tile_size
        # y_dzi = row * tile_size
        
        # # Convert to Level 0 coordinates
        # x0 = int(x_dzi * downsample)
        # y0 = int(y_dzi * downsample)
        
        # # We need to read a region from OpenSlide that results in 512x512 after scaling.
        # # The region width/height in Level 0 pixels:
        # w_l0 = tile_size * downsample
        # h_l0 = tile_size * downsample
        
        # # Read the region. read_region takes (x, y) at Level 0, but size at 'level'.
        # # Wait, read_region size argument is in pixels of the REFERENCED level (level arg).
        # # So we convert w_l0, h_l0 to best_level pixels.
        
        # w_read = int(w_l0 / level_downsample + 0.5)
        # h_read = int(h_l0 / level_downsample + 0.5)
        
        # Ensure we don't read outside? strict DZI might not care, but handy.
        # OpenSlide handles out of bounds by returning transparent/empty, which is fine.
        tile_size = 512

        # Ensure requested level exists
        if level < 0 or level >= slide.level_count:
            return Response(status=404)

        # Get downsample for this level
        #downsample = slide.level_downsamples[level]

        # Convert tile coordinates to level 0 coordinates
        # x0 = int(col * tile_size * downsample)
        # y0 = int(row * tile_size * downsample)

        # Read region directly from this level
        # tile_img = slide.read_region((x0, y0), level, (tile_size, tile_size))
        openslide_level = slide.level_count - 1 - level
        # Map OSD level to OpenSlide level (reverse order)

        # Safety clamp
        if openslide_level < 0:
            openslide_level = 0
        if openslide_level >= slide.level_count:
            openslide_level = slide.level_count - 1

        level_downsample = slide.level_downsamples[openslide_level]

        # Convert tile position to level 0 coordinates
        x0 = int(col * tile_size * level_downsample)
        y0 = int(row * tile_size * level_downsample)

        tile_img = slide.read_region((x0, y0), openslide_level, (tile_size, tile_size))

        print("----- TILE DEBUG -----")
        print("Requested OSD level:", level)
        print("Mapped OpenSlide level:", openslide_level)
        print("Total OpenSlide levels:", slide.level_count)

        print("Level dimensions:", slide.level_dimensions[openslide_level])

        # level_width, level_height = slide.level_dimensions[openslide_level]
        # tiles_x = math.ceil(level_width / 512)
        # tiles_y = math.ceil(level_height / 512)

        #print("Tiles available (x,y):", tiles_x, tiles_y)
        print("Requested tile (col,row):", col, row)
        print("-----------------------")
        # downsample = slide.level_downsamples[openslide_level]

        # x0 = int(col * tile_size * downsample)
        # y0 = int(row * tile_size * downsample)

        # tile_img = slide.read_region((x0, y0), openslide_level, (tile_size, tile_size))

        tile_img = tile_img.convert("RGB")
        # tile_img = slide.read_region((x0, y0), best_level, (w_read, h_read))
        
        # # Resize to the target tile size (512x512)
        # if tile_img.size != (tile_size, tile_size):
        #     tile_img = tile_img.resize((tile_size, tile_size), Image.Resampling.LANCZOS)
        
        # tile_img = tile_img.convert('RGB')
        
        # Apply any adjustments (like get_bnc_adjusted) if needed
        np_img = np.array(tile_img)
        np_img = get_bnc_adjusted(np_img, 0)
        tile_img = Image.fromarray(np_img)

        output = BytesIO()
        tile_img.save(output, format='JPEG')
        tile_bytes = output.getvalue()

        for i in range(slide.level_count):
            print(i, slide.level_dimensions[i])
        
        return Response(tile_bytes, mimetype='image/jpeg')
    
    except Exception as e:
        print(f"Error in tile processing: {e}")
        # Return empty tile or error
        # return Response(status=404)
        # For debug, maybe re-raise or return error image
        return Response(f"Error: {e}", status=500)
        
    finally:
        pass

        




def get_box_list(Doctor, tileSlide, openslide):
    
        nm_p=221
        
        current_dir = os.path.dirname(os.path.abspath(__file__))
        tileName = tileSlide + '.ndpa'
        dir = os.path.join(current_dir ,'static', 'tiles', 'Doctors', Doctor, tileSlide, tileName)
        
        tree = ET.parse(dir)
        root = tree.getroot()
        x1, y1, x2, y2 = 0, 0, 0, 0
        box_list = []
        X_Reference, Y_Reference = get_referance(Doctor, tileSlide, openslide)
        for elem in root.iter():
            
            if elem.tag == 'ndpviewstate':
                title = elem.find('title').text
                cat = ""
                if elem.find('cat') != None:
                    cat = elem.find('cat').text
                
      
                id = elem.get("id")   # MOD

            x = []
            y = []
            if elem.tag == 'pointlist':
                for sub in elem.iter(tag='point'):
                    x.append(int(sub.find('x').text))
                    y.append(int(sub.find('y').text))
                x1 = int((min(x) + X_Reference)/nm_p)
                x2 = int((max(x) + X_Reference)/nm_p)
                y1 = int((min(y) + Y_Reference)/nm_p)
                y2 = int((max(y) + Y_Reference)/nm_p)
                row = [title,x1, y1, x2, y2,id,cat]
                if title.lower() != 'bg':
                    box_list.append(row)
        return box_list

def get_referance( Doctor, tileName, openslide):
        # slide = self.slideRead()
        nm_p = 221
        slide, width, height = initiateTile(Doctor, tileName, openslide)

        w = int(slide.properties.get('openslide.level[0].width'))
        h = int(slide.properties.get('openslide.level[0].height'))

        ImageCenter_X = (w/2)*nm_p
        ImageCenter_Y = (h/2)*nm_p

        OffSet_From_Image_Center_X = slide.properties.get(
            'hamamatsu.XOffsetFromSlideCentre')
        OffSet_From_Image_Center_Y = slide.properties.get(
            'hamamatsu.YOffsetFromSlideCentre')

        # print("offset from Img center units?", OffSet_From_Image_Center_X,OffSet_From_Image_Center_Y)

        X_Ref = float(ImageCenter_X) - float(OffSet_From_Image_Center_X)
        Y_Ref = float(ImageCenter_Y) - float(OffSet_From_Image_Center_Y)
        return X_Ref, Y_Ref
    
def get_bnc_adjusted(img,clip=12):
        hista,histb = np.histogram(img,255)        
        total =0
        n_rem= int((510*510*3*clip)/100)
        for i in reversed(range(255)):
            total +=hista[i]
            if total > n_rem :
                cut_off = int(histb[i])
                break

        alpha = 255/(cut_off)    
        gamma = 0.8
        img_stretched = np.clip(alpha*img, 0, 255)
        img_gama =255 *pow((img_stretched/255),gamma)    
        return img_gama.astype('uint8')
    
    
def cutoff_intensities(img):
    # Convert the image to a numpy array
    image_array = np.array(img)
    
    # Create a mask for the intensity ranges to be cutoff
    mask = ((image_array >= 1) & (image_array <= 50)) | ((image_array >= 200) & (image_array <= 255))
    
    # Apply the mask to the image array, setting the specified intensities to zero
    image_array[mask] = 0
    
    # Convert the modified array back to an image
    result_image = Image.fromarray(image_array)
    
    return result_image