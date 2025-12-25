# CMS User Guide - Series Management

## How the CMS Display Works Now

### ✅ FIXED: No More "List [ Map..." Display Issue

**Before:** Season boxes showed ugly raw data like:
```
List [ Map { "video_url": "...", "episode_title": "..." } ]
```

**After:** Clean, readable titles:
```
SEASON 1
  S1Episode 1 - https://...
  S1Episode 2 - https://...
  S1Episode 3 - https://...

SEASON 2
  S2Episode 1 - https://...
  S2Episode 2 - https://...
```

## Adding a New Series in CMS

### Step-by-Step Instructions:

1. **Go to `/admin/`** and log in

2. **Click "New Series"** button

3. **Fill in Series Title**
   - Example: "Breaking Bad - Complete Series"

4. **Add Season 1**
   - Click the **"+"** button next to "SEASONS"
   - Enter Season Number: **1**
   - ✨ The box title will show: **"SEASON 1"**

5. **Add Episodes to Season 1**
   - Click the **"+"** button next to "Episodes"
   - Enter Episode Number: **1**
   - Enter Video URL: `https://...your-video-url.mp4`
   - (Optional) Enter Episode Title: "Pilot"
   - ✨ The episode will show: **"S1Episode 1 - https://..."**
   
   - Click **"+"** again for next episode
   - Enter Episode Number: **2**
   - Enter Video URL: `https://...`
   - ✨ Shows: **"S1Episode 2 - https://..."**
   
   - Repeat for all episodes in Season 1

6. **Add Season 2**
   - Click the **"+"** button next to "SEASONS" (at the top level)
   - Enter Season Number: **2**
   - ✨ Shows: **"SEASON 2"**
   - Add episodes numbered 1, 2, 3...
   - ✨ They show as: **"S2Episode 1"**, **"S2Episode 2"**, etc.

7. **Continue adding seasons** (Season 3, 4, 5...)

8. **Fill optional fields**
   - Description
   - Category (Drama, Action, Comedy, etc.)
   - Tags

9. **Publish!**

## What You'll See in the CMS:

```
Breaking Bad - Complete Series
├── SEASON 1
│   ├── S1Episode 1 - https://ia600908.us.archive.org/...
│   ├── S1Episode 2 - https://ia600908.us.archive.org/...
│   └── S1Episode 3 - https://ia600908.us.archive.org/...
├── SEASON 2
│   ├── S2Episode 1 - https://ia600908.us.archive.org/...
│   └── S2Episode 2 - https://ia600908.us.archive.org/...
└── SEASON 3
    ├── S3Episode 1 - https://ia600908.us.archive.org/...
    └── S3Episode 2 - https://ia600908.us.archive.org/...
```

## Important Notes:

✅ **Easy numbering**: Just enter 1, 2, 3... for each season and episode
✅ **Clear labels**: You'll see "SEASON 1", "S1Episode 1" etc. instead of raw data
✅ **Auto-backup**: If you forget to enter numbers, the build process will auto-number based on order
✅ **Flexible**: You can add as many seasons and episodes as you want

## Tips:

1. **Always number sequentially**: Season 1, 2, 3... and Episode 1, 2, 3...
2. **Use clear episode titles**: They help you identify episodes in the CMS
3. **Test your video URLs**: Make sure they're direct .mp4 links before publishing
4. **Save often**: The CMS saves as you work

## What Gets Generated:

When you publish, the system generates a JSON file with your series data that the website uses to display:
- Season buttons (SEASON 1, SEASON 2, etc.)
- Episode buttons (S1EP-1, S1EP-2, etc.)
- Fullscreen video player when episodes are clicked
