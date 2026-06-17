import urllib.request
import json
import sys

# Force UTF-8 output so Arabic characters print correctly on Windows
sys.stdout.reconfigure(encoding='utf-8')

data = json.dumps({
    "inputs": "The mitral valve prevents backflow of blood during systole. It is located between the left atrium and left ventricle."
}).encode("utf-8")

req = urllib.request.Request(
    "https://medodeyaa--dentor-helsinki-helsinkitranslator-translate.modal.run",
    data=data,
    headers={"Content-Type": "application/json"}
)

try:
    response = urllib.request.urlopen(req)
    result = json.loads(response.read().decode("utf-8"))
    print("Translation result:")
    print(result.get("translation_text", "NO TRANSLATION"))
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.read().decode())
except Exception as e:
    print("Error:", e)
