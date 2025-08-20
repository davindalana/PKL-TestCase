const express = require('express');
const apiRoutes = require('./routes/apiRoutes');

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.send('Server sinkronisasi (Postgres -> MySQL) berjalan!');
});

app.listen(PORT, () => {
  console.log(`🚀 Server listening at http://localhost:${PORT}`);
});