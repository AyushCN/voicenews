// Global variables
let currentTopic = 'technology';
const audioPlayer = document.getElementById('audioPlayer');
const trackTitle = document.getElementById('trackTitle');
const newsContainer = document.getElementById('newsContainer');
const statusBar = document.getElementById('statusBar');
const topicSelector = document.getElementById('topicSelector');
const refreshBtn = document.getElementById('refreshBtn');

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadNews(currentTopic);
    
    // Topic selector change
    topicSelector.addEventListener('change', (e) => {
        currentTopic = e.target.value;
        loadNews(currentTopic);
    });
    
    // Refresh button
    refreshBtn.addEventListener('click', () => {
        loadNews(currentTopic);
    });
    
    // Voice toggle button - show/hide help card
    document.getElementById('voiceToggle').addEventListener('click', () => {
        const helpCard = document.getElementById('voiceHelpCard');
        if (window.voiceHandler && voiceHandler.isEnabled) {
            helpCard.style.display = 'block';
        } else {
            helpCard.style.display = 'none';
        }
    });
    
    // Audio player events
    audioPlayer.addEventListener('ended', () => {
        trackTitle.textContent = 'Playback finished';
    });
    
    audioPlayer.addEventListener('error', () => {
        trackTitle.textContent = 'Error loading audio';
        statusBar.className = 'alert alert-danger';
        statusBar.textContent = 'Failed to load audio file';
    });
});

// Load news from backend
async function loadNews(topic) {
    try {
        statusBar.className = 'alert alert-info loading';
        statusBar.textContent = `Loading ${topic} news...`;
        newsContainer.innerHTML = '';
        
        const response = await fetch(`/get_news?topic=${topic}`);
        const data = await response.json();
        
        if (data.success && data.articles.length > 0) {
            displayNews(data.articles);
            statusBar.className = 'alert alert-success';
            statusBar.textContent = `✓ Loaded ${data.count} ${topic} articles`;
        } else {
            statusBar.className = 'alert alert-warning';
            statusBar.textContent = `No ${topic} news available. Run processor.py to fetch news.`;
        }
    } catch (error) {
        console.error('Error loading news:', error);
        statusBar.className = 'alert alert-danger';
        statusBar.textContent = 'Error connecting to server. Make sure server.py is running.';
    }
}

// Display news articles
function displayNews(articles) {
    newsContainer.innerHTML = '';
    
    articles.forEach((article, index) => {
        const card = createNewsCard(article, index);
        newsContainer.appendChild(card);
    });
    
    // Update voice handler with new articles
    if (window.voiceHandler) {
        voiceHandler.updateArticles(articles);
    }
}

// Create individual news card
function createNewsCard(article, index) {
    const col = document.createElement('div');
    col.className = 'col-12';
    
    col.innerHTML = `
        <div class="news-card">
            <h3 class="news-card-title">${article.title}</h3>
            
            <div class="news-card-meta">
                <span>📰 ${article.source}</span>
                <span>📅 ${new Date(article.timestamp).toLocaleDateString()}</span>
                <span>🔗 <a href="${article.url}" target="_blank" class="text-decoration-none">Read full article</a></span>
            </div>
            
            <p class="news-card-summary">${article.summary_short}</p>
            
            <div class="audio-controls">
                <button class="btn btn-audio btn-audio-short" onclick="playAudio('${article.audio_short}', '${article.title}', 'Short')">
                    🔵 Short (10-15s)
                </button>
                <button class="btn btn-audio btn-audio-medium" onclick="playAudio('${article.audio_medium}', '${article.title}', 'Medium')">
                    🟡 Medium (1-1.5min)
                </button>
                <button class="btn btn-audio btn-audio-full" onclick="playAudio('${article.audio_full}', '${article.title}', 'Full')">
                    🟢 Full (2-3min)
                </button>
            </div>
        </div>
    `;
    
    return col;
}

// Play audio function
function playAudio(audioPath, title, type) {
    // Update player
    audioPlayer.src = audioPath;
    audioPlayer.play();
    
    // Update now playing info
    trackTitle.textContent = `${title} - ${type} Version`;
    
    // Update status bar
    statusBar.className = 'alert alert-info';
    statusBar.textContent = `🎧 Now playing: ${type} version`;
    
    // Scroll to player
    document.querySelector('.audio-player-fixed').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
    });
}

// Auto-play first article on load (optional)
function autoPlayFirstArticle() {
    const firstShortButton = document.querySelector('.btn-audio-short');
    if (firstShortButton) {
        setTimeout(() => {
            firstShortButton.click();
        }, 500);
    }
}
