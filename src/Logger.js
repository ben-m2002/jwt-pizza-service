const config = require("./config.js").logging;

class Logger {
  httpLogger = (req, res, next) => {
    let send = res.send;
    res.send = (resBody) => {
      const logData = {
        authorized: !!req.headers.authorization,
        path: req.path,
        method: req.method,
        statusCode: res.statusCode,
        reqBody: JSON.stringify(req.body),
        resBody: JSON.stringify(resBody),
      };
      const level = this.statusToLogLevel(res.statusCode);
      this.log(level, "http", logData);
      res.send = send;
      return res.send(resBody);
    };
    next();
  };

  log(level, type, logData) {
    const labels = { component: config.source, level: level, type: type };
    const values = [this.nowString(), this.sanitize(logData)];
    const logEvent = { streams: [{ stream: labels, values: [values] }] };

    this.sendLogToGrafana(logEvent);
  }

  statusToLogLevel(statusCode) {
    if (statusCode >= 500) return "error";
    if (statusCode >= 400) return "warn";
    return "info";
  }

  nowString() {
    return (Math.floor(Date.now()) * 1000000).toString();
  }

  sanitize(logData) {
    const sensitiveFields = ["password", "token", "jwt"];

    function sanitizeObject(obj) {
      for (let key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          if (sensitiveFields.includes(key.toLowerCase())) {
            obj[key] = "*****"; // Mask sensitive field
          } else if (typeof obj[key] === "object" && obj[key] !== null) {
            sanitizeObject(obj[key]);
          }
        }
      }
    }

    function parseAndSanitizeString(str) {
      try {
        const parsed = JSON.parse(str);
        if (typeof parsed === "object" && parsed !== null) {
          sanitizeObject(parsed);
          return JSON.stringify(parsed);
        }
      } catch (e) {
        console.log(e);
        return str;
      }
    }

    const sanitizedData = JSON.parse(JSON.stringify(logData));

    if (typeof sanitizedData.reqBody === "string") {
      sanitizedData.reqBody = parseAndSanitizeString(sanitizedData.reqBody);
    }
    if (typeof sanitizedData.resBody === "string") {
      sanitizedData.resBody = parseAndSanitizeString(sanitizedData.resBody);
    }
    sanitizeObject(sanitizedData);
    return JSON.stringify(sanitizedData);
  }

  sendLogToGrafana(event) {
    const body = JSON.stringify(event);
    fetch(`${config.url}`, {
      method: "post",
      body: body,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.userId}:${config.apiKey}`,
      },
    }).then((res) => {
      if (!res.ok) console.log("Failed to send log to Grafana Loki");
    });
  }
}
module.exports = new Logger();
