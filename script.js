// URL Shortener JavaScript
class URLShortener {
    constructor() {
        this.history = this.loadHistory();
        this.initializeElements();
        this.bindEvents();
        this.renderHistory();
    }

    initializeElements() {
        this.form = document.getElementById('shortenForm');
        this.urlInput = document.getElementById('originalUrl');
        this.submitBtn = document.getElementById('shortenBtn');
        this.btnText = this.submitBtn.querySelector('.btn-text');
        this.btnLoading = this.submitBtn.querySelector('.btn-loading');
        this.errorMessage = document.getElementById('urlError');
        
        this.resultCard = document.getElementById('resultCard');
        this.shortUrlDisplay = document.getElementById('shortUrl');
        this.originalUrlDisplay = document.getElementById('originalUrlDisplay');
        this.copyBtn = document.getElementById('copyBtn');
        this.copyIcon = this.copyBtn.querySelector('.copy-icon');
        this.checkIcon = this.copyBtn.querySelector('.check-icon');
        this.copyText = this.copyBtn.querySelector('.copy-text');
        this.copiedText = this.copyBtn.querySelector('.copied-text');
        
        this.historyContainer = document.getElementById('historyContainer');
        this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
        
        this.toast = document.getElementById('toast');
        this.toastMessage = document.getElementById('toastMessage');
    }

    bindEvents() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.copyBtn.addEventListener('click', () => this.copyToClipboard());
        this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        this.urlInput.addEventListener('input', () => this.clearError());
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const url = this.urlInput.value.trim();
        if (!this.validateUrl(url)) {
            return;
        }

        this.setLoading(true);
        this.clearError();

        try {
            const result = await this.shortenUrl(url);
            this.displayResult(result);
            this.addToHistory(result);
            this.form.reset();
            this.showToast('URL shortened successfully!', 'success');
        } catch (error) {
            this.showError(error.message);
            this.showToast(error.message, 'error');
        } finally {
            this.setLoading(false);
        }
    }

    validateUrl(url) {
        if (!url) {
            this.showError('Please enter a URL');
            return false;
        }

        try {
            new URL(url);
            return true;
        } catch {
            this.showError('Please enter a valid URL starting with http:// or https://');
            return false;
        }
    }

    async shortenUrl(originalUrl) {
        try {
            // Using TinyURL API directly
            const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(originalUrl)}`);
            
            if (!response.ok) {
                throw new Error('Failed to connect to TinyURL service');
            }
            
            const shortUrl = await response.text();
            
            if (shortUrl.includes('Error') || !shortUrl.startsWith('https://tinyurl.com/')) {
                throw new Error('Invalid URL or TinyURL service error');
            }
            
            // Extract short code from the URL
            const shortCode = shortUrl.split('/').pop() || '';
            
            return {
                success: true,
                shortUrl: shortUrl.trim(),
                originalUrl,
                shortCode,
                clickCount: 0,
                createdAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('TinyURL API Error:', error);
            throw new Error('Failed to shorten URL. Please check your internet connection and try again.');
        }
    }

    displayResult(result) {
        this.shortUrlDisplay.textContent = result.shortUrl;
        this.originalUrlDisplay.textContent = result.originalUrl;
        this.resultCard.style.display = 'block';
        this.resultCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Reset copy button state
        this.resetCopyButton();
    }

    async copyToClipboard() {
        const shortUrl = this.shortUrlDisplay.textContent;
        
        try {
            await navigator.clipboard.writeText(shortUrl);
            this.showCopySuccess();
            this.showToast('URL copied to clipboard!', 'success');
        } catch (error) {
            // Fallback for older browsers
            this.fallbackCopyToClipboard(shortUrl);
        }
    }

    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showCopySuccess();
            this.showToast('URL copied to clipboard!', 'success');
        } catch (error) {
            this.showToast('Failed to copy URL', 'error');
        }
        
        document.body.removeChild(textArea);
    }

    showCopySuccess() {
        this.copyIcon.style.display = 'none';
        this.copyText.style.display = 'none';
        this.checkIcon.style.display = 'inline';
        this.copiedText.style.display = 'inline';
        
        setTimeout(() => {
            this.resetCopyButton();
        }, 2000);
    }

    resetCopyButton() {
        this.copyIcon.style.display = 'inline';
        this.copyText.style.display = 'inline';
        this.checkIcon.style.display = 'none';
        this.copiedText.style.display = 'none';
    }

    addToHistory(result) {
        this.history.unshift(result);
        // Keep only the last 10 items
        this.history = this.history.slice(0, 10);
        this.saveHistory();
        this.renderHistory();
    }

    renderHistory() {
        if (this.history.length === 0) {
            this.historyContainer.innerHTML = `
                <div class="empty-history">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 12a9 9 0 101.622-5.161L3 8v4z"></path>
                    </svg>
                    <p>No links shortened yet</p>
                    <p class="empty-subtitle">Your shortened links will appear here</p>
                </div>
            `;
            this.clearHistoryBtn.style.display = 'none';
            return;
        }

        this.clearHistoryBtn.style.display = 'flex';
        
        const historyHTML = this.history.map(item => `
            <div class="history-item">
                <div class="history-content">
                    <div class="history-info">
                        <div class="history-link">
                            <a href="${item.shortUrl}" target="_blank" rel="noopener noreferrer" class="history-short-url">
                                ${item.shortUrl}
                            </a>
                            <button class="btn-copy-small" onclick="urlShortener.copyHistoryUrl('${item.shortUrl}')" title="Copy URL">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
                                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
                                </svg>
                            </button>
                        </div>
                        <p class="history-original">${item.originalUrl}</p>
                        <p class="history-time">${this.formatTimeAgo(item.createdAt)}</p>
                    </div>
                    <div class="history-stats">
                        <span class="click-count">${item.clickCount || 0} clicks</span>
                    </div>
                </div>
            </div>
        `).join('');

        this.historyContainer.innerHTML = historyHTML;
    }

    async copyHistoryUrl(url) {
        try {
            await navigator.clipboard.writeText(url);
            this.showToast('URL copied to clipboard!', 'success');
        } catch (error) {
            this.fallbackCopyToClipboard(url);
        }
    }

    clearHistory() {
        this.history = [];
        this.saveHistory();
        this.renderHistory();
        this.showToast('History cleared', 'success');
    }

    formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) {
            return 'Just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} day${days > 1 ? 's' : ''} ago`;
        }
    }

    setLoading(isLoading) {
        this.submitBtn.disabled = isLoading;
        if (isLoading) {
            this.btnText.style.display = 'none';
            this.btnLoading.style.display = 'flex';
        } else {
            this.btnText.style.display = 'block';
            this.btnLoading.style.display = 'none';
        }
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.urlInput.focus();
    }

    clearError() {
        this.errorMessage.textContent = '';
    }

    showToast(message, type = 'success') {
        this.toastMessage.textContent = message;
        this.toast.className = `toast ${type}`;
        this.toast.style.display = 'block';

        setTimeout(() => {
            this.toast.style.display = 'none';
        }, 3000);
    }

    loadHistory() {
        try {
            const stored = localStorage.getItem('urlShortenerHistory');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Failed to load history:', error);
            return [];
        }
    }

    saveHistory() {
        try {
            localStorage.setItem('urlShortenerHistory', JSON.stringify(this.history));
        } catch (error) {
            console.error('Failed to save history:', error);
        }
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.urlShortener = new URLShortener();
});

// Handle potential CORS issues with a fallback message
window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && event.reason.message && event.reason.message.includes('CORS')) {
        console.warn('CORS issue detected. The TinyURL API may not work from this domain.');
        // You could show a user-friendly message here
    }
});
