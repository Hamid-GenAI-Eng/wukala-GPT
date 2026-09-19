import os
import re

root = r'C:\My working\HamidTech_Ventures\My_products\Wukala-GPT\Wukala-GPT.Backend\WukalaGPT.API\Controllers'

for f in os.listdir(root):
    if f.endswith('.cs'):
        p = os.path.join(root, f)
        with open(p, 'r', encoding='utf-8') as file:
            content = file.read()
            
        modified = False
        
        if '[Route("api/[controller]")]' in content:
            content = content.replace('[Route("api/[controller]")]', '[ApiVersion("1.0")]\n    [Route("api/v{version:apiVersion}/[controller]")]')
            modified = True
            
        if 'namespace WukalaGPT.API.Controllers' in content and 'using Asp.Versioning;' not in content:
            content = content.replace('namespace WukalaGPT.API.Controllers', 'using Asp.Versioning;\n\nnamespace WukalaGPT.API.Controllers')
            modified = True
            
        if modified:
            with open(p, 'w', encoding='utf-8') as file:
                file.write(content)
            print(f"Updated {f}")
