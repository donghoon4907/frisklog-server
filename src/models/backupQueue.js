export default (sequelize, DataTypes) => {
  const BackupQueue = sequelize.define(
    "BackupQueue",
    {
      postId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "포스트 ID"
      },
      task: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "생성 및 수정여부"
      }
    },
    {
      charset: "utf8",
      collate: "utf8_general_ci",
      updatedAt: false,
      paranoid: true
    }
  );

  BackupQueue.associate = db => {};

  return BackupQueue;
};
