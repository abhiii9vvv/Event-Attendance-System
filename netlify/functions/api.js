// Netlify serverless function – wraps the Express app with serverless-http
const serverless = require('serverless-http');
const app = require('../../server/index.js');

const _handler = serverless(app);

// Netlify strips the /api prefix before calling the function, but Express
// routes are mounted at /api/*  – so we restore the prefix here.
module.exports.handler = (event, context) => {
  event.path = '/api/' + (event.path || '').replace(/^\//, '');
  return _handler(event, context);
};
