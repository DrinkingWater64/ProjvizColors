#!/bin/bash

# ProjVizColors Docker Startup Script

echo "🚀 Starting ProjVizColors..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Function to show usage
show_usage() {
    echo "Usage: $0 [production|development]"
    echo ""
    echo "Options:"
    echo "  production   - Run production build (default)"
    echo "  development  - Run development build with hot reloading"
    echo ""
    echo "Examples:"
    echo "  $0              # Run production"
    echo "  $0 production   # Run production"
    echo "  $0 development  # Run development"
}

# Parse command line arguments
MODE=${1:-production}

case $MODE in
    production)
        echo "🏗️  Building and starting production version..."
        docker-compose up --build
        ;;
    development)
        echo "🔧 Building and starting development version..."
        docker-compose -f docker-compose.dev.yml up --build
        ;;
    *)
        echo "❌ Invalid mode: $MODE"
        show_usage
        exit 1
        ;;
esac 