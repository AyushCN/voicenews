import os
from transformers import pipeline
from TTS.api import TTS
from pymongo import MongoClient
from datetime import datetime
from dotenv import load_dotenv
from news_loader import NewsLoader
import uuid

# Load environment variables
load_dotenv("config/secrets.env")

class PulseAIProcessor:
    def __init__(self):
        # Initialize MongoDB
        mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
        self.client = MongoClient(mongo_uri)
        self.db = self.client['pulse_ai']
        self.collection = self.db['news']
        
        # Create TTL index for auto-cleanup after 2 days
        self.collection.create_index("timestamp", expireAfterSeconds=2*24*60*60)
        
        # Initialize summarizers
        print("Loading summarization models...")
        self.summarizer_short = pipeline("summarization", model="facebook/bart-large-xsum")
        self.summarizer_detailed = pipeline("summarization", model="facebook/bart-large-cnn")
        
        # Initialize TTS
        print("Loading TTS model...")
        self.tts = TTS(
            model_name="tts_models/multilingual/multi-dataset/xtts_v2",
            gpu=True
        )
        
        # Initialize news loader
        self.news_loader = NewsLoader()
        
        # Create audio directory
        os.makedirs("static/audio", exist_ok=True)
    
    def generate_summary(self, text, summary_type="short"):
        """Generate AI summary"""
        try:
            if summary_type == "short":
                # 10-15 seconds (headline style)
                summary = self.summarizer_short(
                    text,
                    max_length=50,
                    min_length=20,
                    do_sample=False
                )[0]['summary_text']
            elif summary_type == "medium":
                # 1-1.5 minutes
                summary = self.summarizer_detailed(
                    text,
                    max_length=150,
                    min_length=80,
                    do_sample=False
                )[0]['summary_text']
            else:  # full
                # 2-3 minutes
                summary = self.summarizer_detailed(
                    text,
                    max_length=300,
                    min_length=150,
                    do_sample=False
                )[0]['summary_text']
            
            return summary
        except Exception as e:
            print(f"Summarization error ({summary_type}): {e}")
            return text[:500] if summary_type == "full" else text[:200]
    
    def generate_audio(self, text, output_path):
        """Generate audio using Coqui TTS"""
        try:
            self.tts.tts_to_file(
                text=text,
                speaker="Ana Florence",
                language="en",
                file_path=output_path
            )
            return True
        except Exception as e:
            print(f"TTS error: {e}")
            return False
    
    def process_article(self, article, topic):
        """Process single article: summarize + generate audio"""
        try:
            title = article['title']
            content = article['content']
            
            print(f"\nProcessing: {title[:50]}...")
            
            # Generate summaries
            summary_short = self.generate_summary(content, "short")
            summary_medium = self.generate_summary(content, "medium")
            summary_full = self.generate_summary(content, "full")
            
            # Generate unique IDs for audio files
            audio_id_short = str(uuid.uuid4())
            audio_id_medium = str(uuid.uuid4())
            audio_id_full = str(uuid.uuid4())
            
            # Generate audio files
            audio_path_short = f"static/audio/{audio_id_short}.wav"
            audio_path_medium = f"static/audio/{audio_id_medium}.wav"
            audio_path_full = f"static/audio/{audio_id_full}.wav"
            
            print("  Generating audio files...")
            self.generate_audio(summary_short, audio_path_short)
            self.generate_audio(summary_medium, audio_path_medium)
            self.generate_audio(summary_full, audio_path_full)
            
            # Store in MongoDB
            doc = {
                "topic": topic,
                "date": datetime.now().strftime("%Y-%m-%d"),
                "title": title,
                "summary_short": summary_short,
                "summary_medium": summary_medium,
                "summary_full": summary_full,
                "audio_short": f"/static/audio/{audio_id_short}.wav",
                "audio_medium": f"/static/audio/{audio_id_medium}.wav",
                "audio_full": f"/static/audio/{audio_id_full}.wav",
                "url": article['url'],
                "source": article['source'],
                "timestamp": datetime.now()
            }
            
            self.collection.insert_one(doc)
            print("  ✓ Saved to database")
            
        except Exception as e:
            print(f"Error processing article: {e}")
    
    def process_topic(self, topic, max_articles=5):
        """Fetch and process news for a topic"""
        print(f"\n{'='*60}")
        print(f"Processing topic: {topic.upper()}")
        print(f"{'='*60}")
        
        # Fetch news
        articles = self.news_loader.get_news(topic, max_articles)
        
        if not articles:
            print("No articles found!")
            return
        
        # Process each article
        for i, article in enumerate(articles, 1):
            print(f"\n[{i}/{len(articles)}]")
            self.process_article(article, topic)
        
        print(f"\n✓ Completed processing {len(articles)} articles for {topic}")

def main():
    """Main execution"""
    processor = PulseAIProcessor()
    
    # Topics to process
    topics = ["technology", "science", "sports", "business"]
    
    for topic in topics:
        processor.process_topic(topic, max_articles=3)
    
    print("\n" + "="*60)
    print("ALL TOPICS PROCESSED SUCCESSFULLY!")
    print("="*60)

if __name__ == "__main__":
    main()
