import sys
t = open(sys.argv[1], encoding="utf-8").read()
print("file len:", len(t))
i = t.find("Error details")
print(t[i:i+260])
seg_i = t.find("Page snapshot")
seg = t[seg_i:seg_i + 5200]
for line in seg.split("\n"):
    if any(k in line for k in ["Deposit", "error", "failed", 'button "', "position", "token", "nvda"]):
        print(line.strip()[:140])
