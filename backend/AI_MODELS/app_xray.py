# ---
# title: app_xray
# description: X-Ray Model API
# show-code: false
# ---
import mercury as mr
import base64

# 1. نستقبل الصورة كنص بدل ما نستخدم mr.File اللي بيعمل مشاكل
file_b64 = mr.Text(label="file_b64", value="")
file_name = mr.Text(label="file_name", value="uploaded_file.png")

if file_b64.value:
    # 2. بنشيل الزيادات من النص ونحوله لبيانات حقيقية
    b64_string = file_b64.value.split(',')[1] if ',' in file_b64.value else file_b64.value
    
    # 3. بنحفظ الملف على الجهاز باسمه الأصلي
    save_path = file_name.value
    with open(save_path, "wb") as f:
        f.write(base64.b64decode(b64_string))
        
    # ⚠️ الآن: الملف موجود على الجهاز باسم save_path
    # تقدر تباصي الـ save_path للموديل بتاعك عشان يقراه ويطلع النتيجة!
    # مثال: results = model.predict(save_path)


import streamlit as st
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import numpy as np

# إعدادات الصفحة
st.set_page_config(page_title="Dental X-Ray Diagnostic", page_icon="🦷")
st.title("🦷 نظام تحليل أشعة الأسنان الذكي")

# 1. تعريف الجهاز (استخدام الـ GPU لو متاح، وإنت عندك RTX 3060 فهيكون سريع جداً)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# 2. تحميل الموديل (ResNet-50 مع 31 مخرج كما استنتجنا سابقاً)
@st.cache_resource
def load_xray_model():
    model = models.resnet50()
    num_ftrs = model.fc.in_features
    model.fc = nn.Linear(num_ftrs, 31) # تأكد من أن العدد 31 مطابق لأوزانك
    
    # تحميل الأوزان
    try:
        state_dict = torch.load("dental_xray_features.pt", map_location=device)
        model.load_state_dict(state_dict)
        model.to(device)
        model.eval()
        return model
    except Exception as e:
        st.error(f"خطأ في تحميل ملف الأوزان: {e}")
        return None

model = load_xray_model()

# 3. تجهيز الصور (Preprocessing) بنفس الطريقة اللي اتدرب عليها الموديل
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

# قائمة التشخيصات (عدلها لتطابق الـ 31 كلاس بتوعك بالترتيب)
class_names = [
    "Cavity", "Impacted Tooth", "Bone Defect", "Maxillary Sinus", "Filling",
    # ... أكمل باقي الـ 31 اسم هنا بالترتيب الصحيح ...
]

# 4. واجهة المستخدم
uploaded_file = st.file_uploader("ارفع صورة الأشعة (JPG, PNG)", type=["jpg", "jpeg", "png"])

if uploaded_file is not None:
    # عرض الصورة المرفوعة
    image = Image.open(uploaded_file).convert('RGB')
    st.image(image, caption='الأشعة المرفوعة', use_column_width=True)
    
    if st.button("بدء التحليل 🔍"):
        with st.spinner('جاري تحليل الصورة...'):
            # معالجة الصورة
            img_tensor = transform(image).unsqueeze(0).to(device)
            
            # التوقع
            with torch.no_grad():
                outputs = model(img_tensor)
                # استخدام Sigmoid لو الموديل Multi-label أو Softmax لو Multi-class
                probs = torch.sigmoid(outputs)[0] 
                
            # عرض النتائج اللي ثقتها أعلى من 50%
            st.subheader("نتائج الفحص التقديرية:")
            found = False
            for i, prob in enumerate(probs):
                if prob > 0.5: # حد الثقة (Threshold)
                    label = class_names[i] if i < len(class_names) else f"Class {i}"
                    st.write(f"✅ **{label}**: {prob*100:.2f}%")
                    found = True
            
            if not found:
                st.info("لم يتم اكتشاف مشكلات واضحة بناءً على حد الثقة الحالي.")