module.exports = {
  jwtSecret: 'BigBenBenz96',
  db: {
    connection: {
      host: '127.0.0.1',
      user: 'root',
      password: 'tempdbpassword',
      database: 'pizza',
      connectTimeout: 60000,
    },
    listPerPage: 10,
  },
  factory: {
    url: 'https://pizza-factory.cs329.click',
    apiKey: 'ff84bf83622d42a5af217529d0a97b2c',
  },
};
