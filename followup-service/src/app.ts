import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import followUpRoutes from './routes/follow-up.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5005;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'followup-service', port: PORT });
});

app.use('/follow-ups', followUpRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Follow-up service running on http://localhost:${PORT}`);
});

export default app;
