# Posts Hub - Static Site with Video Posts and Series

## Overview
This is a static website that supports both individual video posts and multi-season series. The site uses Decap CMS (formerly Netlify CMS) for content management and generates static JSON files for the frontend.

## Recent Changes (October 30, 2025)
- Added series functionality with nested seasons and episodes structure
- Renamed "Video Posts" button to "New Video" in the CMS
- Created expandable/collapsible season interface for series
- Added fullscreen video player for series episodes
- Implemented separate JSON generation for videos and series
- Enhanced frontend to handle both content types seamlessly
- **Added season/episode numbering with auto-titles in CMS**: 
  - CMS now shows "SEASON 1", "SEASON 2" instead of raw data
  - Episodes display as "S1Episode 1", "S3Episode 5" etc.
  - Simple number entry (1, 2, 3...) with helpful defaults
  - Build process validates and auto-fills missing numbers

## Project Architecture

### Backend/Build Process
- **generate-posts.js**: Node.js script that processes markdown files from `_posts` and `_series` directories and generates `posts.json` and `series.json`
- **gray-matter**: Used to parse front matter from markdown files
- Build runs automatically on Netlify deployments

### Frontend
- **index.html**: Main entry point
- **script.js**: Handles routing, content display, video player, and series interactions
- **posts-data.js**: Loads JSON data from both posts.json and series.json
- **style.css**: Comprehensive styling including series-specific components

### CMS (admin/)
- **config.yml**: Decap CMS configuration with two collections:
  - "New Video": Single video posts
  - "New Series": Multi-season series with episodes
- **index.html**: CMS admin interface

### Content Structure

#### Video Posts (_posts/)
- Individual video files with title, URL, description, etc.
- Stored as markdown with front matter

#### Series (_series/)
- Multi-season structure
- Each season contains multiple episodes
- Episode structure: season number, episode number, video URL, optional title
- Example structure in markdown front matter with nested lists

### Key Features

1. **Dual Content Types**: Videos and series displayed together on home page
2. **Series Interaction**: Expandable season buttons with episode lists
3. **Fullscreen Episode Player**: Episodes open in a dedicated fullscreen overlay
4. **Search Functionality**: Search across both videos and series
5. **Auto-play Toggle**: User preference for video auto-play
6. **Responsive Design**: Mobile-friendly interface
7. **Video Resume**: Remembers playback position

## Development Workflow

### Local Testing (Replit)
1. Run `node generate-posts.js` to generate JSON files
2. Start the server: `npx http-server . -p 5000 -c-1`
3. View at http://localhost:5000

### Netlify Deployment
1. Push changes to GitHub repository
2. Netlify automatically runs build command: `node generate-posts.js`
3. Site is deployed from root directory

### Adding Content

#### Add a Video Post
1. Go to /admin/ and log in
2. Click "New Video"
3. Fill in title, video URL, and other fields
4. Publish

#### Add a Series
1. Go to /admin/ and log in
2. Click "New Series"
3. Fill in series title
4. Click "+" next to SEASONS to add Season 1
   - Enter season number: 1
   - The CMS will show "SEASON 1" as the title
5. Click "+" to add episodes to Season 1
   - Enter episode number: 1, 2, 3...
   - Enter video URL for each episode
   - Episodes will show as "S1Episode 1", "S1Episode 2" etc.
6. Click "+" next to SEASONS again to add Season 2
   - Enter season number: 2
   - Add episodes numbered 1, 2, 3...
7. Publish

**Note**: The CMS displays "SEASON X" and "SXEpisode Y" titles for easy organization. If you forget to enter numbers, the build process will auto-number them based on their order.

## File Structure
```
/
├── admin/
│   ├── config.yml          # CMS configuration
│   └── index.html          # CMS admin interface
├── _posts/                 # Video post markdown files
├── _series/                # Series markdown files
├── _data/
│   └── site.yml           # Site settings
├── assets/
│   └── uploads/           # Media uploads from CMS
├── generate-posts.js      # Build script
├── posts.json             # Generated video posts data
├── series.json            # Generated series data
├── index.html             # Main site page
├── script.js              # Frontend JavaScript
├── posts-data.js          # Data loader
├── style.css              # Styles
├── netlify.toml           # Netlify configuration
└── package.json           # Node.js dependencies

```

## Technologies Used
- **Decap CMS**: Content management
- **Node.js**: Build process
- **gray-matter**: Markdown front matter parsing
- **Vanilla JavaScript**: Frontend interactions
- **CSS3**: Responsive styling
- **Netlify**: Hosting and deployment

## User Preferences
- The site is designed for posting Myanmar/Burmese video content
- Supports both standalone videos and multi-episode series
- Uses specific ad integration from burmahub.site
- Links to Channel Myanmar mobile app

## Notes
- All video URLs should be direct .mp4 links
- The site uses cache busting with version parameters
- Browser localStorage is used for video resume and auto-play preferences
- The CMS uses Netlify Identity for authentication
