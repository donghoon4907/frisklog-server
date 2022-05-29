import express from "express";
import { createServer } from "@graphql-yoga/node";
import { schema } from "./graphql";

const graphQLServer = createServer({
  schema
});

const app = express();

app.use("/graphql", graphQLServer);

app.listen(4000, () => {
  console.log("Running a GraphQL API server");
});
