import dotenv from 'dotenv';
dotenv.config();

import app from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`👉 Master API: http://localhost:${PORT}/api/master`);
  console.log(`👉 Client API: http://localhost:${PORT}/api/[client_slug]`);
});

// Trigger restart
