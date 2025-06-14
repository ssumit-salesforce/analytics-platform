#!/bin/bash

echo "🚀 Setting up Analytics Platform MVP..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create project structure
echo "📁 Creating project structure..."
mkdir -p analytics-platform/{frontend/src,frontend/public,backend,database,uploads}

cd analytics-platform

# Create frontend HTML template
echo "📝 Creating frontend HTML template..."
cat > frontend/public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="Analytics Platform MVP" />
    <title>Analytics Platform</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
EOF

# Create frontend index.js
echo "📝 Creating frontend entry point..."
cat > frontend/src/index.js << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
EOF

# Create environment file
echo "📝 Creating environment configuration..."
cat > .env << 'EOF'
# Database Configuration
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=analytics_db
DB_PORT=5432

# Backend Configuration
NODE_ENV=development
PORT=3001

# Frontend Configuration
REACT_APP_API_URL=http://localhost:3001/api
EOF

echo "✅ Basic project structure created!"
echo ""
echo "📋 Manual Steps Required:"
echo "1. Save 'Backend Server Setup' artifact as → backend/server.js"
echo "2. Save 'Backend Package.json' artifact as → backend/package.json"
echo "3. Save 'Backend Dockerfile' artifact as → backend/Dockerfile"
echo "4. Save 'Frontend Main App Component' artifact as → frontend/src/App.js"
echo "5. Save 'Frontend Package.json' artifact as → frontend/package.json"
echo "6. Save 'Frontend Dockerfile' artifact as → frontend/Dockerfile"
echo "7. Save 'Docker Compose Development Setup' artifact as → docker-compose.yml"
echo "8. Save 'Database Initialization Script' artifact as → database/init.sql"
echo ""
echo "🚀 Then run: docker-compose up --build"
echo ""
echo "The application will be available at:"
echo "  Frontend: http://localhost:3000"
echo "  Backend API: http://localhost:3001"
echo "  Database: localhost:5432"