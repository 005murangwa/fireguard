import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import extinguisherRoutes from './routes/extinguisher.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5003;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'extinguisher-service', port: PORT });
});

app.use('/extinguishers', extinguisherRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Extinguisher service running on http://localhost:${PORT}`);
});

export default app;
