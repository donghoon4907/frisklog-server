import { mergeTypeDefs } from "@graphql-tools/merge";
import { loadFilesSync } from "@graphql-tools/load-files";

const typesArray = loadFilesSync(`${__dirname}/**/*.graphql`);

export default mergeTypeDefs(typesArray);
