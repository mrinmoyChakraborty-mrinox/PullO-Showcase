const http = require('http');

const PORT = 5502;

const server = http.createServer((req, res) => {
  // Capture the search parameters (e.g. ?code=...)
  const search = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
  const finalUrl = `http://localhost:3000/dashboard${search}`;
  
  console.log(`Redirecting from ${req.url} -> ${finalUrl}`);
  
  res.writeHead(302, {
    'Location': finalUrl
  });
  res.end();
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[Pullo Auth Fix] Redirector active on http://127.0.0.1:${PORT}`);
  console.log(`Will forward Supabase auth redirects to http://localhost:3000/dashboard`);
});
