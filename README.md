# frisklog-server

Frisklog는 여러 사용자들이 작성한 글을 공유할 수 있도록 만들어진 소셜 네트워크형 블로그입니다. 이 저장소에는 Frisklog에서 사용된 API가 포함되어 있습니다.

## 특징

이 프로젝트를 통해 다음의 정보를 얻을 수 있습니다.

- Sequelize(ORM) Best Practice
- GraphQL-Yoga v2 Best Practice
- Offset-limit / Cursor-based Pagination
- Nodemailer tutorial
-

## 데이터베이스 구조

- [dbdiagram](https://dbdiagram.io/d/62d18165cc1bc14cc5c849d7)

## 환경변수 설정하기

`.env` 파일을 구성하여 환경 변수를 설정하세요. 모든 변수들은 `.env.example`에서 확인할 수 있어요.

- `DB_USERNAME` - DB 사용자명
- `DB_PASSWORD` - DB 사용자 암호
- `HOST` = DB 호스트명 `ex) 127.0.0.1`
- `DB` - Database명
- `DB_TYPE` - DB 종류 `ex) mysql`
- `PORT` - 서버 포트 `ex) 4000`
- `JWT_SECRET` - 토큰 시크릿 코드
- `EMAIL_ID` - 메일에 사용할 이메일
- `EMAIL_PASSWORD` - 메일에 사용할 암호, 구글의 경우 APP 발급 튜토리얼 숙지 필요
- `GITHUB_CLIENT_ID` - GitHub OAuth App Client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth App Secret
- `BACKEND_ROOT` - 서버 도메인

## API

Frisklog에서 사용된 API를 테스트할 수 있도록 AWS EC2를 사용한 간단한 서버를 만들었습니다. <a href="http://frisklog.site:4000/graphql" target="_blank">링크</a>에서 확인하세요.

### 1. Query

**Params**

- `limit` - 요청 데이터의 수
- `searchKeyword` - 검색어

**Example**

```graphql
query {
  posts(limit: 30, searchKeyword: "graphql") {
    totalCount
    edges {
      node {
        id
        content
        createdAt

        User {
          nickname
        }
      }
      cursor
    }
    pageInfo {
      startCursor
      endCursor
      hasPreviousPage
      hasNextPage
    }
  }
}
```

### 2. Mutation

**Params**

- `email` **{String}**: 이메일
- `nickname` **{String}**: 별명
- `avatar` **{String?}**: 프로필사진 경로

**Example**

```graphql
mutation {
  addUser(
    email: "tester@dummy.io"
    nickname: "tester"
    avatar: "http://testingdomain.com/dummy.png"
  )
}
```

## To-Be

- Convert REST API With Redux
- Direct Message With Subscription
- Set DB Index
