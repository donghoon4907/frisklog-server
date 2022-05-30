import express from "express";
import { createServer } from "@graphql-yoga/node";
import { schema } from "./graphql";
import db from "./models";

const graphQLServer = createServer({
  schema
});

const app = express();

db.sequelize.sync();

app.use("/graphql", graphQLServer);

app.listen(4000, () => {
  console.log("Running a GraphQL API server");
});
