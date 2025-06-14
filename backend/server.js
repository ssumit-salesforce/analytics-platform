const express = require('express');
const cors = require('cors');
const multer = require('multer');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'analytics_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Initialize database tables
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS datasets (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        original_filename VARCHAR(255),
        file_path VARCHAR(500),
        columns_info JSONB,
        row_count INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS dashboards (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        config JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS charts (
        id SERIAL PRIMARY KEY,
        dashboard_id INTEGER REFERENCES dashboards(id),
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        config JSONB,
        dataset_id INTEGER REFERENCES datasets(id),
        position JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// Helper function to analyze CSV structure
function analyzeData(data) {
  if (!data || data.length === 0) return {};
  
  const sample = data.slice(0, 100); // Analyze first 100 rows
  const columns = Object.keys(sample[0]);
  const analysis = {};

  columns.forEach(col => {
    const values = sample.map(row => row[col]).filter(val => val !== null && val !== '');
    const numericValues = values.filter(val => !isNaN(val) && val !== '');
    
    analysis[col] = {
      type: numericValues.length > values.length * 0.8 ? 'numeric' : 'text',
      hasNulls: values.length < sample.length,
      uniqueValues: [...new Set(values)].length,
      sampleValues: values.slice(0, 5)
    };
  });

  return analysis;
}

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Upload and parse CSV/Excel files
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;
    const fileExt = path.extname(fileName).toLowerCase();
    
    let data = [];
    let columns = [];

    // Parse based on file type
    if (fileExt === '.csv') {
      data = await new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (row) => results.push(row))
          .on('end', () => resolve(results))
          .on('error', reject);
      });
    } else if (['.xlsx', '.xls'].includes(fileExt)) {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      data = XLSX.utils.sheet_to_json(worksheet);
    } else {
      return res.status(400).json({ error: 'Unsupported file format' });
    }

    if (data.length === 0) {
      return res.status(400).json({ error: 'No data found in file' });
    }

    columns = Object.keys(data[0]);
    const analysis = analyzeData(data);

    // Store dataset metadata
    const result = await pool.query(`
      INSERT INTO datasets (name, original_filename, file_path, columns_info, row_count)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [
      fileName.replace(/\.[^/.]+$/, ""), // Remove extension
      fileName,
      filePath,
      JSON.stringify(analysis),
      data.length
    ]);

    const datasetId = result.rows[0].id;

    // Create dynamic table for the dataset
    const tableName = `dataset_${datasetId}`;
    const columnDefs = columns.map(col => {
      const colType = analysis[col]?.type === 'numeric' ? 'NUMERIC' : 'TEXT';
      return `"${col}" ${colType}`;
    }).join(', ');

    await pool.query(`CREATE TABLE ${tableName} (id SERIAL PRIMARY KEY, ${columnDefs})`);

    // Insert data into the table
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    const insertQuery = `INSERT INTO ${tableName} (${columns.map(col => `"${col}"`).join(', ')}) VALUES (${placeholders})`;
    
    for (const row of data) {
      const values = columns.map(col => row[col] || null);
      await pool.query(insertQuery, values);
    }

    res.json({
      success: true,
      datasetId,
      fileName,
      rowCount: data.length,
      columns: analysis,
      preview: data.slice(0, 5)
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

// Get datasets
app.get('/api/datasets', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM datasets ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching datasets:', error);
    res.status(500).json({ error: 'Failed to fetch datasets' });
  }
});

// Get dataset data
app.get('/api/datasets/:id/data', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 100, offset = 0 } = req.query;
    
    const tableName = `dataset_${id}`;
    const result = await pool.query(`SELECT * FROM ${tableName} LIMIT $1 OFFSET $2`, [limit, offset]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching dataset data:', error);
    res.status(500).json({ error: 'Failed to fetch dataset data' });
  }
});

// Create dashboard
app.post('/api/dashboards', async (req, res) => {
  try {
    const { name, description, config } = req.body;
    
    const result = await pool.query(`
      INSERT INTO dashboards (name, description, config)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [name, description, JSON.stringify(config || {})]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating dashboard:', error);
    res.status(500).json({ error: 'Failed to create dashboard' });
  }
});

// Get dashboards
app.get('/api/dashboards', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM dashboards ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching dashboards:', error);
    res.status(500).json({ error: 'Failed to fetch dashboards' });
  }
});

// Create chart
app.post('/api/charts', async (req, res) => {
  try {
    const { dashboard_id, name, type, config, dataset_id, position } = req.body;
    
    const result = await pool.query(`
      INSERT INTO charts (dashboard_id, name, type, config, dataset_id, position)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [dashboard_id, name, type, JSON.stringify(config), dataset_id, JSON.stringify(position)]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating chart:', error);
    res.status(500).json({ error: 'Failed to create chart' });
  }
});

// Get charts for dashboard
app.get('/api/dashboards/:id/charts', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM charts WHERE dashboard_id = $1', [id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching charts:', error);
    res.status(500).json({ error: 'Failed to fetch charts' });
  }
});

// Query data for chart
app.post('/api/query', async (req, res) => {
  try {
    const { datasetId, aggregation, groupBy, filters } = req.body;
    
    const tableName = `dataset_${datasetId}`;
    let query = `SELECT `;
    
    if (groupBy) {
      query += `"${groupBy}", `;
    }
    
    if (aggregation && aggregation.column && aggregation.function) {
      const func = aggregation.function.toUpperCase();
      query += `${func}("${aggregation.column}") as value `;
    } else {
      query += `* `;
    }
    
    query += `FROM ${tableName}`;
    
    if (filters && filters.length > 0) {
      const conditions = filters.map((filter, i) => {
        return `"${filter.column}" ${filter.operator} $${i + 1}`;
      }).join(' AND ');
      query += ` WHERE ${conditions}`;
    }
    
    if (groupBy) {
      query += ` GROUP BY "${groupBy}"`;
    }
    
    query += ` LIMIT 1000`;
    
    const values = filters ? filters.map(f => f.value) : [];
    const result = await pool.query(query, values);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ error: 'Query failed', details: error.message });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initializeDatabase();
});

module.exports = app;