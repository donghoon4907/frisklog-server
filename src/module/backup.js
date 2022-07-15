import fs from "fs";
import path from "path";

const BACKUP_PATH = path.join(__dirname, "../backup");

const readBackupFile = filename => {
  let result;

  try {
    const data = fs.readFileSync(`${BACKUP_PATH}/${filename}.json`, "utf-8");

    result = JSON.parse(data);
  } catch {
    result = {
      posts: []
    };
  }

  return result;
};

const writeBackupFile = (filename, data) => {
  let result;

  try {
    fs.writeFileSync(
      `${BACKUP_PATH}/${filename}.json`,
      JSON.stringify(
        data
        // , null, "\t"
      )
    );

    result = true;
  } catch {
    result = false;
  }

  return result;
};

export const hasPost = (email, id) => {
  let backupData = readBackupFile(email);

  const hasPost = backupData.posts.findIndex(post => post.id === id);

  return hasPost !== -1;
};

export const createPost = (email, post) => {
  let backupData = readBackupFile(email);

  backupData.posts = [...backupData.posts, post];

  return writeBackupFile(email, backupData);
};

export const updatePost = (email, post) => {
  let backupData = readBackupFile(email);

  backupData.posts.some((v, index) => {
    if (v.id === post.id) {
      backupData.posts.splice(index, 1, post);

      return true;
    }

    return false;
  });

  return writeBackupFile(email, backupData);
};
