const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

function generatePostsJson() {
    const postsDir = path.join(__dirname, '_posts');
    const postsOutputFile = path.join(__dirname, 'posts.json');
    
    if (!fs.existsSync(postsDir)) {
        console.log('_posts directory not found, creating fallback posts.json');
        fs.writeFileSync(postsOutputFile, '[]');
    } else {
        const files = fs.readdirSync(postsDir).filter(file => file.endsWith('.md'));
        
        const posts = files.map(file => {
            const filePath = path.join(postsDir, file);
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const { data: frontMatter } = matter(fileContent);
            
            return {
                type: 'video',
                title: frontMatter.title || 'Untitled',
                movie_name: frontMatter.movie_name || frontMatter.title || 'Untitled',
                video_url: frontMatter.video_url || '',
                thumbnail: frontMatter.thumbnail || '',
                description: frontMatter.description || '',
                date: frontMatter.date || new Date().toISOString(),
                featured: frontMatter.featured || false,
                category: frontMatter.category || 'Other',
                tags: frontMatter.tags || [],
                generated_at: new Date().toISOString()
            };
        });
        
        posts.sort((a, b) => new Date(b.date) - new Date(a.date));
        fs.writeFileSync(postsOutputFile, JSON.stringify(posts, null, 2));
        console.log(`Generated posts.json with ${posts.length} video posts`);
    }
}

function generateSeriesJson() {
    const seriesDir = path.join(__dirname, '_series');
    const seriesOutputFile = path.join(__dirname, 'series.json');
    
    if (!fs.existsSync(seriesDir)) {
        console.log('_series directory not found, creating fallback series.json');
        fs.writeFileSync(seriesOutputFile, '[]');
    } else {
        const files = fs.readdirSync(seriesDir).filter(file => file.endsWith('.md'));
        
        const series = files.map(file => {
            const filePath = path.join(seriesDir, file);
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const { data: frontMatter } = matter(fileContent);
            
            // Auto-number seasons and episodes if not provided, otherwise keep user's numbers
            const seasonsWithNumbers = (frontMatter.seasons || []).map((season, seasonIndex) => {
                const seasonNumber = parseInt(season.season_number) || (seasonIndex + 1);
                const episodesWithNumbers = (season.episodes || []).map((episode, episodeIndex) => {
                    const episodeNumber = parseInt(episode.episode_number) || (episodeIndex + 1);
                    return {
                        episode_number: episodeNumber,
                        video_url: episode.video_url || '',
                        episode_title: episode.episode_title || `Episode ${episodeNumber}`
                    };
                });
                
                return {
                    season_number: seasonNumber,
                    episodes: episodesWithNumbers
                };
            });
            
            return {
                type: 'series',
                title: frontMatter.title || 'Untitled Series',
                series_name: frontMatter.series_name || frontMatter.title || 'Untitled Series',
                thumbnail: frontMatter.thumbnail || '',
                seasons: seasonsWithNumbers,
                description: frontMatter.description || '',
                date: frontMatter.date || new Date().toISOString(),
                featured: frontMatter.featured || false,
                category: frontMatter.category || 'Other',
                tags: frontMatter.tags || [],
                generated_at: new Date().toISOString()
            };
        });
        
        series.sort((a, b) => new Date(b.date) - new Date(a.date));
        fs.writeFileSync(seriesOutputFile, JSON.stringify(series, null, 2));
        console.log(`Generated series.json with ${series.length} series`);
    }
}

if (require.main === module) {
    generatePostsJson();
    generateSeriesJson();
}

module.exports = { generatePostsJson, generateSeriesJson };
