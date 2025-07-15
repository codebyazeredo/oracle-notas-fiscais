const jwt = require('jsonwebtoken');
require('dotenv').config();

const payload = {
  app: 'oracle-notas-fiscais',
  env: 'production' 
};

const token = jwt.sign(payload, process.env.JWT_SECRET, {
  expiresIn: '365d'
});

console.log('Token JWT estático:', token);

/** EXECUTE:
 * node generateStaticToken.js
 */