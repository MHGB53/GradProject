"""
inspect_checkpoint.py
Run this to see exactly what's stored in dental_xray_fag_feshikh.pth
so we can configure the router correctly.

Usage:  python inspect_checkpoint.py
"""
import torch, os

PATH = os.path.join(os.path.dirname(__file__), "dental_xray_fag_feshikh.pth")
print(f"Loading: {PATH}")

checkpoint = torch.load(PATH, map_location="cpu")

print(f"\n--- Type: {type(checkpoint)} ---")

if isinstance(checkpoint, dict):
    print(f"Keys in checkpoint: {list(checkpoint.keys())}")
    # Check if it's a raw state_dict (keys are layer names)
    sample_keys = list(checkpoint.keys())[:6]
    print(f"Sample keys: {sample_keys}")
    # Look for embedded class names
    for k in checkpoint.keys():
        if 'class' in k.lower() or 'label' in k.lower() or 'name' in k.lower():
            print(f"  >> Possible class info key: {k} → {checkpoint[k]}")
elif isinstance(checkpoint, torch.nn.Module):
    print("Checkpoint is a full nn.Module (torch.save(model, ...))")
    # Try to get fc output size
    if hasattr(checkpoint, 'fc'):
        print(f"  FC layer: {checkpoint.fc}")
    if hasattr(checkpoint, 'class_names'):
        print(f"  class_names: {checkpoint.class_names}")
else:
    print(f"Unknown type: {type(checkpoint)}")

# Check FC layer output size (number of classes)
if isinstance(checkpoint, dict):
    fc_weight_key = next((k for k in checkpoint.keys() if 'fc.weight' in k), None)
    if fc_weight_key:
        shape = checkpoint[fc_weight_key].shape
        print(f"\nFC weight shape: {shape}  →  num_classes = {shape[0]}")
    else:
        print("\nCould not find fc.weight in state dict keys.")

print("\nDone.")
