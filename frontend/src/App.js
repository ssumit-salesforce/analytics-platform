import React, { useState, useEffect } from 'react';
import { Upload, FileText, BarChart3, PlusCircle, Database, Activity } from 'lucide-react';

// API base URL
const API_BASE = 'http://localhost:3001/api';

// Utility functions
const api = {
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Upload failed');
    }
    
    return response.json();
  },
  
  async getDatasets() {
    const response = await fetch(`${API_BASE}/datasets`);
    return response.json();
  },
  
  async getDashboards() {
    const response = await fetch(`${API_BASE}/dashboards`);
    return response.json();
  },
  
  async createDashboard(name, description) {
    const response = await fetch(`${API_BASE}/dashboards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, config: {} }),
    });
    return response.json();
  },
  
  async queryData(datasetId, config) {
    const response = await fetch(`${API_BASE}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ datasetId, ...config }),
    });
    return response.json();
  }
};

// File Upload Component
const FileUploader = ({ onUploadSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      
      const result = await api.uploadFile(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        onUploadSuccess(result);
      }, 500);
    } catch (error) {
      console.error('Upload error:', error);
      setIsUploading(false);
      setUploadProgress(0);
      alert('Upload failed. Please try again.');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Upload className="mr-2" size={20} />
        Upload Data
      </h3>
      
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {isUploading ? (
          <div className="space-y-4">
            <Activity className="mx-auto animate-spin text-blue-500" size={32} />
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Uploading and processing...</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">{uploadProgress}%</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <FileText className="mx-auto text-gray-400" size={48} />
            <div>
              <p className="text-lg font-medium text-gray-900">
                Drop your files here
              </p>
              <p className="text-sm text-gray-500">
                Supports CSV, Excel files up to 100MB
              </p>
            </div>
            <label className="inline-block">
              <input
                type="file"
                className="hidden"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => {
                  if (e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <span className="px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors">
                Browse Files
              </span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
};

// Dataset List Component
const DatasetList = ({ datasets, onSelectDataset }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Database className="mr-2" size={20} />
        Your Datasets
      </h3>
      
      {datasets.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Database className="mx-auto mb-2" size={32} />
          <p>No datasets uploaded yet</p>
          <p className="text-sm">Upload a CSV or Excel file to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {datasets.map((dataset) => (
            <div
              key={dataset.id}
              className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onSelectDataset(dataset)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-900">{dataset.name}</h4>
                  <p className="text-sm text-gray-500">
                    {dataset.row_count} rows • {Object.keys(dataset.columns_info || {}).length} columns
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(dataset.created_at).toLocaleDateString()}
                  </p>
                </div>
                <BarChart3 className="text-blue-500" size={20} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Simple Chart Builder Component
const ChartBuilder = ({ dataset }) => {
  const [chartType, setChartType] = useState('bar');
  const [xAxis, setXAxis] = useState('');
  const [yAxis, setYAxis] = useState('');
  const [aggregation, setAggregation] = useState('sum');
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const columns = Object.keys(dataset.columns_info || {});
  const numericColumns = columns.filter(col => 
    dataset.columns_info[col]?.type === 'numeric'
  );
  const textColumns = columns.filter(col => 
    dataset.columns_info[col]?.type === 'text'
  );

  const generateChart = async () => {
    if (!xAxis || !yAxis) return;
    
    setIsLoading(true);
    try {
      const data = await api.queryData(dataset.id, {
        groupBy: xAxis,
        aggregation: { column: yAxis, function: aggregation }
      });
      
      setChartData(data.slice(0, 10)); // Limit to 10 items for display
    } catch (error) {
      console.error('Chart generation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const maxValue = Math.max(...chartData.map(d => d.value || 0));

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <BarChart3 className="mr-2" size={20} />
        Chart Builder - {dataset.name}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chart Type
          </label>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="bar">Bar Chart</option>
            <option value="line">Line Chart</option>
            <option value="pie">Pie Chart</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            X-Axis (Category)
          </label>
          <select
            value={xAxis}
            onChange={(e) => setXAxis(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select column...</option>
            {textColumns.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Y-Axis (Value)
          </label>
          <select
            value={yAxis}
            onChange={(e) => setYAxis(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select column...</option>
            {numericColumns.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Aggregation
          </label>
          <select
            value={aggregation}
            onChange={(e) => setAggregation(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="sum">Sum</option>
            <option value="avg">Average</option>
            <option value="count">Count</option>
            <option value="max">Maximum</option>
            <option value="min">Minimum</option>
          </select>
        </div>
      </div>
      
      <button
        onClick={generateChart}
        disabled={!xAxis || !yAxis || isLoading}
        className="mb-6 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Generating...' : 'Generate Chart'}
      </button>
      
      {chartData.length > 0 && (
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-4">
            {aggregation.charAt(0).toUpperCase() + aggregation.slice(1)} of {yAxis} by {xAxis}
          </h4>
          
          {chartType === 'bar' && (
            <div className="space-y-2">
              {chartData.map((item, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-20 text-sm text-gray-600 truncate">
                    {item[xAxis]}
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                    <div
                      className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${(item.value / maxValue) * 100}%` }}
                    >
                      <span className="text-xs text-white font-medium">
                        {item.value}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {chartType === 'line' && (
            <div className="h-48 flex items-end space-x-1">
              {chartData.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-blue-500 rounded-t"
                    style={{ height: `${(item.value / maxValue) * 100}%` }}
                  ></div>
                  <div className="text-xs text-gray-600 mt-2 truncate">
                    {item[xAxis]}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Main App Component
const AnalyticsPlatform = () => {
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [activeTab, setActiveTab] = useState('upload');

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    try {
      const data = await api.getDatasets();
      setDatasets(data);
    } catch (error) {
      console.error('Failed to load datasets:', error);
    }
  };

  const handleUploadSuccess = (result) => {
    console.log('Upload successful:', result);
    loadDatasets();
    setActiveTab('datasets');
  };

  const handleSelectDataset = (dataset) => {
    setSelectedDataset(dataset);
    setActiveTab('chart');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <BarChart3 className="text-blue-500" size={32} />
              <h1 className="text-2xl font-bold text-gray-900">
                Analytics Platform
              </h1>
            </div>
            <div className="text-sm text-gray-500">
              MVP Foundation
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('upload')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'upload'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Upload Data
            </button>
            <button
              onClick={() => setActiveTab('datasets')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'datasets'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Datasets ({datasets.length})
            </button>
            {selectedDataset && (
              <button
                onClick={() => setActiveTab('chart')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'chart'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Chart Builder
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'upload' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Get Started
              </h2>
              <p className="text-gray-600 mb-6">
                Upload your data files to begin creating analytics dashboards and visualizations.
              </p>
            </div>
            <FileUploader onUploadSuccess={handleUploadSuccess} />
            
            {datasets.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Database className="text-blue-500 mr-2" size={20} />
                  <div>
                    <h3 className="text-sm font-medium text-blue-900">
                      Ready to analyze!
                    </h3>
                    <p className="text-sm text-blue-700">
                      You have {datasets.length} dataset{datasets.length !== 1 ? 's' : ''} uploaded. 
                      Switch to the Datasets tab to start building charts.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'datasets' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Your Datasets
              </h2>
              <p className="text-gray-600 mb-6">
                Select a dataset to start building charts and visualizations.
              </p>
            </div>
            <DatasetList 
              datasets={datasets} 
              onSelectDataset={handleSelectDataset}
            />
          </div>
        )}

        {activeTab === 'chart' && selectedDataset && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Build Your Chart
              </h2>
              <p className="text-gray-600 mb-6">
                Create visualizations from your data using our drag-and-drop chart builder.
              </p>
            </div>
            <ChartBuilder dataset={selectedDataset} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>Analytics Platform MVP - Built with React & Node.js</p>
            <p className="mt-2">Features: File Upload • Data Processing • Chart Builder</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AnalyticsPlatform;
