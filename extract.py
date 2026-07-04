import pandas as pd
import json

try:
    df = pd.read_excel('Mentor - II CSE  A.xlsx')
    data = df.to_dict(orient='records')
    print(json.dumps(data[:5], indent=2))
except Exception as e:
    print(e)
