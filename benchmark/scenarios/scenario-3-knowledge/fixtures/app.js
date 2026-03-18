const express = require('express');
const app = express();

app.use(express.json());

// TODO: Add routes here

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));

module.exports = app;
