from fastapi import FastAPI, File, UploadFile, Form,  HTTPException
from fastapi.responses import FileResponse, JSONResponse
import uvicorn
from PIL import Image
import numpy as np
import tempfile
from imageio import imwrite
import threading
from fastapi.middleware.cors import CORSMiddleware

description = """
Steganography software

## Items

Hide the text data inside media
"""

app = FastAPI(
    title="Steganography",
    description=description,
    summary="Secure the data by obfuscation",
    version="0.0.1",
)

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

max_value = 255 # max uint value per pixel per channel
header_len = 4*8 # uint32 bit length

class api_thread(threading.Thread):
    def __init__(self, func, args):
        super().__init__()
        self.arg = args
        self.result = None
        self.func = func

    def run(self):
        self.result = self.func(self.arg)

def encode_data(image, file_data):
    or_mask = file_data
    and_mask = np.zeros_like(or_mask)
    and_mask = (and_mask + max_value - 1) + or_mask 
    res = np.bitwise_or(image, or_mask)
    res = np.bitwise_and(res, and_mask)
    return res

def decode_data(encoded_data):
    out_mask = np.ones_like(encoded_data)
    output = np.bitwise_and(encoded_data, out_mask)
    return output

def process_text(text):
    msg = str.encode(text)
    byte_array = np.frombuffer(msg, dtype=np.uint8)
    file = np.unpackbits(byte_array)
    file_len = file.shape[0]
    len_array = np.array([file_len], dtype=np.uint32).view(np.uint8)
    len_array = np.unpackbits(len_array)
    return file, file_len, len_array
    
def process_img(base_file):
    img = None
    with Image.open(base_file.file) as img:
        img = np.array(img, dtype=np.uint8)
    shape_orig = img.shape
    image = img.flatten()
    return image, shape_orig   

@app.post("/encode/")
def upload_file(text: str = Form(...), base_file: UploadFile = File(...) ):
    print(text)
    txt_thread = api_thread(process_text, text)
    txt_thread.start()
    img_thread = api_thread(process_img, base_file)
    img_thread.start()
    
    txt_thread.join()
    img_thread.join()
    
    file, file_len, len_array = txt_thread.result
    image, shape_orig = img_thread.result
    
    img_len = image.shape[0]
    if file_len >= img_len - header_len: 
        HTTPException(status_code=302, detail="Too much data to hide in small image") 
    else: 
        tmp = file
        file = np.random.randint(2, size=img_len, dtype=np.uint8)
        file[header_len:header_len+file_len] = tmp
    file[:header_len] = len_array
    
    encoded_data = encode_data(image, file)
    img_data = np.reshape(encoded_data, shape_orig)
    temp_file = tempfile.NamedTemporaryFile(suffix=".png",delete=False)
    imwrite(temp_file.name, img_data)
    temp_file.close()
    return FileResponse(temp_file.name, media_type="image/jpeg")

@app.post("/decode/")
def upload_file(encoded_file: UploadFile = File(...) ):
    img = None
    with Image.open(encoded_file.file) as img:
        img = np.array(img, dtype=np.uint8)
    image = img.flatten()
    data = decode_data(image)
    el_array = np.packbits(data[:header_len])
    extracted_len = el_array.view(np.uint32)[0]
    bit_array = data[header_len:extracted_len+header_len]
    byte_array = np.packbits(bit_array)
    byte_data =  byte_array.tobytes()
    secret = byte_data.decode()
    return JSONResponse({"status":"success", "data": secret})
        
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)