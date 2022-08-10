export default (sequelize, DataTypes) => {
  const Member = sequelize.define(
    "Member",
    {
      isChat: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "채팅중여부"
      },
      UserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "사용자ID"
      }
    },
    {
      charset: "utf8",
      collate: "utf8_general_ci",
      createdAt: false,
      updatedAt: false,
      paranoid: true
    }
  );

  Member.associate = db => {
    db.Member.belongsTo(db.Room);
  };

  return Member;
};
