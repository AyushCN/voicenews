import os
import requests
from newspaper import Article
from datetime import datetime
import time

class NewsLoader:
    def __init__(self):
        self.newsdata_key = os.getenv("NEWSDATA_KEY")
        self.gnews_key = os.getenv("GNEWS_KEY")
        self.thenews_key = os.getenv("THENEWS_KEY")
        self.newsapi_key = os.getenv("NEWS_API_KEY")
        
    def fetch_from_newsdata(self, topic, max_results=5):
        """Fetch news from NewsData.io"""
        try:
            url = f"https://newsdata.io/api/1/news?apikey={self.newsdata_key}&q={topic}&language=en"
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                data = response.json()
                return self._process_newsdata(data.get('results', []))
        except Exception as e:
            print(f"NewsData.io failed: {e}")
        return []
    
    def fetch_from_gnews(self, topic, max_results=5):
        """Fetch news from GNews"""
        try:
            url = f"https://gnews.io/api/v4/search?q={topic}&lang=en&token={self.gnews_key}&max={max_results}"
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                data = response.json()
                return self._process_gnews(data.get('articles', []))
        except Exception as e:
            print(f"GNews failed: {e}")
        return []
    
    def fetch_from_thenewsapi(self, topic, max_results=5):
        """Fetch news from TheNewsAPI"""
        try:
            url = f"https://api.thenewsapi.com/v1/news/all?api_token={self.thenews_key}&search={topic}&language=en&limit={max_results}"
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                data = response.json()
                return self._process_thenewsapi(data.get('data', []))
        except Exception as e:
            print(f"TheNewsAPI failed: {e}")
        return []
    
    def _process_newsdata(self, articles):
        """Process NewsData.io articles"""
        processed = []
        for article in articles:
            content = article.get('content') or article.get('description', '')
            if len(content) < 380:
                content = self._scrape_article(article.get('link'))
            
            if len(content) >= 380:
                processed.append({
                    'title': article.get('title', ''),
                    'content': content,
                    'url': article.get('link', ''),
                    'source': article.get('source_id', 'Unknown'),
                    'timestamp': datetime.now().isoformat()
                })
        return processed
    
    def _process_gnews(self, articles):
        """Process GNews articles"""
        processed = []
        for article in articles:
            content = article.get('content') or article.get('description', '')
            if len(content) < 380:
                content = self._scrape_article(article.get('url'))
            
            if len(content) >= 380:
                processed.append({
                    'title': article.get('title', ''),
                    'content': content,
                    'url': article.get('url', ''),
                    'source': article.get('source', {}).get('name', 'Unknown'),
                    'timestamp': datetime.now().isoformat()
                })
        return processed
    
    def _process_thenewsapi(self, articles):
        """Process TheNewsAPI articles"""
        processed = []
        for article in articles:
            content = article.get('description', '')
            if len(content) < 380:
                content = self._scrape_article(article.get('url'))
            
            if len(content) >= 380:
                processed.append({
                    'title': article.get('title', ''),
                    'content': content,
                    'url': article.get('url', ''),
                    'source': article.get('source', 'Unknown'),
                    'timestamp': datetime.now().isoformat()
                })
        return processed
    
    def _scrape_article(self, url):
        """Scrape full article using newspaper3k"""
        try:
            article = Article(url)
            article.download()
            article.parse()
            return article.text
        except Exception as e:
            print(f"Scraping failed for {url}: {e}")
            return ""
    
    def get_news(self, topic, max_results=5):
        """Smart multi-API fetcher with fallback"""
        print(f"Fetching news for: {topic}")
        
        # Try NewsData.io first
        articles = self.fetch_from_newsdata(topic, max_results)
        if articles:
            print(f"✓ Got {len(articles)} articles from NewsData.io")
            return articles
        
        # Fallback to GNews
        articles = self.fetch_from_gnews(topic, max_results)
        if articles:
            print(f"✓ Got {len(articles)} articles from GNews")
            return articles
        
        # Fallback to TheNewsAPI
        articles = self.fetch_from_thenewsapi(topic, max_results)
        if articles:
            print(f"✓ Got {len(articles)} articles from TheNewsAPI")
            return articles
        
        print("✗ All news sources failed")
        return []
