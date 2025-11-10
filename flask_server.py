from flask import Flask, render_template, jsonify, send_from_directory, request
from pymongo import MongoClient
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv("config/secrets.env")

app = Flask(__name__)

# MongoDB connection
mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
client = MongoClient(mongo_uri)
db = client['pulse_ai']
collection = db['news']

@app.route('/')
def index():
    """Serve the main page"""
    return render_template('index.html')

@app.route('/get_news')
def get_news():
    """Get news articles for a specific topic"""
    topic = request.args.get('topic', 'technology')
    
    # Fetch articles from MongoDB
    articles = list(collection.find(
        {'topic': topic},
        {'_id': 0}  # Exclude MongoDB ID
    ).sort('timestamp', -1).limit(10))
    
    return jsonify({
        'success': True,
        'articles': articles,
        'count': len(articles)
    })

@app.route('/topics')
def get_topics():
    """Get all available topics"""
    topics = collection.distinct('topic')
    return jsonify({
        'success': True,
        'topics': topics
    })

@app.route('/static/audio/<path:filename>')
def serve_audio(filename):
    """Serve audio files"""
    return send_from_directory('static/audio', filename)

@app.route('/health')
def health():
    """Health check endpoint"""
    try:
        # Check MongoDB connection
        collection.find_one()
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print("="*60)
    print("🎧 PULSE AI SERVER STARTING...")
    print("="*60)
    print(f"Server running at: http://127.0.0.1:5000")
    print(f"Available topics: {collection.distinct('topic')}")
    print("="*60)
    app.run(debug=True, host='0.0.0.0', port=5000)
