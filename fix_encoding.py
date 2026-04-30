import pathlib, sys

TARGET = pathlib.Path("html/aIdiagnosis.html")
data = TARGET.read_bytes()

garbled1 = bytes.fromhex("c3b0c5b8e2809dc28d")
correct1 = "\U0001f50d".encode("utf-8")   # magnifying glass

garbled2 = bytes.fromhex("c3b0c5b8c28fc2a5")
correct2 = "\U0001f3e5".encode("utf-8")   # hospital

changes = 0
if garbled1 in data:
    data = data.replace(garbled1, correct1)
    print("Fixed: periapical xtype-icon (magnifier)")
    changes += 1

if garbled2 in data:
    data = data.replace(garbled2, correct2)
    print("Fixed: History Matters header (hospital)")
    changes += 1

TARGET.write_bytes(data)
print("Done.", changes, "fixes applied.")

remaining = data.count(bytes.fromhex("c3b0"))
print("Remaining garbled 0xC3B0 sequences:", remaining)
