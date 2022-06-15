import express from "express";
import { createServer } from "@graphql-yoga/node";
import morgan from "morgan";
import cors from "cors";
import fileUpload from "express-fileupload";
import { v4 as uuidv4 } from "uuid";
import "./module/env";
import { schema } from "./graphql";
import db from "./models";
import { isAuthenticated } from "./module/middleware";

const graphQLServer = createServer({
  schema,
  context: ({ request }) => ({ request, isAuthenticated, db })
});

const app = express();

// sequelize 활성화
db.sequelize.sync();
// cors 설정
app.use(
  cors({
    origin: true
  })
);
// 로그 활성화
app.use(morgan("dev"));
// graphql 활성화
app.use("/graphql", graphQLServer);
// 접근 허용 폴더 설정
app.use("/", express.static("src/upload"));
app.use("/", express.static("src/assets"));
// json
app.use(express.json());
// formdata
app.use(express.urlencoded({ extended: true }));
// 업로드 활성화
app.use(fileUpload());
// 업로드 API
app.post("/api/upload", (req, res) => {
  const { files } = req;

  if (!files) {
    return res.status(403).send("파일을 찾을 수 없습니다.");
  }

  const filename = files.file.name;

  const splitFilename = filename.split(".");

  if (splitFilename.length != 2) {
    return res.status(403).send("이미지 파일만 업로드 할 수 있습니다.");
  }

  const ext = splitFilename[1];

  if (ext !== "jpg" && ext !== "png") {
    return res.status(403).send("이미지 파일이 jpg 또는 png 형식이 아닙니다.");
  }

  const outputFilename = `${uuidv4()}.${ext}`;

  files.file.mv(`${__dirname}/upload/${outputFilename}`, err => {
    if (err) {
      return res.status(500).send("업로드 중 서버에서 문제가 발생했습니다.");
    } else {
      return res.json(outputFilename);
    }
  });
});

app.listen(process.env.PORT, () => {
  console.log("Running a GraphQL API server");
});
