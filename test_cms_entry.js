const http = require('http');

const data = JSON.stringify({
  data: {
    name: 'Novo Produto de Teste Auto-Sync 3',
    price: 399.90,
    description: 'Este produto deve sincronizar automaticamente com Stripe - Tentativa 3',
    image: 'https://placehold.co/400x300?text=AutoSync3',
    sku: 'AUTO-003',
    active: true
  },
  status: 'PUBLISHED'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/cms/write/products', // Removed demo-client from path
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtbTRpb29iajAwMDBtd3RmazF1dGhzMzgiLCJyb2xlIjoiT1dORVIiLCJzbHVnIjoiZGVtby1jbGllbnQiLCJtZW1iZXJJZCI6bnVsbCwiaWF0IjoxNzcyMjcyNjUzLCJleHAiOjE3NzIzNTkwNTN9.ZVZRuRNcBYYBHHVhkrh707LYgM-NaCesBZGeQDLd_0A'
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
