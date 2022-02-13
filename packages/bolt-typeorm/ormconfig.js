const SnakeNamingStrategy =
  require("typeorm-naming-strategies").SnakeNamingStrategy;

module.exports = {
  type: "sqlite",
  database: "./database.sqlite",
  // database: ":memory:",
  synchronize: true,
  keepConnectionAlive: true,
  logging: true,
  entities: ["src/entity/**/*.ts"],
  migrations: ["src/migration/**/*.ts"],
  cli: {
    entitiesDir: "src/entity",
    migrationsDir: "src/migration",
  },
  namingStrategy: new SnakeNamingStrategy(),
};
