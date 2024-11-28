from fastapi import FastAPI, File, UploadFile
import torch
import torch.nn as nn
from torchvision import transforms, models
import uvicorn
import numpy as np
from io import BytesIO
from PIL import Image
from fastapi.middleware.cors import CORSMiddleware


# Define paths and class names
MODEL_PATH = "saved_models/1.pth"  # Adjusted path
CLASS_NAMES = ['benign', 'malignant']  #classes

# Initialize FastAPI
app = FastAPI()

app.mount("/static", StaticFiles(directory="dist/assets"), name="static")

@app.get("/")
async def serve_frontend():
    return FileResponse("dist/index.html")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Device configuration
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Load the model architecture and weights
model = models.resnet18(pretrained=False)
num_ftrs = model.fc.in_features
model.fc = nn.Linear(num_ftrs, len(CLASS_NAMES))
model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
model = model.to(device)
model.eval()  # Set model to evaluation mode

# Define a transformation pipeline
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

@app.get("/ping")
async def ping():
    return "Hello, I am alive!"

def read_file_as_image(data) -> torch.Tensor:
    image = Image.open(BytesIO(data)).convert("RGB")
    image = transform(image).unsqueeze(0)  # Add batch dimension
    return image.to(device)

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # Read and process the image
    image = read_file_as_image(await file.read())
    
    # Perform prediction
    with torch.no_grad():
        outputs = model(image)
        probabilities = torch.softmax(outputs[0], dim=0)
        predicted_class = CLASS_NAMES[probabilities.argmax().item()]
        confidence = probabilities.max().item()
    
    # Return prediction results
    return {"class": predicted_class, "confidence": confidence}

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)
