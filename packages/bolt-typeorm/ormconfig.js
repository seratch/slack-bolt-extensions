const SnakeNamingStrategy =
  require("typeorm-naming-strategies").SnakeNamingStrategy;

function buildSettings(name) {
  return {
    name,
    type: "sqlite",
    // database: "./database.sqlite",
    database: ":memory:",
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
}

module.exports = [
  buildSettings("bolt-example-app"),
  buildSettings("org-wide-tests"),
  buildSettings("team-level-tests"),
  buildSettings("connection-provider-tests"),
];
