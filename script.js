let currentView = 'home';
let currentPost = null;
let currentPage = 1;
const postsPerPage = 20;
let searchQuery = '';
let autoPlayEnabled = localStorage.getItem('autoplay') === 'true';
let hdEnabled = localStorage.getItem('hdResolution') === 'true';
let postsLoaded = false;
let currentlyExpandedSeason = null;

function getResolutionUrl(originalUrl, useHD) {
    if (!originalUrl) return originalUrl;

    if (useHD) {
        return originalUrl.replace(/\.mp4$/i, '.mpeg4');
    } else {
        return originalUrl.replace(/\.mpeg4$/i, '.mp4');
    }
}

function getAlternateUrl(currentUrl) {
    if (!currentUrl) return currentUrl;

    if (currentUrl.match(/\.mpeg4$/i)) {
        return currentUrl.replace(/\.mpeg4$/i, '.mp4');
    } else if (currentUrl.match(/\.mp4$/i)) {
        return currentUrl.replace(/\.mp4$/i, '.mpeg4');
    }
    return currentUrl;
}

function isHDUrl(url) {
    return url && url.match(/\.mpeg4$/i);
}

function getResolutionIndicatorHTML(isHD, indicatorClass) {
    const className = indicatorClass || 'resolution-indicator';
    if (isHD) {
        return `<div class="${className}" id="res-indicator">
            <span class="site-name">shalkyie.com</span>
            <span class="hd-badge">HD</span>
        </div>`;
    } else {
        return `<div class="${className}" id="res-indicator">
            <span class="site-name">shalkyie.com</span>
            <span class="sd-badge">SD</span>
        </div>`;
    }
}

function updateResolutionIndicator(currentUrl, indicatorId) {
    const indicator = document.getElementById(indicatorId || 'res-indicator');
    if (!indicator) return;

    const isHD = isHDUrl(currentUrl);
    const hdBadge = indicator.querySelector('.hd-badge');
    const sdBadge = indicator.querySelector('.sd-badge');

    if (isHD) {
        if (sdBadge) sdBadge.remove();
        if (!hdBadge) {
            const badge = document.createElement('span');
            badge.className = 'hd-badge';
            badge.textContent = 'HD';
            indicator.appendChild(badge);
        }
    } else {
        if (hdBadge) hdBadge.remove();
        if (!sdBadge) {
            const badge = document.createElement('span');
            badge.className = 'sd-badge';
            badge.textContent = 'SD';
            indicator.appendChild(badge);
        }
    }
}

function setupVideoFallback(video, originalUrl, indicatorId) {
    let hasTriedFallback = false;
    let fallbackTimeout = null;

    const tryAlternateResolution = (currentUrl) => {
        if (hasTriedFallback) {
            console.log('Both resolutions failed for this video');
            return;
        }

        const alternateUrl = getAlternateUrl(currentUrl);

        if (alternateUrl !== currentUrl) {
            console.log('Video failed to load, trying alternate resolution:', alternateUrl);
            hasTriedFallback = true;

            // Clear any existing timeout
            if (fallbackTimeout) {
                clearTimeout(fallbackTimeout);
            }

            const source = video.querySelector('source');
            if (source) {
                source.src = alternateUrl;
            } else {
                video.src = alternateUrl;
            }

            video.load();
            video.play().catch(e => console.log('Auto-play prevented by browser'));
            updateResolutionIndicator(alternateUrl, indicatorId);
        }
    };

    // Video element error handler
    video.addEventListener('error', function(e) {
        const currentSrc = video.querySelector('source')?.src || video.src;
        if (currentSrc) {
            tryAlternateResolution(currentSrc);
        }
    }, true);

    // Source element error handler
    const source = video.querySelector('source');
    if (source) {
        source.addEventListener('error', function(e) {
            if (source.src) {
                tryAlternateResolution(source.src);
            }
        });
    }

    // Timeout fallback - if video doesn't start playing within 10 seconds
    video.addEventListener('loadstart', function() {
        fallbackTimeout = setTimeout(() => {
            if (video.networkState === 3) { // NETWORK_NO_SOURCE
                const currentSrc = video.querySelector('source')?.src || video.src;
                console.log('Video loading timeout, attempting fallback');
                tryAlternateResolution(currentSrc);
            }
        }, 10000);
    }, { once: true });

    // Clear timeout if video starts playing successfully
    video.addEventListener('loadeddata', function() {
        if (fallbackTimeout) {
            clearTimeout(fallbackTimeout);
        }
    }, { once: true });
}

function getResumeKey(videoUrl) {
    if (!videoUrl) return null;
    const fileName = videoUrl.split('/').pop();
    return fileName.replace(/\.(mp4|mpeg4)$/i, '');
}

function titleToSlug(title) {
    return title.replace(/[^a-zA-Z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function findContentBySlug(slug) {
    return allContent.find(content => {
        const contentSlug = titleToSlug(content.title);
        return contentSlug === slug || contentSlug.toLowerCase() === slug.toLowerCase();
    });
}

function updateURL(content = null, page = 1) {
    if (content) {
        const slug = titleToSlug(content.title);
        window.history.pushState({view: 'post', contentId: content.id}, '', `#${slug}`);
    } else {
        const url = page > 1 ? `#page-${page}` : '#home';
        window.history.pushState({view: 'home', page: page}, '', url);
    }
}

function parseURL() {
    const hash = window.location.hash.replace('#', '');

    if (!hash || hash === 'home') {
        return {view: 'home', page: 1};
    } else if (hash.startsWith('page-')) {
        const page = parseInt(hash.replace('page-', ''));
        return {view: 'home', page: page || 1};
    } else {
        const content = findContentBySlug(hash);
        if (content) {
            return {view: 'post', contentId: content.id};
        }
    }
    return {view: 'home', page: 1};
}

const postsContainer = document.getElementById('posts-container');

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function createHomePostHTML(content) {
    const isSeries = content.type === 'series';
    const typeLabel = isSeries ? 'SERIES' : 'VIDEO';
    const iconClass = isSeries ? 'fa-tv' : 'fa-play-circle';
    const thumbnailStyle = content.thumbnail ? `style="background-image: url('${content.thumbnail}'); background-size: cover; background-position: center;"` : '';

    return `
        <article class="post-preview" onclick="openPost('${content.id}')">
            <div class="post-thumbnail ${isSeries ? 'series-thumbnail' : ''}" ${thumbnailStyle}>
                ${isSeries && !content.thumbnail ? `
                    <div class="series-preview-icon">
                        <i class="fas fa-tv"></i>
                    </div>
                ` : !isSeries && !content.thumbnail ? `
                    <div class="play-overlay">
                        <i class="fas fa-play"></i>
                    </div>
                ` : `
                    <div class="play-overlay" style="background: rgba(0,0,0,0.2)">
                        <i class="fas ${isSeries ? 'fa-tv' : 'fa-play'}"></i>
                    </div>
                `}
            </div>
            <header class="post-title">
                <span class="content-type-badge ${isSeries ? 'series-badge' : 'video-badge'}">
                    <i class="fas ${iconClass}"></i> ${typeLabel}
                </span>
                ${content.title}
            </header>
        </article>
    `;
}

function createFullVideoHTML(content) {
    const videoUrl = getResolutionUrl(content.videoUrl, hdEnabled);
    const isHD = isHDUrl(videoUrl);
    return `
        <div class="post-page">
            <article class="post-outer">
                <header class="post-title">
                    ${content.movieName || content.title}
                </header>
                <div class="video-container">
                    <div class="video-wrapper" id="video-wrapper-${content.id}">
                        ${getResolutionIndicatorHTML(isHD, 'resolution-indicator')}
                        <video id="video-${content.id}" controls preload="metadata" ${autoPlayEnabled ? 'autoplay' : ''} data-original-url="${content.videoUrl}" ${content.thumbnail ? `poster="${content.thumbnail}"` : ''}>
                            <source src="${videoUrl}" type="video/mp4">
                            Your browser does not support the video tag.
                        </video>
                    </div>
                    <div class="video-buttons">
                        <button class="video-btn fullscreen-btn" onclick="goFullScreen('${content.id}')">
                            <i class="fas fa-expand"></i> Full Screen
                        </button>
                        <button class="video-btn allmovies-btn" onclick="goToAllMovies()">
                            <i class="fas fa-film"></i> All Movies
                        </button>
                    </div>
                    <div><br /></div><div>
                    <span style="font-size: x-small;">
                        အညွှန်းများနှင့် စာတန်းထိုးဇာတ်လမ်းအများစုကို ''HomieTV.com'' ဝဘ်ဆိုက်မှ တဆင့်ပြန်လည် ကူးယူတင်ပြပါသည်။
                        <br>
                        2K 4K ရုပ်ထွက်ဇာတ်လမ်းအကြည်များကို မူရင်း ဝဘ်ဆိုက်နှင့် အပ်ပလီကေးရှင်းတွင်သာ ကြည့်ရှု့အားပေးနိုင်ပါသည်။ အပ်ပလီကေးရှင်းကို PlayStore မှ ဒေါင်းရန်နှိပ်ပါ။
                    </span>
                    <div class="separator" style="clear: both;">
                        <a href="https://play.google.com/store/apps/details?id=com.channelmyanmar.cmofficial" style="display: block; padding: 1em 0px; text-align: center;" target="_blank">
                            <img alt="Channel Myanmar App" border="0" src="https://ia800809.us.archive.org/3/items/video_2025-02-05_20-05-22/CM.png" width="200" />
                        </a>
                    </div>
                </div>
            </article>
        </div>
    `;
}

function createFullSeriesHTML(content) {
    const displayName = content.seriesName || content.title;
    const seasonsHTML = content.seasons.map((season, seasonIndex) => {
        const seasonNumber = season.season_number || (seasonIndex + 1);
        const episodesHTML = season.episodes.map((episode, episodeIndex) => {
            const episodeNumber = episode.episode_number || (episodeIndex + 1);
            const episodeTitle = episode.episode_title || `Episode ${episodeNumber}`;
            return `
                <button class="episode-btn" onclick="playEpisode('${episode.video_url}', '${displayName}', ${seasonNumber}, ${episodeNumber})">
                    S${seasonNumber}EP-${episodeNumber}
                </button>
            `;
        }).join('');

        return `
            <div class="season-group">
                <button class="season-btn" onclick="toggleSeason(${seasonIndex})">
                    SEASON ${seasonNumber}
                </button>
                <div class="episodes-dropdown" id="season-${seasonIndex}">
                    ${episodesHTML}
                </div>
            </div>
        `;
    }).join('');

    return `
        <div class="post-page">
            <article class="post-outer">
                <header class="post-title">
                    ${displayName}
                </header>
                <div class="series-container">
                    ${seasonsHTML}
                    <div class="video-buttons">
                        <button class="video-btn allmovies-btn" onclick="goToAllMovies()">
                            <i class="fas fa-film"></i> All Movies
                        </button>
                    </div>
                    <div><br /></div><div>
                    <span style="font-size: x-small;">
                        အညွှန်းများနှင့် စာတန်းထိုးဇာတ်လမ်းအများစုကို ''HomieTV.com'' ဝဘ်ဆိုက်မှ တဆင့်ပြန်လည် ကူးယူတင်ပြပါသည်။
                        <br>
                        2K 4K ရုပ်ထွက်ဇာတ်လမ်းအကြည်များကို မူရင်း ဝဘ်ဆိုက်နှင့် အပ်ပလီကေးရှင်းတွင်သာ ကြည့်ရှု့အားပေးနိုင်ပါသည်။ အပ်ပလီကေးရှင်းကို PlayStore မှ ဒေါင်းရန်နှိပ်ပါ။
                    </span>
                    <div class="separator" style="clear: both;">
                        <a href="https://play.google.com/store/apps/details?id=com.channelmyanmar.cmofficial" style="display: block; padding: 1em 0px; text-align: center;" target="_blank">
                            <img alt="Channel Myanmar App" border="0" src="https://ia800809.us.archive.org/3/items/video_2025-02-05_20-05-22/CM.png" width="200" />
                        </a>
                    </div>
                </div>
            </article>
        </div>
    `;
}

function toggleSeason(seasonIndex) {
    const dropdown = document.getElementById(`season-${seasonIndex}`);
    if (!dropdown) return;

    if (currentlyExpandedSeason !== null && currentlyExpandedSeason !== seasonIndex) {
        const prevDropdown = document.getElementById(`season-${currentlyExpandedSeason}`);
        if (prevDropdown) {
            prevDropdown.classList.remove('open');
        }
    }

    dropdown.classList.toggle('open');
    currentlyExpandedSeason = dropdown.classList.contains('open') ? seasonIndex : null;
}

function playEpisode(videoUrl, seriesTitle, seasonNumber, episodeNumber) {
    const episodeTitle = `${seriesTitle} - S${seasonNumber}E${episodeNumber}`;
    const resolutionUrl = getResolutionUrl(videoUrl, hdEnabled);
    const isHD = isHDUrl(resolutionUrl);

    const videoPlayerHTML = `
        <div class="fullscreen-video-overlay" id="episode-player">
            <div class="video-header">
                <h3>${episodeTitle}</h3>
                <button class="close-video-btn" onclick="closeEpisodePlayer()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="episode-video-wrapper" id="episode-video-wrapper">
                ${getResolutionIndicatorHTML(isHD, 'episode-resolution-indicator')}
                <video id="episode-video" controls autoplay data-original-url="${videoUrl}" ${content.thumbnail ? `poster="${content.thumbnail}"` : ''}>
                    <source src="${resolutionUrl}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
            </div>
            <div class="video-buttons">
                <button class="video-btn fullscreen-btn" onclick="goEpisodeFullScreen()">
                    <i class="fas fa-expand"></i> Full Screen
                </button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', videoPlayerHTML);
    const video = document.getElementById('episode-video');
    video.focus();

    setupVideoFallback(video, videoUrl, 'res-indicator');

    const resumeKey = getResumeKey(videoUrl);
    const savedTime = localStorage.getItem(`video-time-${resumeKey}`);
    if (savedTime && !isNaN(savedTime)) {
        video.addEventListener('loadedmetadata', function restoreTime() {
            video.currentTime = parseFloat(savedTime);
            video.removeEventListener('loadedmetadata', restoreTime);
        });
    }

    video.addEventListener("pause", () => {
        localStorage.setItem(`video-time-${resumeKey}`, video.currentTime);
    });

    video.addEventListener("timeupdate", () => {
        if (video.currentTime > 0 && Math.floor(video.currentTime) % 5 === 0) {
            localStorage.setItem(`video-time-${resumeKey}`, video.currentTime);
        }
    });

    video.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        return false;
    });
}

function closeEpisodePlayer() {
    const player = document.getElementById('episode-player');
    if (player) {
        player.remove();
    }
}

function goEpisodeFullScreen() {
    const video = document.getElementById('episode-video');

    if (!video) return;

    // Use native video fullscreen API for proper subtitle display
    if (video.requestFullscreen) {
        video.requestFullscreen();
    } else if (video.webkitRequestFullscreen) {
        video.webkitRequestFullscreen();
    } else if (video.webkitEnterFullscreen) {
        // iOS Safari fallback
        video.webkitEnterFullscreen();
    } else if (video.mozRequestFullScreen) {
        video.mozRequestFullScreen();
    } else if (video.msRequestFullscreen) {
        video.msRequestFullscreen();
    }
}

function getContentForPage(page) {
    let filteredContent = allContent.slice();

    if (searchQuery) {
        const isNameSearch = searchQuery.startsWith('#');
        const searchTerm = isNameSearch ? searchQuery.substring(1).trim().toLowerCase() : searchQuery.toLowerCase();

        filteredContent = filteredContent.filter(content => {
            if (isNameSearch) {
                // Search in movie_name or series_name only when using #
                const displayName = (content.movieName || content.seriesName || '').toLowerCase();
                return displayName.includes(searchTerm);
            } else {
                // Regular search: search in title only
                const title = content.title.toLowerCase();
                return title.includes(searchTerm);
            }
        });
    }

    filteredContent.sort((a, b) => new Date(b.date) - new Date(a.date));

    const startIndex = (page - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    return filteredContent.slice(startIndex, endIndex);
}

function getTotalPages() {
    let filteredContent = allContent.slice();

    if (searchQuery) {
        const isNameSearch = searchQuery.startsWith('#');
        const searchTerm = isNameSearch ? searchQuery.substring(1).trim().toLowerCase() : searchQuery.toLowerCase();

        filteredContent = filteredContent.filter(content => {
            if (isNameSearch) {
                // Search in movie_name or series_name only when using #
                const displayName = (content.movieName || content.seriesName || '').toLowerCase();
                return displayName.includes(searchTerm);
            } else {
                // Regular search: search in title only
                const title = content.title.toLowerCase();
                return title.includes(searchTerm);
            }
        });
    }

    return Math.ceil(filteredContent.length / postsPerPage);
}

function createPaginationHTML() {
    const totalPages = getTotalPages();
    if (totalPages <= 1) return '';

    let paginationHTML = '<div class="pagination">';

    if (currentPage > 1) {
        paginationHTML += `<button class="page-btn" onclick="goToPage(${currentPage - 1})"><i class="fas fa-chevron-left"></i></button>`;
    }

    for (let i = 1; i <= totalPages; i++) {
        const activeClass = i === currentPage ? 'active' : '';
        paginationHTML += `<button class="page-btn ${activeClass}" onclick="goToPage(${i})">${i}</button>`;
    }

    if (currentPage < totalPages) {
        paginationHTML += `<button class="page-btn" onclick="goToPage(${currentPage + 1})"><i class="fas fa-chevron-right"></i></button>`;
    }

    paginationHTML += '</div>';
    return paginationHTML;
}

function loadHomePage(page = 1) {
    if (!postsLoaded) {
        postsContainer.innerHTML = '<div class="loading">Loading content...</div>';
        return;
    }

    currentView = 'home';
    currentPage = page;
    updateURL(null, page);

    postsContainer.innerHTML = '<div class="loading">Loading content...</div>';

    setTimeout(() => {
        loadSearchSection();
    }, 100);

    setTimeout(() => {
        const currentContent = getContentForPage(currentPage);

        if (currentContent.length === 0) {
            postsContainer.innerHTML = `
                <div class="empty-state">
                    <h2>No Content Found</h2>
                    <p>${searchQuery ? 'Try a different search term.' : 'No posts or series available.'}</p>
                </div>
            `;
        } else {
            const contentHTML = currentContent.map(content => createHomePostHTML(content)).join('');
            const paginationHTML = createPaginationHTML();

            postsContainer.innerHTML = `
                <div class="posts-grid">${contentHTML}</div>
                ${paginationHTML}
            `;
        }
    }, 300);
}

function loadPostPage(contentId) {
    if (!postsLoaded) {
        postsContainer.innerHTML = '<div class="loading">Loading content...</div>';
        return;
    }

    const content = allContent.find(c => c.id === contentId);
    if (!content) {
        loadHomePage();
        return;
    }

    currentView = 'post';
    currentPost = content;
    updateURL(content);

    postsContainer.innerHTML = '<div class="loading">Loading...</div>';

    setTimeout(() => {
        const contentHTML = content.type === 'series' ? createFullSeriesHTML(content) : createFullVideoHTML(content);
        postsContainer.innerHTML = contentHTML;

        // Load controls for both videos and series
        setTimeout(() => {
            loadAutoPlaySection();
        }, 50);

        if (content.type === 'video') {
            setTimeout(() => {
                initVideoPlayer(content.id, content.videoUrl);
            }, 100);
        }
    }, 200);
}

function openPost(contentId) {
    loadPostPage(contentId);
}

function goToPage(page) {
    loadHomePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goHome() {
    loadHomePage(currentPage);
}

function initVideoPlayer(videoId, videoUrl) {
    const video = document.getElementById(`video-${videoId}`);
    if (!video) return;

    setupVideoFallback(video, videoUrl, 'res-indicator');

    if (autoPlayEnabled) {
        video.setAttribute('autoplay', '');
        video.autoplay = true;
        video.play().catch(e => console.log('Auto-play prevented by browser'));
    }

    const resumeKey = getResumeKey(videoUrl);
    const savedTime = localStorage.getItem(`video-time-${resumeKey}`);
    if (savedTime && !isNaN(savedTime)) {
        video.currentTime = parseFloat(savedTime);
    }

    video.addEventListener("pause", () => {
        localStorage.setItem(`video-time-${resumeKey}`, video.currentTime);
    });

    video.addEventListener("timeupdate", () => {
        if (video.currentTime > 0 && Math.floor(video.currentTime) % 5 === 0) {
            localStorage.setItem(`video-time-${resumeKey}`, video.currentTime);
        }
    });

    video.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        return false;
    });

    video.setAttribute('tabindex', '0');
}

function goFullScreen(videoId) {
    const video = document.getElementById(`video-${videoId}`);

    if (!video) return;

    // Use native video fullscreen API for proper subtitle display
    if (video.requestFullscreen) {
        video.requestFullscreen();
    } else if (video.webkitRequestFullscreen) {
        video.webkitRequestFullscreen();
    } else if (video.webkitEnterFullscreen) {
        // iOS Safari fallback
        video.webkitEnterFullscreen();
    } else if (video.mozRequestFullScreen) {
        video.mozRequestFullScreen();
    } else if (video.msRequestFullscreen) {
        video.msRequestFullscreen();
    }
}

function goToAllMovies() {
    window.open('https://www.shalkyie.com', '_blank');
}

function initFloatingAd() {
    const floatingAd = document.getElementById('floating-ad');
    let isVisible = true;
    let lastScrollTop = 0;

    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        if (scrollTop > lastScrollTop && scrollTop > 300) {
            if (isVisible) {
                floatingAd.style.transform = 'translateY(100%)';
                isVisible = false;
            }
        } else {
            if (!isVisible) {
                floatingAd.style.transform = 'translateY(0)';
                isVisible = true;
            }
        }
        lastScrollTop = scrollTop;
    }, { passive: true });
}

window.addEventListener('popstate', function(event) {
    handleRouting();
});

window.addEventListener('hashchange', function(event) {
    handleRouting();
});

function handleRouting() {
    const urlData = parseURL();
    if (urlData.view === 'post') {
        loadPostPage(urlData.contentId);
    } else {
        loadHomePage(urlData.page);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    checkForUpdates();
    initFloatingAd();

    const adLinks = document.querySelectorAll('.ad-container a, #floating-ad a');
    adLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            console.log('Ad clicked:', this.href);
        });
    });
});

window.addEventListener('postsLoaded', function() {
    postsLoaded = true;
    handleRouting();
});

window.addEventListener('resize', function() {}, { passive: true });

function loadSearchSection() {
    const controlsSection = document.getElementById('controls-section');
    controlsSection.innerHTML = `
        <div class="search-container">
            <i class="fas fa-search search-icon"></i>
            <input type="text" id="search-input" placeholder="Search titles, or use #keyword for movie/series names..." value="${searchQuery}">
            <button id="clear-search" class="clear-btn" ${!searchQuery ? 'style="display:none"' : ''}>
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    initSearchFunction();
}

function initSearchFunction() {
    const searchInput = document.getElementById('search-input');
    const clearBtn = document.getElementById('clear-search');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            if (searchQuery) {
                clearBtn.style.display = 'block';
            } else {
                clearBtn.style.display = 'none';
            }
            currentPage = 1;
            loadHomePage(1);
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchQuery = '';
            searchInput.value = '';
            clearBtn.style.display = 'none';
            currentPage = 1;
            loadHomePage(1);
        });
    }
}

function loadAutoPlaySection() {
    const controlsSection = document.getElementById('controls-section');
    controlsSection.innerHTML = `
        <div class="controls-wrapper">
            <div class="autoplay-container">
                <span class="autoplay-label">Auto-Play</span>
                <div class="toggle-switch ${autoPlayEnabled ? 'active' : ''}" id="autoplay-toggle">
                    <div class="toggle-slider"></div>
                </div>
            </div>
            <div class="autoplay-container">
                <span class="autoplay-label">HD Resolution</span>
                <div class="toggle-switch ${hdEnabled ? 'active' : ''}" id="hd-toggle">
                    <div class="toggle-slider"></div>
                </div>
                <span class="toggle-helper-text">လိုင်းမကောင်းလျှင် HD ကိုပိတ်ပါ</span>
            </div>
        </div>
    `;
    initAutoPlayToggle();
    initHDToggle();
}

function initAutoPlayToggle() {
    const toggle = document.getElementById('autoplay-toggle');
    if (toggle) {
        toggle.addEventListener('click', () => {
            autoPlayEnabled = !autoPlayEnabled;
            localStorage.setItem('autoplay', autoPlayEnabled);
            toggle.classList.toggle('active', autoPlayEnabled);

            const video = document.querySelector('video');
            if (video) {
                if (autoPlayEnabled) {
                    video.setAttribute('autoplay', '');
                    video.autoplay = true;
                    if (video.paused) {
                        video.play().catch(e => console.log('Auto-play prevented by browser'));
                    }
                } else {
                    video.removeAttribute('autoplay');
                    video.autoplay = false;
                }
            }
        });
    }
}

function initHDToggle() {
    const toggle = document.getElementById('hd-toggle');
    if (toggle) {
        toggle.addEventListener('click', () => {
            hdEnabled = !hdEnabled;
            localStorage.setItem('hdResolution', hdEnabled);
            toggle.classList.toggle('active', hdEnabled);

            const mainVideo = document.querySelector('.video-container video');
            const episodeVideo = document.getElementById('episode-video');
            const activeVideo = episodeVideo || mainVideo;

            if (activeVideo) {
                switchVideoResolution(activeVideo);
            }
        });
    }
}

function switchVideoResolution(video) {
    if (!video) return;

    const originalUrl = video.getAttribute('data-original-url');
    if (!originalUrl) return;

    const currentTime = video.currentTime;
    const wasPaused = video.paused;
    const wasPlaying = !wasPaused;

    const newUrl = getResolutionUrl(originalUrl, hdEnabled);
    const source = video.querySelector('source');

    if (source) {
        source.src = newUrl;
    }
    video.src = newUrl;

    video.load();

    updateResolutionIndicator(newUrl, 'res-indicator');

    const resumePlayback = () => {
        if (currentTime > 0) {
            video.currentTime = currentTime;
        }
        if (wasPlaying || autoPlayEnabled) {
            video.play().catch(e => console.log('Play prevented by browser'));
        }
    };

    if (video.readyState >= 2) {
        resumePlayback();
    } else {
        video.addEventListener('loadedmetadata', function onLoaded() {
            resumePlayback();
            video.removeEventListener('loadedmetadata', onLoaded);
        });
    }
}

function checkForUpdates() {
    const currentVersion = '1.0.3';
    const storedVersion = localStorage.getItem('app-version');

    if (storedVersion && storedVersion !== currentVersion) {
        localStorage.setItem('app-version', currentVersion);
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => caches.delete(name));
            });
        }
        window.location.reload(true);
        return;
    }

    if (!storedVersion) {
        localStorage.setItem('app-version', currentVersion);
    }
}

window.postsApp = {
    loadHomePage,
    loadPostPage,
    openPost,
    goHome,
    posts,
    series,
    allContent,
    checkForUpdates
};
