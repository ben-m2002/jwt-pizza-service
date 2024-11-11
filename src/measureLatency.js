const metrics = require("./metrics");

const measureLatency = (req, res, next) => {
  const start = process.hrtime();

  res.on("finish", () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const durationInMilliseconds = seconds * 1000 + nanoseconds / 1e6;
    metrics.updateServiceLatency(durationInMilliseconds);
  });

  next();
};

module.exports = measureLatency;
