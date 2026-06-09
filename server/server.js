require('dotenv').config();
const app = require('./src/app');
const { connectDB } = require('./src/config/db');
const { initEureka } = require('./src/config/eureka');
const { startScheduler } = require('./src/services/scheduler.service');

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  await connectDB();
  initEureka();
  startScheduler();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

bootstrap().catch(console.error);
