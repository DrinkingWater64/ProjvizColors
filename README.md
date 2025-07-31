# ProjVizColors - 3D Room Visualization

A Three.js application for visualizing a room by changing colors and tiles. This project allows users to interactively modify materials, textures, and lighting in a 3D room environment.

## Features

- **3D Room Visualization**: Interactive 3D room with walls, floors, and props
- **Material System**: Change materials and textures for walls and floors
- **Interactive GUI**: Real-time controls using dat.GUI
- **Screen Space Reflections (SSR)**: Advanced rendering effects
- **Custom Texture Upload**: Upload your own textures
- **Environment Lighting**: Adjustable HDR environment maps
- **Loading System**: Custom loader with progress tracking

## Project Structure

```
ProjVizColors/
├── src/
│   ├── main.js          # Main Three.js application
│   ├── style.css        # Main styles
│   ├── loader.css       # Loading screen styles
│   └── loader.js        # Loading system
├── public/
│   ├── models/          # 3D models (GLTF/GLB)
│   ├── textures/        # Texture files
│   ├── floor/           # Floor textures
│   ├── beige_wall/      # Wall textures
│   └── ...              # Other texture folders
├── package.json         # Dependencies and scripts
└── index.html          # Main HTML file
```

## Docker Setup

This project is fully dockerized for easy deployment and development.

### Production Build

To run the production version:

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or build and run manually
docker build -t projvizcolors .
docker run -p 3000:3000 projvizcolors
```

The application will be available at `http://localhost:3000`

### Development Build

For development with hot reloading:

```bash
# Run development server
docker-compose -f docker-compose.dev.yml up --build
```

The development server will be available at `http://localhost:5173`

### Manual Development Setup

If you prefer to run without Docker:

```bash
cd ProjVizColors
npm install
npm run dev
```

## Usage

### Controls

- **Mouse/Touch**: Orbit camera around the room
- **GUI Controls**: 
  - Material Editor: Change surface materials and textures
  - Environment Lighting: Adjust lighting and exposure
  - Screen Space Reflections: Configure SSR effects
  - Shadows: Control shadow opacity
  - Additional Lighting: Fine-tune ambient and area lights

### Material System

1. **Select Surface**: Choose a wall or floor from the dropdown
2. **Choose Material**: Select from predefined materials (Wood, Beige, Ceramic, Plaster, Floral)
3. **Upload Custom Texture**: Click "Upload Custom Texture" to use your own images
4. **Adjust Properties**: Modify color, tiling, and rotation

### Texture Upload

- Supported formats: PNG, JPG, JPEG
- Uploaded textures will use the Ceramic material settings as a base
- Custom textures are preserved during material changes

## Technical Details

### Dependencies

- **Three.js**: 3D graphics library
- **Vite**: Build tool and dev server
- **dat.GUI**: GUI controls
- **RGBELoader**: HDR environment loading
- **GLTFLoader**: 3D model loading

### Rendering Features

- **Screen Space Reflections (SSR)**: Realistic reflections
- **HDR Environment Mapping**: High dynamic range lighting
- **PBR Materials**: Physically based rendering
- **Post-processing**: Advanced visual effects

### Performance

- Optimized texture loading with progress tracking
- Efficient material system with texture reuse
- Responsive controls with damping
- Adaptive quality settings

## Docker Configuration

### Production Dockerfile

- Uses Node.js 18 Alpine for smaller image size
- Builds the application with Vite
- Serves static files with `serve` package
- Exposes port 3000

### Development Dockerfile

- Includes all development dependencies
- Runs Vite dev server with hot reloading
- Mounts source code for live updates
- Exposes port 5173

### Docker Compose

- **Production**: `docker-compose.yml` - Single service for production
- **Development**: `docker-compose.dev.yml` - Development with volume mounts

## Environment Variables

- `NODE_ENV`: Set to `production` or `development`
- Port mappings can be customized in docker-compose files

## Troubleshooting

### Common Issues

1. **Port already in use**: Change the port mapping in docker-compose files
2. **Asset loading errors**: Ensure all texture files are in the correct public folders
3. **Performance issues**: Reduce SSR quality or disable some effects in the GUI

### Development Tips

- Use the development Docker setup for live code changes
- Check browser console for loading progress and errors
- GUI controls allow real-time parameter adjustment
- Material changes are applied immediately to selected surfaces

## License

This project is a work in progress (WIP).
