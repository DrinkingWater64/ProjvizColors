# Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Prerequisites
- Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Ensure Docker is running

### 2. Run the Application

**Option A: Using the provided scripts**
```bash
# On Windows
start.bat

# On Linux/Mac
chmod +x start.sh
./start.sh
```

**Option B: Using Docker Compose directly**
```bash
# Production version
docker-compose up --build

# Development version (with hot reloading)
docker-compose -f docker-compose.dev.yml up --build
```

**Option C: Manual Docker commands**
```bash
# Build the image
docker build -t projvizcolors .

# Run the container
docker run -p 3000:3000 projvizcolors
```

### 3. Access the Application
- **Production**: Open http://localhost:3000
- **Development**: Open http://localhost:5173

## 🎮 How to Use

1. **Navigate**: Use mouse/touch to orbit around the room
2. **Select Surface**: Choose a wall or floor from the GUI dropdown
3. **Change Materials**: Select from predefined materials or upload your own
4. **Adjust Settings**: Use the GUI controls to modify lighting, reflections, and more

## 🔧 Development

For development with live code changes:
```bash
docker-compose -f docker-compose.dev.yml up --build
```

The development server will automatically reload when you modify files in the `ProjVizColors/src/` directory.

## 🐛 Troubleshooting

**Port already in use?**
- Change the port in docker-compose files
- Or stop other services using the same port

**Build fails?**
- Ensure Docker Desktop is running
- Try `docker system prune` to clean up

**Assets not loading?**
- Check browser console for errors
- Ensure all texture files are in the correct public folders

## 📁 Project Structure
```
ProjVizColors/
├── src/           # Source code
├── public/        # Assets (models, textures)
├── Dockerfile     # Production build
├── Dockerfile.dev # Development build
└── docker-compose*.yml # Container orchestration
```

## 🎯 What You Can Do

- **Visualize Rooms**: Explore the 3D room environment
- **Change Materials**: Apply different textures to walls and floors
- **Upload Textures**: Use your own images as materials
- **Adjust Lighting**: Control environment and artificial lighting
- **Configure Effects**: Tune screen space reflections and shadows
- **Real-time Editing**: See changes immediately in the 3D view

## 📞 Need Help?

- Check the main README.md for detailed documentation
- Look at browser console for error messages
- Ensure all dependencies are properly installed 