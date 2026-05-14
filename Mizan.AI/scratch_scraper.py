import cloudscraper
from bs4 import BeautifulSoup
import json

def fetch_legaldocs():
    scraper = cloudscraper.create_scraper()
    url = "https://www.legaldocs.pk/"
    print(f"Fetching {url}...")
    response = scraper.get(url)
    
    if response.status_code == 200:
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Try to find categories or template links
        links = soup.find_all('a', href=True)
        doc_links = [l['href'] for l in links if '/document' in l['href'] or '/template' in l['href'] or 'legaldocs.pk' in l['href']]
        
        # Find category menus if any
        categories = []
        nav_items = soup.find_all(['li', 'div', 'a'])
        for item in nav_items:
            text = item.get_text(strip=True)
            if text and len(text) < 50:
                categories.append(text)
                
        print("--- Status: Success ---")
        print(f"Found {len(links)} total links.")
        print("Sample Doc Links:")
        for l in list(set(doc_links))[:10]:
            print("  ", l)
            
        print("\nPossible Categories:")
        for c in list(set(categories))[:20]:
            print("  ", c)
            
        # Try to find main content structure
        main_content = soup.find('main') or soup.find(id='content') or soup.find('body')
        if main_content:
            text_preview = main_content.get_text(separator=' ', strip=True)[:500]
            print("\nPreview of main content:")
            print(text_preview)
    else:
        print(f"Failed with status code: {response.status_code}")
        print(response.text[:500])

if __name__ == "__main__":
    fetch_legaldocs()
