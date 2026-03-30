// Quick test for waiting room API
const http = require('http');

const postData = JSON.stringify({
  host: "60a7f2c9e3b1f9a1d2e6b3a4",
  facilityId: "69c53858f2c41d344e68feb7",
  sportTypeId: "69c53858f2c41d344e68feca",
  date: "2026-04-01",
  startTime: "18:00",
  endTime: "20:00",
  maxPlayers: 4
});

const options = {
  hostname: 'localhost',
  port: 3089,
  path: '/api/waiting-rooms',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': postData.length
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', JSON.parse(data));
  });
});

req.on('error', (error) => {
  console.error('Request Error:', error);
  console.error('Error Message:', error.message);
  console.error('Error Code:', error.code);
});

req.write(postData);
req.end();
