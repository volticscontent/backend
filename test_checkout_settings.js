const http = require('http');

const serviceId = 'cmm4lxxl5000dhstf1v4l3vcb'; // Demo Service ID
const dataSourceId = 'cmm4lxxm4000fhstfsnd6scv2'; // Tracking DataSource ID

const data = JSON.stringify({
  pixels: {
    facebook: '123456789',
    google: 'G-12345',
    tiktok: 'T-12345'
  },
  config: {
    collectPhone: true,
    collectAddress: false,
    onePageCheckout: true
  },
  dataSourceId: dataSourceId
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: `/api/services/${serviceId}/checkout/settings`,
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtbTRpb29iajAwMDBtd3RmazF1dGhzMzgiLCJyb2xlIjoiT1dORVIiLCJzbHVnIjoiZGVtby1jbGllbnQiLCJtZW1iZXJJZCI6bnVsbCwiaWF0IjoxNzcyMjcyNjUzLCJleHAiOjE3NzIzNTkwNTN9.ZVZRuRNcBYYBHHVhkrh707LYgM-NaCesBZGeQDLd_0A'
  }
};

console.log(`[Test] Updating settings for service ${serviceId}...`);
const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let body = '';
  res.on('data', (d) => {
    body += d;
  });
  res.on('end', () => {
    console.log('BODY:', body);
    
    // Now verify with GET
    console.log(`\n[Test] Verifying settings for service ${serviceId}...`);
    const getOptions = { ...options, method: 'GET' };
    delete getOptions.headers['Content-Length'];
    
    const getReq = http.request(getOptions, (getRes) => {
      console.log(`GET STATUS: ${getRes.statusCode}`);
      let getBody = '';
      getRes.on('data', (d) => getBody += d);
      getRes.on('end', () => {
        console.log('GET BODY:', getBody);
      });
    });
    getReq.end();
  });
});

req.on('error', (e) => {
  console.error('ERROR:', e);
});

req.write(data);
req.end();
