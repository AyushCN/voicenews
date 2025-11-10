# 🎧 Pulse AI - Setup Guide

## Prerequisites

- Python 3.8 or higher
- MongoDB installed and running
- NVIDIA GPU with CUDA support (recommended for faster TTS)
- 8GB+ RAM recommended

## Step-by-Step Installation

### 1. Install MongoDB

**Ubuntu/Debian:**
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Windows:**
Download from https://www.mongodb.com/try/download/community

### 2. Clone/Create Project Structure

Create the following folder structure:
```
pulse_ai/
├── processor.py
├── news_loader.py
├── server.py
├── requirements.txt
├── config/
│   └── secrets.env
├── templates/
│   └── index.html
└── static/
    ├── style.css
    ├── script.js
    └── audio/ (will be created automatically)
```

### 3. Install Python Dependencies

```bash
# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 4. Configure API Keys

Edit `config/secrets.env` and add your API keys:

```bash
MONGO_URI=mongodb://localhost:27017/
NEWS_API_KEY=your_newsapi_key_here
NEWSDATA_KEY=your_newsdata_key_here
GNEWS_KEY=your_gnews_key_here
THENEWS_KEY=your_thenewsapi_key_here
```

**Get free API keys from:**
- NewsAPI: https://newsapi.org/register
- NewsData.io: https://newsdata.io/register
- GNews: https://gnews.io/register
- TheNewsAPI: https://www.thenewsapi.com/register

### 5. Download AI Models (First Run Only)

The first time you run processor.py, it will automatically download:
- BART summarization models (~1.6GB)
- Coqui TTS model (~1.8GB)

This may take 10-30 minutes depending on your internet speed.

### 6. Fetch and Process News

```bash
python processor.py
```

This will:
- Fetch news articles from multiple APIs
- Generate AI summaries (short, medium, full)
- Generate audio files using TTS
- Store everything in MongoDB

### 7. Start the Web Server

```bash
python server.py
```

### 8. Open in Browser

Navigate to: http://127.0.0.1:5000

## Usage

1. Select a topic from the dropdown (Technology, Science, Sports, Business)
2. Click on any audio button:
   - **🔵 Short** - 10-15 second headline
   - **🟡 Medium** - 1-1.5 minute overview
   - **🟢 Full** - 2-3 minute detailed summary
3. Use the audio player at the bottom to control playback

## Troubleshooting

### MongoDB Connection Error
```bash
# Check if MongoDB is running
sudo systemctl status mongodb  # Linux
brew services list  # macOS
```

### CUDA/GPU Issues
If you don't have an NVIDIA GPU, edit processor.py:
```python
self.tts = TTS(
    model_name="tts_models/multilingual/multi-dataset/xtts_v2",
    gpu=False  # Change to False
)
```

### API Rate Limits
Free API tiers have limits. If one API fails, the system automatically tries the next one.

### Audio Not Playing
- Check that audio files exist in `static/audio/`
- Verify MongoDB has the correct audio paths
- Clear browser cache and reload

## Performance Tips

1. **First run takes time** - Model downloads + initial processing
2. **Subsequent runs are faster** - Models cached locally
3. **GPU acceleration** - 10-20x faster TTS with CUDA
4. **Batch processing** - Process multiple articles at once

## Updating News

Run processor.py periodically to fetch fresh news:
```bash
# Manual update
python processor.py

# Or set up a cron job (Linux/macOS)
crontab -e
# Add: 0 */6 * * * cd /path/to/pulse_ai && python processor.py
```

## Data Cleanup

Articles auto-expire after 48 hours via MongoDB TTL index. No manual cleanup needed.

## Next Steps

- Add more topics in processor.py
- Customize TTS voices
- Deploy to cloud (AWS, Render, etc.)
- Add voice command support
- Implement user personalization

## Support

For issues or questions:
1. Check MongoDB logs: `tail -f /var/log/mongodb/mongod.log`
2. Check Flask logs in the terminal
3. Verify all API keys are valid

---

**Congratulations! Your Pulse AI is ready! 🎉**
