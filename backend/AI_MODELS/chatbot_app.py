import streamlit as st
import google.generativeai as genai
import os
from dotenv import load_dotenv
import google.generativeai as genai

# تحميل المتغيرات البيئية من ملف .env
load_dotenv()

# إعدادات الصفحة
st.set_page_config(page_title="Dentor Chatbot", page_icon="🦷")
st.title("🦷 Dentor - المساعد الذكي لطب الأسنان")

# سحب المفتاح بأمان من ملف الـ .env
api_key = os.getenv("GEMINI_API_KEY")


# التأكد إن المفتاح موجود عشان لو نسيته يديك تنبيه بدل ما الكود يضرب
if not api_key:
    st.error("⚠️ لم يتم العثور على مفتاح API. تأكد من إضافته في ملف .env")
    st.stop()

# 2. إعداد الـ System Prompt (شخصية البوت)
system_prompt = """
أنت طبيب أسنان خبير اسمك "Dentor".
مهمتك هي الإجابة على أسئلة المرضى والطلاب في مجال طب الأسنان فقط.
إذا سألك أي شخص عن شيء خارج طب الأسنان، قل: "أنا Dentor، متخصص في طب الأسنان فقط ولا أستطيع الإجابة على هذا السؤال."
يُقبل السؤال باللغة العربية أو الإنجليزية ويُرد بنفس اللغة.
"""

# تهيئة الشات في الذاكرة عشان ميقفلش لما الصفحة تعمل Refresh
if "messages" not in st.session_state:
    st.session_state.messages = []

# عرض الرسائل القديمة في الشاشة
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# استقبال سؤال جديد من المستخدم
if prompt := st.chat_input("اسأل Dentor أي سؤال في طب الأسنان..."):
    # عرض سؤال المستخدم
    st.chat_message("user").markdown(prompt)
    st.session_state.messages.append({"role": "user", "content": prompt})

    # تجهيز النص بالكامل (الشخصية + الهيستوري + السؤال الجديد) عشان الموديل يفهم السياق
    full_prompt = system_prompt + "\n\n"
    for msg in st.session_state.messages:
        role = "User" if msg["role"] == "user" else "Dentor"
        full_prompt += f"{role}: {msg['content']}\n"

    # طلب الرد من الموديل
    with st.spinner("Dentor يكتب..."):
        try:
            model = genai.GenerativeModel('gemini-2.5-flash')
            response = model.generate_content(full_prompt)
            reply = response.text
            
            # عرض الرد بتاع الموديل
            with st.chat_message("assistant"):
                st.markdown(reply)
            st.session_state.messages.append({"role": "assistant", "content": reply})
            
        except Exception as e:
            st.error(f"حدث خطأ في الاتصال: {e}")