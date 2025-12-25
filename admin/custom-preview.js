
// Custom logic for auto-incrementing season and episode numbers
CMS.registerEventListener({
  name: 'preSave',
  handler: ({ entry }) => {
    const data = entry.get('data');
    const seasons = data.get('seasons');
    
    if (seasons) {
      // Auto-increment season numbers
      const updatedSeasons = seasons.map((season, index) => {
        let updatedSeason = season;
        
        // If season_number is missing or is 1 and it's not the first season, auto-increment
        if (!season.get('season_number') || (season.get('season_number') === 1 && index > 0)) {
          updatedSeason = season.set('season_number', index + 1);
        }
        
        // Auto-increment episode numbers within this season
        const episodes = season.get('episodes');
        if (episodes) {
          const updatedEpisodes = episodes.map((episode, episodeIndex) => {
            if (!episode.get('episode_number') || (episode.get('episode_number') === 1 && episodeIndex > 0)) {
              return episode.set('episode_number', episodeIndex + 1);
            }
            return episode;
          });
          updatedSeason = updatedSeason.set('episodes', updatedEpisodes);
        }
        
        return updatedSeason;
      });
      
      return entry.get('data').set('seasons', updatedSeasons);
    }
    
    return data;
  }
});

// Add custom widget behavior for better UX
CMS.registerWidget('number', class extends React.Component {
  render() {
    const { value, field, onChange } = this.props;
    const fieldName = field.get('name');
    
    // For season/episode numbers, provide smart defaults
    if (fieldName === 'season_number' || fieldName === 'episode_number') {
      const defaultValue = value || 1;
      
      return React.createElement('div', { className: 'auto-increment-wrapper' },
        React.createElement('input', {
          type: 'number',
          value: defaultValue,
          min: field.get('min') || 1,
          onChange: (e) => onChange(parseInt(e.target.value, 10)),
          placeholder: field.get('hint') || 'Auto-increments'
        })
      );
    }
    
    // Default number widget behavior
    return React.createElement('input', {
      type: 'number',
      value: value || '',
      onChange: (e) => onChange(e.target.value ? parseInt(e.target.value, 10) : null)
    });
  }
});
