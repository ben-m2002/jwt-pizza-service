const config = require("./config.js").metrics;

const os = require("os");

function getCpuUsagePercentage() {
  const cpuUsage = os.loadavg()[0] / os.cpus().length;
  return cpuUsage.toFixed(2) * 100;
}

function getMemoryUsagePercentage() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsage = (usedMemory / totalMemory) * 100;
  return memoryUsage.toFixed(2);
}

function getLatencyInMilliseconds() {
  const start = process.hrtime();
  const [seconds, nanoseconds] = process.hrtime(start);
  return seconds * 1000 + nanoseconds / 1e6;
}

class Metrics {
  constructor() {
    this.requestCounts = {
      GET: 0,
      POST: 0,
      DELETE: 0,
      PUT: 0,
    };

    this.diffrentAuths = new Set();

    this.authSucceses = 0;
    this.authFailures = 0;

    this.pizzasSold = 0;
    this.creationFailed = 0;
    this.revenue = 0;

    this.averageServiceLatency = 0;
    this.sumServiceLatency = 0;
    this.averagePizzaLatency = 0;
    this.sumPizzaLatency = 0;

    // Periodically send metrics to Grafana
    const timer = setInterval(() => {
      Object.keys(this.requestCounts).forEach((method) => {
        this.sendMetricToGrafana(
          "request",
          method,
          "total",
          this.requestCounts[method],
        );
      });
      this.sendMetricToGrafana(
        "auth",
        "GET",
        "activeUsers",
        this.diffrentAuths.size,
      );
      this.sendMetricToGrafana("auth", "GET", "successes", this.authSucceses);
      this.sendMetricToGrafana("auth", "GET", "failures", this.authFailures);
      this.sendMetricToGrafana(
        "system",
        "GET",
        "cpuUsage",
        getCpuUsagePercentage(),
      );
      this.sendMetricToGrafana(
        "system",
        "GET",
        "memoryUsage",
        getMemoryUsagePercentage(),
      );
      this.sendMetricToGrafana("order", "GET", "pizzasSold", this.pizzasSold);
      this.sendMetricToGrafana(
        "order",
        "GET",
        "creationFailed",
        this.creationFailed,
      );
      this.sendMetricToGrafana("order", "GET", "revenue", this.revenue);
      this.sendMetricToGrafana(
        "latency",
        "GET",
        "service",
        this.averageServiceLatency,
      );
      this.sendMetricToGrafana(
        "latency",
        "GET",
        "pizza",
        this.averagePizzaLatency,
      );
    }, 10000);
    timer.unref();
  }

  measureLatency(req, res, next) {
    res.on("finish", () => {
      metrics.updateServiceLatency(getLatencyInMilliseconds());
    });
    next();
  }

  measurePizzaLatency(req, res, next) {
    res.on("finish", () => {
      metrics.updatePizzaLatency(getLatencyInMilliseconds());
    });
    next();
  }

  incrementRequests(method) {
    if (this.requestCounts[method] !== undefined) {
      this.requestCounts[method]++;
    }
  }

  incrementAuthSuccesses() {
    this.authSucceses++;
  }

  incrementAuthFailures() {
    this.authFailures++;
  }

  updateActiveUsers(auth) {
    this.diffrentAuths.add(auth);
  }

  updatePizzasSold(numPizzas) {
    this.pizzasSold += numPizzas;
  }

  incrementCreationFailed() {
    this.creationFailed++;
  }

  updateRevenue(revenue) {
    this.revenue += revenue;
  }

  updateServiceLatency(latency) {
    let totalRequests = 0;
    Object.keys(this.requestCounts).forEach((method) => {
      totalRequests += this.requestCounts[method];
    });
    this.sumServiceLatency += latency;
    this.averageServiceLatency = this.sumServiceLatency / totalRequests;
  }

  updatePizzaLatency(latency) {
    let totalPizzas = this.pizzasSold + this.creationFailed;
    this.sumPizzaLatency += latency;
    if (totalPizzas === 0) {
      totalPizzas = 1;
    }
    this.averagePizzaLatency = this.sumPizzaLatency / totalPizzas;
  }

  sendMetricToGrafana(metricPrefix, httpMethod, metricName, metricValue) {
    const metric = `${metricPrefix},source=${config.source},method=${httpMethod} ${metricName}=${metricValue}`;
    // fetch(`${config.url}`, {
    //   method: "post",
    //   body: metric,
    //   headers: { Authorization: `Bearer ${config.userId}:${config.apiKey}` },
    // })
    //   .then((response) => {
    //     if (!response.ok) {
    //       console.log(metric);
    //       console.error("Failed to push metrics data to Grafana Prom");
    //     } else {
    //       //console.log(`Pushed ${metric}`);
    //     }
    //   })
    //   .catch((error) => {
    //     console.error("Error pushing metrics:", error);
    //   });
    console.log(metric);
  }
}

const metrics = new Metrics();
module.exports = metrics;
