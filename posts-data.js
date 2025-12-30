let posts = [];
let series = [];
let allContent = [];

const fallbackPosts = [];
const fallbackSeries = [];

async function loadPosts() {
    try {
        const timestamp = new Date().getTime();
        const response = await fetch(`./posts.json?v=${timestamp}`);
        if (response.ok) {
            const cmsData = await response.json();
            posts = cmsData.map((post, index) => ({
                id: `video-${index + 1}`,
                type: 'video',
                title: post.title,
                movieName: post.movie_name || post.title,
                videoUrl: post.video_url,
                thumbnail: post.thumbnail || '',
                description: post.description || '',
                date: post.date || new Date().toISOString(),
                category: post.category || 'Other',
                tags: post.tags || []
            }));
            console.log('Video posts loaded from CMS:', posts.length);
        } else {
            throw new Error('Posts data not available');
        }
    } catch (error) {
        console.log('Using fallback posts data');
        posts = fallbackPosts;
    }
}

async function loadSeries() {
    try {
        const timestamp = new Date().getTime();
        const response = await fetch(`./series.json?v=${timestamp}`);
        if (response.ok) {
            const cmsData = await response.json();
            series = cmsData.map((s, index) => ({
                id: `series-${index + 1}`,
                type: 'series',
                title: s.title,
                seriesName: s.series_name || s.title,
                thumbnail: s.thumbnail || '',
                seasons: s.seasons || [],
                description: s.description || '',
                date: s.date || new Date().toISOString(),
                category: s.category || 'Other',
                tags: s.tags || []
            }));
            console.log('Series loaded from CMS:', series.length);
        } else {
            throw new Error('Series data not available');
        }
    } catch (error) {
        console.log('Using fallback series data');
        series = fallbackSeries;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    Promise.all([loadPosts(), loadSeries()]).then(() => {
        allContent = [...posts, ...series].sort((a, b) => new Date(b.date) - new Date(a.date));
        window.dispatchEvent(new CustomEvent('postsLoaded'));
    });
});
