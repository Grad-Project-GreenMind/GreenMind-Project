import gradio as gr
import torch
import timm
import json
from torchvision import transforms
from PIL import Image

# Settings
MODEL_PATH = 'plant_disease_efficientnet_B3 (2).pth'
JSON_PATH  = 'plant_diseases_info_en.json'
DEVICE     = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# Load Model
checkpoint = torch.load(MODEL_PATH, map_location=DEVICE)
class_names = checkpoint['class_names']
model = timm.create_model('efficientnet_b3', pretrained=False, num_classes=38)
model.load_state_dict(checkpoint['model_state_dict'])
model = model.to(DEVICE)
model.eval()

# Load Database
with open(JSON_PATH, 'r') as f:
    data = json.load(f)
disease_db = {d['label']: d for d in data['diseases']}

# Transforms & TTA
transform = transforms.Compose([
    transforms.Resize((300, 300)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

def apply_tta(img):
    versions = [
        transform(img),
        transform(transforms.functional.hflip(img)),
        transform(transforms.functional.vflip(img)),
        transform(transforms.functional.rotate(img, 15)),
        transform(transforms.functional.rotate(img, -15)),
    ]
    return torch.stack(versions).to(DEVICE)

# Predict Function
def predict(image):
    img = image.convert('RGB')
    tta_batch = apply_tta(img)
    with torch.no_grad():
        outputs   = model(tta_batch)
        probs     = torch.softmax(outputs, dim=1)
        avg_probs = probs.mean(dim=0)

    top_idx = torch.argmax(avg_probs).item()
    label   = class_names[top_idx]
    info    = disease_db.get(label)
    
    if info:
        return f"Disease: {info['disease_name']}\nPlant: {info['plant']}\nTreatment: {info['treatment']}"
    return "Detection failed."

# Gradio Interface
interface = gr.Interface(
    fn=predict, 
    inputs=gr.Image(type="pil"), 
    outputs="text",
    title="Plant Disease Detection",
    description="Upload a leaf image to detect diseases."
)

if __name__ == "__main__":
    interface.launch()