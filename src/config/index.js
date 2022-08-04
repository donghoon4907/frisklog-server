export const mysqlConfig = {
  development: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB,
    host: process.env.HOST,
    dialect: process.env.DB_TYPE,
    operatorsAliases: 0,
    timezone: "+09:00",
    logging: false,
    dialectOptions: {
      dateStrings: true
    }
  },
  test: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB,
    host: process.env.HOST,
    dialect: process.env.DB_TYPE,
    operatorsAliases: 0,
    timezone: "+09:00",
    dialectOptions: {
      dateStrings: true
    }
  },
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB,
    host: process.env.HOST,
    dialect: process.env.DB_TYPE,
    operatorsAliases: 0,
    timezone: "+09:00",
    dialectOptions: {
      dateStrings: true
    }
  }
};
