const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/demo-client/dashboard',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtbTRpb29iajAwMDBtd3RmazF1dGhzMzgiLCJyb2xlIjoiT1dORVIiLCJzbHVnIjoiZGVtby1jbGllbnQiLCJtZW1iZXJJZCI6bnVsbCwiaWF0IjoxNzcyMjcyNjUzLCJleHAiOjE3NzIzNTkwNTN9.ZVZRuRNcBYYBHHVhkrh707LYgM-NaCesBZGeQDLd_0A'
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('BODY:', body);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.end();
