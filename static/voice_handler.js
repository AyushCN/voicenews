// Voice Command Handler for Pulse AI
class VoiceCommandHandler {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.currentArticleIndex = 0;
        this.articles = [];
        this.lastPlayedType = 'short';
        this.isEnabled = false;
        
        this.commands = {
            'next': () => this.playNext(),
            'previous': () => this.playPrevious(),
            'back': () => this.playPrevious(),
            'more': () => this.playMore(),
            'full': () => this.playFull(),
            'short': () => this.playShort(),
            'medium': () => this.playMedium(),
            'pause': () => this.pauseAudio(),
            'play': () => this.resumeAudio(),
            'resume': () => this.resumeAudio(),
            'stop': () => this.stopAudio(),
            'quit': () => this.stopAudio(),
            'repeat': () => this.repeatCurrent(),
            'again': () => this.repeatCurrent(),
            'help': () => this.showHelp()
        };
        
        this.initializeRecognition();
        this.setupAudioListeners();
    }
    
    initializeRecognition() {
        // Check browser support
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.error('Speech recognition not supported');
            this.showNotification('Voice commands not supported in this browser', 'warning');
            return;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 3;
        
        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase().trim();
            console.log('Voice command detected:', transcript);
            this.processCommand(transcript);
        };
        
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (event.error !== 'no-speech' && event.error !== 'aborted') {
                this.showNotification(`Voice error: ${event.error}`, 'danger');
            }
        };
        
        this.recognition.onend = () => {
            this.isListening = false;
            this.updateVoiceStatus('Ready for command');
            
            // Auto-restart listening when paused if enabled
            if (this.isEnabled && audioPlayer.paused && !audioPlayer.ended) {
                setTimeout(() => this.startListening(), 500);
            }
        };
    }
    
    setupAudioListeners() {
        audioPlayer.addEventListener('pause', () => {
            if (this.isEnabled && !audioPlayer.ended) {
                this.showNotification('🎤 Voice commands active. Say a command...', 'info');
                setTimeout(() => this.startListening(), 300);
            }
        });
        
        audioPlayer.addEventListener('play', () => {
            this.stopListening();
        });
        
        audioPlayer.addEventListener('ended', () => {
            if (this.isEnabled) {
                this.showNotification('🎤 Say "next" or "repeat"', 'info');
                setTimeout(() => this.startListening(), 500);
            }
        });
    }
    
    startListening() {
        if (!this.recognition || this.isListening) return;
        
        try {
            this.recognition.start();
            this.isListening = true;
            this.updateVoiceStatus('🎤 Listening...');
        } catch (error) {
            console.error('Error starting recognition:', error);
        }
    }
    
    stopListening() {
        if (!this.recognition || !this.isListening) return;
        
        try {
            this.recognition.stop();
            this.isListening = false;
            this.updateVoiceStatus('Voice inactive');
        } catch (error) {
            console.error('Error stopping recognition:', error);
        }
    }
    
    processCommand(transcript) {
        // Check for command matches
        for (const [command, action] of Object.entries(this.commands)) {
            if (transcript.includes(command)) {
                this.showNotification(`✓ Command: "${command}"`, 'success');
                action();
                return;
            }
        }
        
        this.showNotification(`❓ Unknown command: "${transcript}"`, 'warning');
        this.showHelp();
    }
    
    // Command Actions
    playNext() {
        this.currentArticleIndex = (this.currentArticleIndex + 1) % this.articles.length;
        this.playCurrentArticle(this.lastPlayedType);
    }
    
    playPrevious() {
        this.currentArticleIndex = (this.currentArticleIndex - 1 + this.articles.length) % this.articles.length;
        this.playCurrentArticle(this.lastPlayedType);
    }
    
    playMore() {
        // Upgrade from short -> medium -> full
        if (this.lastPlayedType === 'short') {
            this.playCurrentArticle('medium');
        } else if (this.lastPlayedType === 'medium') {
            this.playCurrentArticle('full');
        } else {
            this.showNotification('Already playing full version', 'info');
        }
    }
    
    playFull() {
        this.playCurrentArticle('full');
    }
    
    playShort() {
        this.playCurrentArticle('short');
    }
    
    playMedium() {
        this.playCurrentArticle('medium');
    }
    
    pauseAudio() {
        audioPlayer.pause();
        this.showNotification('⏸️ Paused', 'info');
    }
    
    resumeAudio() {
        audioPlayer.play();
        this.showNotification('▶️ Resumed', 'success');
    }
    
    stopAudio() {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        trackTitle.textContent = 'Stopped';
        this.showNotification('⏹️ Stopped', 'info');
        this.stopListening();
    }
    
    repeatCurrent() {
        audioPlayer.currentTime = 0;
        audioPlayer.play();
        this.showNotification('🔁 Repeating', 'info');
    }
    
    playCurrentArticle(type) {
        if (!this.articles[this.currentArticleIndex]) {
            this.showNotification('No articles loaded', 'warning');
            return;
        }
        
        const article = this.articles[this.currentArticleIndex];
        const audioPath = article[`audio_${type}`];
        
        playAudio(audioPath, article.title, type.charAt(0).toUpperCase() + type.slice(1));
        this.lastPlayedType = type;
    }
    
    showHelp() {
        const helpText = `
Available Voice Commands:
• "Next" - Next article
• "Previous/Back" - Previous article
• "More" - Longer version
• "Full" - Full story
• "Short/Medium" - Shorter versions
• "Pause/Stop" - Pause audio
• "Play/Resume" - Resume audio
• "Repeat/Again" - Replay current
• "Help" - Show this help
        `;
        console.log(helpText);
        this.showNotification('Voice commands listed in console', 'info');
    }
    
    updateArticles(articles) {
        this.articles = articles;
        this.currentArticleIndex = 0;
    }
    
    enable() {
        this.isEnabled = true;
        document.getElementById('voiceToggle').classList.add('active');
        this.showNotification('🎤 Voice commands enabled', 'success');
        
        // Start listening if audio is paused
        if (audioPlayer.paused && audioPlayer.src) {
            setTimeout(() => this.startListening(), 300);
        }
    }
    
    disable() {
        this.isEnabled = false;
        this.stopListening();
        document.getElementById('voiceToggle').classList.remove('active');
        this.showNotification('🔇 Voice commands disabled', 'info');
    }
    
    toggle() {
        if (this.isEnabled) {
            this.disable();
        } else {
            this.enable();
        }
    }
    
    updateVoiceStatus(text) {
        const statusElement = document.getElementById('voiceStatus');
        if (statusElement) {
            statusElement.textContent = text;
        }
    }
    
    showNotification(message, type = 'info') {
        statusBar.className = `alert alert-${type}`;
        statusBar.textContent = message;
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            if (statusBar.textContent === message) {
                statusBar.className = 'alert alert-info';
                statusBar.textContent = 'Ready';
            }
        }, 3000);
    }
}

// Initialize voice handler globally
let voiceHandler = null;

document.addEventListener('DOMContentLoaded', () => {
    voiceHandler = new VoiceCommandHandler();
    
    // Add voice toggle button click handler
    document.getElementById('voiceToggle').addEventListener('click', () => {
        voiceHandler.toggle();
    });
});
