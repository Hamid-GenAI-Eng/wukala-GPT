import os  
root = 'C:\\My working\\HamidTech_Ventures\\My_products\\Wukala-GPT\\Wukala-GPT.Backend\\WukalaGPT.API\\Controllers'  
controllers = ['AiChatController.cs', 'CaseIntelligenceController.cs', 'VirtualMunshiController.cs']  
for c in controllers:  
    p = os.path.join(root, c)  
    with open(p, 'r', encoding='utf-8') as f: content = f.read()  
    if '[EnableRateLimiting(\" "AiLimiter\)]' not in content:  
        content = content.replace('[Authorize]', '[Authorize]\n    [EnableRateLimiting(\AiLimiter\)]')  
        if 'using Microsoft.AspNetCore.RateLimiting;' not in content:  
            content = 'using Microsoft.AspNetCore.RateLimiting;\n' + content  
        with open(p, 'w', encoding='utf-8') as f: f.write(content)  
