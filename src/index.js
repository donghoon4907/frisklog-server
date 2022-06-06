import express from "express";
import { createServer } from "@graphql-yoga/node";
import morgan from "morgan";
import "./module/env";
import { schema } from "./graphql";
import db from "./models";
// import { authenticateJwt } from "./passport";
import { isAuthenticated } from "./module/middleware";

const graphQLServer = createServer({
  schema,
  context: ({ request }) => ({ request, isAuthenticated, db }),
  cors: false
});

const app = express();
// sequelize 활성화
db.sequelize.sync();
// passport 활성화
// app.use(authenticateJwt);
// 로그 활성화
app.use(morgan("dev"));
// graphql 활성화
app.use("/graphql", graphQLServer);

app.listen(process.env.PORT, () => {
  console.log("Running a GraphQL API server");
});
