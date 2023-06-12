// server.js
const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const port = 3000;
app.use(cors());


app.get('/generate-token', (req, res) => {
  const secretKey = 'your_secret_key';
  console.log("Payload :", req.query);
  const payload = req.query;
  const token = jwt.sign(payload, secretKey);
  console.log("Token : ", token);
  res.json({ token });
});

app.get('/decode-token', (req, res) => {

  const token = req.query.token;
  const decodedToken = jwt.decode(token, { complete: true });
  console.log("decodedToken Token :", decodedToken);

  const decoded = jwt.verify(token, 'your_secret_key');
  console.log("Decoded : ",decoded) ;
  res.json({ decodedToken });
});




app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
