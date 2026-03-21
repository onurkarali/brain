const express = require('express');
const app = express();

app.use(express.json());

const usersRouter = require('./routes/users');
app.use('/users', usersRouter);

// Centralized error handler
app.use((err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Internal server error',
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));

module.exports = app;
