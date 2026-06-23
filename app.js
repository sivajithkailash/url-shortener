document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('shorten-form');
    const longUrlInput = document.getElementById('long-url');
    const submitBtn = document.getElementById('submit-btn');
    const resultArea = document.getElementById('result-area');
    const shortUrlLink = document.getElementById('short-url-link');
    const errorMessage = document.getElementById('error-message');
    const analyticsBody = document.getElementById('analytics-body');
    const loadingAnalytics = document.getElementById('loading-analytics');
    const emptyAnalytics = document.getElementById('empty-analytics');

    // Fetch and display analytics on load
    fetchAnalytics();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const longUrl = longUrlInput.value.trim();
        
        if (!isValidUrl(longUrl)) {
            showError('Please enter a valid URL including http:// or https://');
            return;
        }

        hideError();
        setLoading(true);

        try {
            const response = await fetch('/api/shorten', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ longUrl }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to shorten URL');
            }

            const data = await response.json();
            
            // Show result
            shortUrlLink.href = data.shortUrl;
            shortUrlLink.textContent = data.shortUrl;
            resultArea.classList.remove('hidden');
            resultArea.classList.add('animate-fade-in');
            
            // Clear input
            longUrlInput.value = '';
            
            // Refresh analytics
            fetchAnalytics();

        } catch (error) {
            showError(error.message);
        } finally {
            setLoading(false);
        }
    });

    async function fetchAnalytics() {
        try {
            const response = await fetch('/api/urls');
            if (!response.ok) throw new Error('Failed to fetch analytics');
            
            const urls = await response.json();
            
            loadingAnalytics.classList.add('hidden');
            
            if (urls.length === 0) {
                emptyAnalytics.classList.remove('hidden');
                analyticsBody.innerHTML = '';
                return;
            }
            
            emptyAnalytics.classList.add('hidden');
            analyticsBody.innerHTML = urls.map(url => 
                '<tr class="hover:bg-gray-800/50 transition duration-150">' +
                    '<td class="py-4 px-4 whitespace-nowrap">' +
                        '<a href="/' + url.short_code + '" target="_blank" class="text-blue-400 hover:text-blue-300 font-medium">' +
                            url.short_code +
                        '</a>' +
                    '</td>' +
                    '<td class="py-4 px-4 max-w-xs truncate text-gray-300" title="' + url.long_url + '">' +
                        url.long_url +
                    '</td>' +
                    '<td class="py-4 px-4 text-center">' +
                        '<span class="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-900/50 text-emerald-400 border border-emerald-800/50">' +
                            url.click_count +
                        '</span>' +
                    '</td>' +
                    '<td class="py-4 px-4 text-right text-gray-500 text-sm">' +
                        formatDate(url.created_at) +
                    '</td>' +
                '</tr>'
            ).join('');
            
        } catch (error) {
            console.error('Analytics error:', error);
            loadingAnalytics.textContent = 'Failed to load analytics';
        }
    }

    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    function showError(msg) {
        errorMessage.textContent = msg;
        errorMessage.classList.remove('hidden');
    }

    function hideError() {
        errorMessage.classList.add('hidden');
    }

    function setLoading(isLoading) {
        if (isLoading) {
            submitBtn.innerHTML = '<svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Shortening...';
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-75', 'cursor-not-allowed');
        } else {
            submitBtn.innerHTML = 'Shorten';
            submitBtn.disabled = false;
            submitBtn.classList.remove('opacity-75', 'cursor-not-allowed');
        }
    }

    function formatDate(dateString) {
        const date = new Date(dateString + 'Z'); // SQLite assumes UTC usually, adding Z for parsing safely if it's UTC
        return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
            Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24)), 
            'day'
        );
    }
});
