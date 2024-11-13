const app = require("./service.js");
const express = require("express");

app.use(express.json());

const port = process.argv[2] || 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
