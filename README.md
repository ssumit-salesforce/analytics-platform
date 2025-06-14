# Analytics Platform MVP

A user-friendly analytics platform that allows anyone to upload data, create visualizations, and build dashboards without technical expertise.

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose installed
- Node.js 18+ (for local development)
- PostgreSQL (if running without Docker)

### Option 1: Docker Setup (Recommended)

1. **Create the project structure:**
```bash
mkdir analytics-platform
cd analytics-platform
mkdir -p frontend/src frontend/public backend database uploads
```

2. **Setup Backend:**
```bash
cd backend
# Create package.json (copy content from Backend Package.json artifact)
# Create server.js (copy content from Backend Server Setup artifact)
# Create Dockerfile (copy content from Backend Dockerfile artifact)
cd ..
```

3. **Setup Frontend:**
```bash
cd frontend
# Create package.json (copy content from Frontend Package.json artifact)
# Create src/App.js (copy content from Frontend Main App Component artifact)
# Create Dockerfile (copy content from Frontend Dockerfile artifact)

# Create public/index.html
cat > public/index.html << 'EOF'
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

# Create src/index.js
cat > src/index.js << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
EOF

cd ..
```

4. **Create Docker Compose file:**
```bash
# Copy content from Docker Compose Development Setup artifact
# Save as docker-compose.yml in the root directory
```

5. **Start the application:**
```bash
docker-compose up --build
```

### Option 2: Local Development Setup

1. **Setup Backend:**
```bash
cd backend
npm install
npm run dev
```

2. **Setup Database:**
```bash
# Install PostgreSQL locally
# Create database: analytics_db
# Update connection settings in server.js
```

3. **Setup Frontend:**
```bash
cd frontend
npm install
npm start
```

## 📋 Features

### Current MVP Features
- ✅ **File Upload**: CSV and Excel file support with drag-and-drop
- ✅ **Data Processing**: Automatic data type detection and analysis
- ✅ **Chart Builder**: Interactive chart creation with aggregations
- ✅ **Visualizations**: Bar charts, line charts, and pie charts
- ✅ **Data Management**: Dataset listing and selection
- ✅ **Responsive UI**: Mobile-friendly interface

### Planned Features (Next Phases)
- 🔄 **Advanced Charts**: Scatter plots, heatmaps, and custom visualizations
- 🔄 **Dashboard Builder**: Drag-and-drop dashboard creation
- 🔄 **Data Connectors**: Snowflake, Google Cloud, Salesforce integration
- 🔄 **AI Assistant**: Natural language queries and automated insights
- 🔄 **Real-time Updates**: Live data streaming and updates
- 🔄 **Collaboration**: Share dashboards and collaborate with teams

## 🛠️ Architecture

### Tech Stack
- **Frontend**: React 18, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express, PostgreSQL
- **Database**: PostgreSQL (primary), Redis (caching)
- **Deployment**: Docker, Docker Compose

### Project Structure
```
analytics-platform/
├── frontend/                 # React application
│   ├── src/
│   │   ├── App.js           # Main application component
│   │   └── index.js         # React entry point
│   ├── public/
│   │   └── index.html       # HTML template
│   ├── package.json         # Dependencies
│   └── Dockerfile           # Container configuration
├── backend/                 # Node.js API server
│   ├── server.js           # Main server file
│   ├── package.json        # Dependencies
│   └── Dockerfile          # Container configuration
├── database/               # Database scripts
│   └── init.sql           # Initialization script
├── uploads/               # File upload directory
└── docker-compose.yml     # Development environment
```

## 🔧 API Endpoints

### Upload & Data Management
- `POST /api/upload` - Upload CSV/Excel files
- `GET /api/datasets` - List all datasets
- `GET /api/datasets/:id/data` - Get dataset data

### Dashboard & Charts
- `POST /api/dashboards` - Create dashboard
- `GET /api/dashboards` - List dashboards
- `POST /api/charts` - Create chart
- `GET /api/dashboards/:id/charts` - Get dashboard charts

### Data Query
- `POST /api/query` - Execute data queries with aggregations

## 📊 Usage Guide

### 1. Upload Data
1. Navigate to the "Upload Data" tab
2. Drag and drop your CSV or Excel file
3. Wait for processing to complete
4. View the uploaded dataset in the "Datasets" tab

### 2. Create Charts
1. Select a dataset from the "Datasets" tab
2. Click on the dataset to open the Chart Builder
3. Configure your chart:
   - Choose chart type (Bar, Line, Pie)
   - Select X-axis (categories) and Y-axis (values)
   - Pick aggregation method (Sum, Average, Count, etc.)
4. Click "Generate Chart" to create visualization

### 3. Analyze Data
- View automatically generated data insights
- Explore different chart configurations
- Analyze trends and patterns in your data

## 🚧 Development

### Local Development
```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm start

# Database
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:15
```

### Adding New Features
1. **Backend**: Add new routes in `server.js`
2. **Frontend**: Create new components in `src/`
3. **Database**: Add migrations to `database/`

### Testing
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 🔒 Security Considerations

- File upload size limits (100MB)
- Input validation and sanitization
- SQL injection prevention with parameterized queries
- CORS configuration for cross-origin requests

## 📈 Performance Optimization

- Data pagination for large datasets
- Lazy loading for charts and components
- Database indexing for faster queries
- Caching with Redis for frequently accessed data

## 🐛 Troubleshooting

### Common Issues

1. **Docker containers not starting:**
   - Check Docker daemon is running
   - Verify port availability (3000, 3001, 5432)
   - Check logs: `docker-compose logs`

2. **Database connection errors:**
   - Ensure PostgreSQL is running
   - Verify connection credentials
   - Check database exists

3. **File upload issues:**
   - Verify file format (CSV, Excel)
   - Check file size limits
   - Ensure uploads directory exists

4. **Chart not generating:**
   - Verify data types (numeric columns for Y-axis)
   - Check for empty or null values
   - Ensure proper column selection

### Logs and Debugging
```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For issues and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

---

**Next Steps**: Once you have the MVP running, you can extend it with advanced features like AI integration, more connectors, and enhanced visualizations!