# MahsaNet Alert Proejct

Live Site: https://alert.mahsanet.com

# Mahsa Alert

A real-time alert system for Iran showing missile strikes, nuclear facilities, and evacuation areas.

## Features

- **Real-time Map**: Interactive map showing missile strikes, nuclear facilities, and evacuation areas
- **Layer Filtering**: Toggle visibility of different map layers
- **User Location**: Get your current location and proximity alerts
- **Evacuation Areas**: Navigate through evacuation areas with the EvacSlider component
- **Responsive Design**: Works on both desktop and mobile devices
- **Dark/Light Theme**: Toggle between dark and light themes

## Components

### EvacSlider

The EvacSlider component uses shadcn's Drawer component to provide an elegant interface for navigating evacuation areas. It features:

- **Drawer Interface**: Modern bottom drawer that slides up from the bottom of the screen
- **Trigger Row**: A compact trigger button positioned at the bottom of the page
  - **Desktop**: Centered with appropriate spacing from the bottom
  - **Mobile**: Full-width trigger for better touch interaction
- **Arrow Navigation**: Left and right arrow buttons surrounding the evacuation date
- **Date Display**: Shows the evacuation date in Persian format between the navigation arrows
- **Slider Control**: Fine-grained control with a range slider below the date
- **Area Counter**: Shows current area position (e.g., "1 از 2" - 1 of 2)
- **Auto-zoom**: Automatically zooms to the selected evacuation area on the map
- **Smooth Animations**: Native drawer animations with backdrop blur

The component automatically extracts evacuation areas from the GeoJSON data, sorts them by date (newest first), and provides an intuitive interface for exploring the evacuation zones with a modern drawer UI.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── EvacSlider.tsx          # Evacuation area navigation with drawer interface
│   ├── MapComponent.tsx        # Main map component
│   ├── LayerFilter.tsx         # Layer visibility controls
│   └── ...
├── ui/
│   ├── drawer.tsx              # shadcn drawer component
│   └── theme-provider.tsx      # Theme provider
├── map-entities/
│   ├── borders/                # Border and evacuation area data
│   ├── layers/                 # Map layer configurations
│   └── user-location/          # User location handling
└── ...
```
