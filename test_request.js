const http = require('http');

const data = JSON.stringify({
  productId: 'cmm4lxxku000ehstflroky2cb' // Fone Bluetooth ANC
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/demo-client/stripe/sync-cms-product',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtbTRpb29iajAwMDBtd3RmazF1dGhzMzgiLCJyb2xlIjoiT1dORVIiLCJzbHVnIjoiZGVtby1jbGllbnQiLCJtZW1iZXJJZCI6bnVsbCwiaWF0IjoxNzcyMjcyNjUzLCJleHAiOjE3NzIzNTkwNTN9.ZVZRuRNcBYYBHHVhkrh707LYgM-NaCesBZGeQDLd_0A'
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', (d) => {
    process.stdout.write(d);
  });
});

req.on('error', (e) => { 
  console.error(e);
});

req.write(data);
req.end();
