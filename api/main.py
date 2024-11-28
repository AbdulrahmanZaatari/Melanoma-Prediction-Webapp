from fastapi import FastAPI, File, UploadFile
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import torch
import torch.nn as nn
from torchvision import transforms, models
import uvicorn
import numpy as np
from io import BytesIO
from PIL import Image
from fastapi.middleware.cors import CORSMiddleware
import os

# Define paths and class names
MODEL_PATH = "saved_models/1.pth"  # Adjusted path for the model file
CLASS_NAMES = ['benign', 'malignant']  # Define your class names

# Initialize FastAPI app
app = FastAPI()

# Middleware for CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins or specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files for the React frontend
app.mount("/static", StaticFiles(directory="dist/assets"), name="static")

@app.get("/")
async def serve_frontend():
    """Serve the React app's main entry file."""
    return FileResponse("dist/index.html")

# Device configuration (CPU/GPU)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Load the model architecture and weights
model = models.resnet18(pretrained=False)
num_ftrs = model.fc.in_features
model.fc = nn.Linear(num_ftrs, len(CLASS_NAMES))  # Adjust output layer to match the number of classes
model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
model = model.to(device)
model.eval()  # Set the model to evaluation mode

# Define a transformation pipeline for preprocessing images
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])  # Normalize to ImageNet mean/std
])

@app.get("/ping")
async def ping():
    """Health check endpoint."""
    return {"message": "Hello, I am alive!"}

def read_file_as_image(data) -> torch.Tensor:
    """Read an image file as a PyTorch tensor."""
    image = Image.open(BytesIO(data)).convert("RGB")
    image = transform(image).unsqueeze(0)  # Add batch dimension
    return image.to(device)

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """Predict the class of the uploaded image."""
    # Read and preprocess the image
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
    port = int(os.getenv("PORT", 8000))  # Default to 8000 if PORT is not set
    uvicorn.run(app, host="0.0.0.0", port=port)
