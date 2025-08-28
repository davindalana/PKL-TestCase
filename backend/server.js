require('dotenv').config(); 
const express = require('express');
const apiRoutes = require('./routes/apiRoutes');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());

app.use(express.json({ limit: '50mb' }));
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.send('Server sinkronisasi berjalan!');
});

app.listen(PORT, () => {
  console.log(`🚀 Server listening at http://localhost:${PORT}`);
});