module.exports = {
  jwtSecret: "BigBenBenz96",
  db: {
    connection: {
      host: "host.docker.internal",
      user: "root",
      password: "Chivantor1234",
      database: "pizza",
      connectTimeout: 60000,
    },
    listPerPage: 10,
  },
  factory: {
    url: "https://pizza-factory.cs329.click",
    apiKey: "ff84bf83622d42a5af217529d0a97b2c",
  },
};