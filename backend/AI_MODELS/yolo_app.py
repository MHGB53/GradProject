import streamlit as st
from ultralytics import YOLO
from PIL import Image
import cv2
import numpy as np

# إعدادات الصفحة
st.set_page_config(page_title="Dentor - YOLO Detection", page_icon="🦷")
st.title("🦷 Dentor - فحص الأشعة الدقيق (YOLOv8)")
st.write("ارفع صورة الأشعة وسيقوم النظام بتحديد أماكن المشاكل (مثل التسوس) بمربعات ملونة.")

# 1. تحميل الموديل (تأكد إن اسم الملف هنا هو نفس اسم الملف اللي إنت حملته)
@st.cache_resource
def load_yolo_model():
    # لو الملف اللي حملته اسمه مختلف، غيره هنا
    return YOLO("best.pt") 

model = load_yolo_model()

# 2. رفع الصورة
uploaded_file = st.file_uploader("ارفع صورة الأشعة (JPG, PNG)", type=["jpg", "jpeg", "png"])

if uploaded_file is not None:
    # قراءة الصورة وعرضها
    image = Image.open(uploaded_file).convert("RGB")
    
    col1, col2 = st.columns(2)
    with col1:
        st.write("### الصورة الأصلية")
        st.image(image, use_column_width=True)

    if st.button("🔍 ابدأ الفحص"):
        with st.spinner("جاري الفحص الدقيق..."):
            
            # تحويل الصورة لصيغة يقبلها الموديل
            img_array = np.array(image)
            
            # عمل التوقع
            results = model.predict(img_array, conf=.02 )
            
            # استخراج الصورة مرسوم عليها المربعات (Bounding Boxes)
            res_plotted = results[0].plot()
            
            # تعديل الألوان عشان تظهر صح في المتصفح
            res_plotted = cv2.cvtColor(res_plotted, cv2.COLOR_BGR2RGB)
            
            # عرض النتيجة النهائية
            with col2:
                st.write("### نتيجة الفحص")
                st.image(res_plotted, use_column_width=True)
                
            st.success("✅ تم الفحص بنجاح!")