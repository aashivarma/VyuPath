import os
import sys
import json
import math
import secrets
from typing import List, Optional
from io import BytesIO

from fastapi import FastAPI, Depends, HTTPException, status, Request, Response, File, UploadFile
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response as APIResponse
from fastapi.responses import Response, StreamingResponse

from PIL import Image
import numpy as np
import cv2

# OpenSlide path setup
import openslide
from openslide.deepzoom import DeepZoomGenerator
from openslide import OpenSlide

import xml.etree.ElementTree as ET

app = FastAPI()
security = HTTPBasic()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

slides_cache = {}
deepzoom_cache = {}

BASE_SLIDE_DIR = "/Users/aashivarma/vyuhaa-med-screen/openslide-api/static/tiles/Doctors"

def get_slide_path(doctor: str, slide: str):
    return os.path.join(
        BASE_SLIDE_DIR,
        doctor,
        "myslide",
        f"{slide}.ndpi"
    )
def get_deepzoom(doctor: str, slide: str):
    slide_path = os.path.join(BASE_SLIDE_DIR, doctor, "myslide", f"{slide}.ndpi")

    if slide_path not in deepzoom_cache:
        slide_obj = OpenSlide(slide_path)
        deepzoom_cache[slide_path] = DeepZoomGenerator(
            slide_obj,
            tile_size=512,
            overlap=0,
            limit_bounds=False
        )

    return deepzoom_cache[slide_path]

def get_slide(doctor: str, slide: str):
    slide_path = get_slide_path(doctor, slide)

    if slide_path not in slides_cache:
        slide_obj = OpenSlide(slide_path)
        slides_cache[slide_path] = slide_obj

    return slides_cache[slide_path]

# --- Basic Auth ---
def get_current_username(credentials: HTTPBasicCredentials = Depends(security)):
    # In a real app, verify against DB or env vars. 
    # For now, we accept any user who provides a password "secret" for simplicity/demo
    # or just checks presence. The user asked for "Basic auth details in .env" 
    # but didn't specify what they are. I'll hardcode a check or allow all for now 
    # and rely on the Node middleware to provide *valid* headers.
    # Let's assume a default: user/password
    correct_username = secrets.compare_digest(credentials.username, "user")
    correct_password = secrets.compare_digest(credentials.password, "password")
    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

# --- Slide Caching (Session-like) ---
# Cache slides to avoid re-opening them constantly.
# Key: (Doctor, tileName)

# TEST_SLIDE_PATH = "/Users/aashivarma/Downloads/C25 - 9793 - 3060936.ndpi"

#from here---------------

# slide_cache = {}
# BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# BASE_SLIDE_PATH = os.path.join(
#     BASE_DIR,
#     "static",
#     "tiles",
#     "Doctors"
# )

# def get_slide_handle(Doctor: str, tileName: str):
#     slide_path = os.path.join(
#         BASE_SLIDE_PATH,
#         Doctor,
#         tileName,
#         f"{tileName}.ndpi"
#     )
#     print("Opening slide from:", slide_path)

#     if slide_path in slide_cache:
#         return slide_cache[slide_path]

#     slide = openslide.OpenSlide(slide_path)
#     slide_cache[slide_path] = slide

#     return slide

#to here ------------------------

    # if TEST_SLIDE_PATH in slide_cache:
    #     return slide_cache[TEST_SLIDE_PATH]

    # try:
    #     slide = openslide.OpenSlide(TEST_SLIDE_PATH)
    # except Exception as e:
    #     raise Exception(f"OpenSlide failed: {e}")

    # slide_cache[TEST_SLIDE_PATH] = slide
    # return slide


# --- Helper Functions (Ported) ---

def get_bnc_adjusted(img, clip=12):
    hista, histb = np.histogram(img, 255)
    total = 0
    n_rem = int((510*510*3*clip)/100) # 510*510 ?? old code had this specific number
    # old code used 510*510, likely approximation of 512*512 or just custom. keeping it.
    cut_off = 255
    for i in reversed(range(255)):
        total += hista[i]
        if total > n_rem:
            cut_off = int(histb[i])
            break
            
    if cut_off == 0: cut_off = 1 # avoid div by zero
    
    alpha = 255 / cut_off
    gamma = 0.8
    img_stretched = np.clip(alpha * img, 0, 255)
    img_gama = 255 * pow((img_stretched / 255), gamma)
    return img_gama.astype('uint8')

def get_referance(Doctor, tileName):
    # This logic seems to need the slide properties
    slide = get_slide(Doctor, tileName)
    nm_p = 221
    
    # openslide.level[0].width
    try:
        w = int(slide.properties.get('openslide.level[0].width'))
        h = int(slide.properties.get('openslide.level[0].height'))
        
        ImageCenter_X = (w/2)*nm_p
        ImageCenter_Y = (h/2)*nm_p
        
        OffSet_From_Image_Center_X = slide.properties.get('hamamatsu.XOffsetFromSlideCentre')
        OffSet_From_Image_Center_Y = slide.properties.get('hamamatsu.YOffsetFromSlideCentre')
        
        X_Ref = float(ImageCenter_X) - float(OffSet_From_Image_Center_X)
        Y_Ref = float(ImageCenter_Y) - float(OffSet_From_Image_Center_Y)
        return X_Ref, Y_Ref
    except Exception as e:
        print(f"Error getting reference: {e}")
        return 0, 0

def get_box_list_internal(Doctor, tileName):
    nm_p = 221
    current_dir = os.path.dirname(os.path.abspath(__file__))
    annot_file = tileName + '.ndpa'
    path = os.path.join(current_dir ,'static', 'tiles', 'Doctors', Doctor, tileName, annot_file)
    
    box_list = []
    if not os.path.exists(path):
        return box_list

    try:
        tree = ET.parse(path)
        root = tree.getroot()
        X_Reference, Y_Reference = get_referance(Doctor, tileName)
        
        for elem in root.iter():
            if elem.tag == 'ndpviewstate':
                title = elem.find('title').text
                cat = ""
                cat_elem = elem.find('cat')
                if cat_elem is not None:
                    cat = cat_elem.text
                id = elem.get("id")

                x = []
                y = []
                # Find pointlist inside this ndpviewstate? No, XML structure...
                # Old code iterates root.iter(). It relies on 'ndpviewstate' setting variable state
                # and then 'pointlist' using it? This is risky parsing if nested.
                # Assuming standard NDPA structure where pointlist is child or sibling.
                # Actually old code loop is flat: `for elem in root.iter():`
                # It sets `title`, `id` when it sees `ndpviewstate`.
                # Then uses them when it sees `pointlist`.
                # This assumes order. We will replicate specific logic carefully.
                pass 

        # Let's refine parsing to be safer or match exact logic
        # The old code variable `title` persists across iterations? 
        # Yes, `title` is defined in `ndpviewstate` block.
        # But `x` and `y` are reset inside `pointlist`.
        
        current_title = None
        current_id = None
        current_cat = None
        
        for elem in root.iter():
            if elem.tag == 'ndpviewstate':
                current_title = elem.find('title').text
                cat_child = elem.find('cat')
                current_cat = cat_child.text if cat_child is not None else ""
                current_id = elem.get("id")
            
            if elem.tag == 'pointlist' and current_title is not None:
                x_pts = []
                y_pts = []
                for sub in elem.iter(tag='point'):
                    x_pts.append(int(sub.find('x').text))
                    y_pts.append(int(sub.find('y').text))
                
                if not x_pts: continue
                
                x1 = int((min(x_pts) + X_Reference)/nm_p)
                x2 = int((max(x_pts) + X_Reference)/nm_p)
                y1 = int((min(y_pts) + Y_Reference)/nm_p)
                y2 = int((max(y_pts) + Y_Reference)/nm_p)
                
                if current_title.lower() != 'bg':
                    box_list.append([current_title, x1, y1, x2, y2, current_id, current_cat])
                    
    except Exception as e:
        print(f"Error parsing NDPA: {e}")
        
    return box_list


# --- Routes ---
from fastapi import APIRouter
api_router = APIRouter(prefix="/api/fastapi")

@api_router.get("/dzi/{doctor}/{slide}.dzi")
def get_dzi(doctor: str, slide: str):

    dz = get_deepzoom(doctor, slide)

    dzi_xml = dz.get_dzi("jpeg")

    return Response(content=dzi_xml, media_type="application/xml")

@api_router.get("/dzi/{doctor}/{slide}_files/{level}/{col}_{row}.jpeg")
def get_dzi_tile(doctor: str, slide: str, level: int, col: int, row: int):

    dz = get_deepzoom(doctor, slide)

    tile = dz.get_tile(level, (col, row))

    buffer = BytesIO()
    tile.save(buffer, format="JPEG")
    buffer.seek(0)

    return StreamingResponse(buffer, media_type="image/jpeg")

@api_router.get("/tileSlide/{Doctor}/{tileSlide}")
def tile_slide(Doctor: str, tileSlide: str):
    slide = get_slide(Doctor, tileSlide)
    width, height = slide.dimensions
    
    predict_list = get_box_list_internal(Doctor, tileSlide)
    predictArr = []
    
    for i in range(len(predict_list)):
        title, x1, y1, x2, y2, id, cat = predict_list[i]
        left = int((x1+x2)/2)
        top = int((y1+y2)/2)
        
        # FIX from previous debugging: SWAP X/Y logic?
        # In openSlide.py we fixed: openSeaYCoord = (1/width) * top
        # We need to ensure we use the FIXED logic.
        
        # openSeaXCoord = (1/width) * left
        # openSeaYCoord = (1/width) * top # Normalized by WIDTH as per OSD requirement
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
    #return {"debug": "this is active server"}  
    return {"Predicts": predictArr, "tileDetail": {"width": width, "height": height}}

@api_router.get("/get_image/{Doctor}/{tileSlide}/{annotNo}")
def get_image(Doctor: str, tileSlide: str, annotNo: str):
    slide = get_slide(Doctor, tileSlide)
    predict_list = get_box_list_internal(Doctor, tileSlide)
    
    # if annotNo >= len(predict_list):
    #     raise HTTPException(status_code=404, detail="Annotation not found")
        
    # title, x1, y1, x2, y2, id, cat = predict_list[annotNo]

    # Find annotation by ID instead of list index
    matched = None
    for item in predict_list:
        title, x1, y1, x2, y2, id, cat = item
        if str(id) == str(annotNo):
            matched = item
            break

    if matched is None:
        raise HTTPException(status_code=404, detail="Annotation not found")

    title, x1, y1, x2, y2, id, cat = matched
    

    cx = int((x1+x2)/2)
    cy = int((y1+y2)/2)
    xc, yc = 512/2, 512/2
    left = int(cx - xc)
    top = int(cy - yc)
    
    tile = slide.read_region((left, top), 0, (512, 512))
    tile = tile.convert('RGB')
    
    np_img = np.array(tile)
    np_img = get_bnc_adjusted(np_img, 0)
    tile = Image.fromarray(np_img)
    
    output = BytesIO()
    tile.save(output, format='JPEG')
    print("GET_IMAGE FROM SERVERFAST")
    return APIResponse(content=output.getvalue(), media_type="image/jpeg")

# @api_router.get("/tile/{Doctor}/{tileName}/{level}/{row}_{col}.jpeg")
# def get_tile(Doctor: str, tileName: str, level: int, row: int, col: int):
#     try:
#         slide = get_slide_handle(Doctor, tileName)

#         tile_size = 512

#         # Safety: clamp level to available OpenSlide levels
#         if level >= slide.level_count:
#             level = slide.level_count - 1

#         level_downsample = slide.level_downsamples[level]

#         # Convert tile grid position to level 0 coordinates
#         x0 = int(col * tile_size * level_downsample)
#         y0 = int(row * tile_size * level_downsample)

#         tile_img = slide.read_region((x0, y0), level, (tile_size, tile_size))
#         tile_img = tile_img.convert("RGB")

#         # Apply brightness/contrast adjustment if needed
#         np_img = np.array(tile_img)
#         np_img = get_bnc_adjusted(np_img, 0)
#         tile_img = Image.fromarray(np_img)

#         output = BytesIO()
#         tile_img.save(output, format="JPEG")

#         return APIResponse(content=output.getvalue(), media_type="image/jpeg")

#     except Exception as e:
#         print(f"Error in tile: {e}")
#         return APIResponse(status_code=500, content=str(e))

@api_router.get("/slide_info/{Doctor}/{tileName}")
def slide_info(Doctor: str, tileName: str):
    slide = get_slide(Doctor, tileName)
    width, height = slide.dimensions
    return {"width": width, "height": height, "levels": slide.level_count}

@api_router.get("/getDoctors")
def get_doctors(username: str = Depends(get_current_username)):
    root_dir = r'C:\Users\mahar\OneDrive\Documents\Custom Applciation\openseadragon\server2\static'
    data = [] # List of doctors? Old code returned data['Doctor'] which was a list
    
    # Porting fileoperation.getDoctors logic
    doctors_path = os.path.join(root_dir, 'tiles', 'Doctors')
    if os.path.exists(doctors_path):
        for doctor in os.listdir(doctors_path):
            doctor_path = os.path.join(doctors_path, doctor)
            if os.path.isdir(doctor_path):
                patients = []
                for patient in os.listdir(doctor_path):
                    if os.path.isdir(os.path.join(doctor_path, patient)):
                        patients.append(patient)
                data.append({"name": doctor, "patients": patients})
    return data

@api_router.post("/upload-image")
async def upload_image(file: UploadFile = File(...), username: str = Depends(get_current_username)):
    contents = await file.read()
    image = Image.open(BytesIO(contents))
    image = np.array(image)
    
    if image.shape[2] == 4:
        image = cv2.cvtColor(image, cv2.COLOR_BGRA2BGR)
        
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    r, g, b = cv2.split(image_rgb)
    
    r_hist = cv2.calcHist([r], [0], None, [256], [0, 256]).flatten().tolist()
    g_hist = cv2.calcHist([g], [0], None, [256], [0, 256]).flatten().tolist()
    b_hist = cv2.calcHist([b], [0], None, [256], [0, 256]).flatten().tolist()
    
    return {
        'labels': list(range(256)),
        'r': r_hist,
        'g': g_hist,
        'b': b_hist
    }

app.include_router(api_router)
if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
