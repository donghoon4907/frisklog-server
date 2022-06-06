# frisklog-server

Frisklog는 여러 사용자들이 작성한 글을 공유할 수 있도록 만들어진 소셜 네트워크형 블로그입니다. 이 저장소에는 Frisklog에서 사용된 API가 포함되어 있습니다.


## 특징

이 프로젝트를 통해 다음의 정보를 얻을 수 있습니다.
* Sequelize(ORM) Best Practice
* GraphQL-Yoga v2 Best Practice
* A simple build method using Babel


## 환경변수 설정하기

`.env.{development|production}` 파일을 구성하여 환경 변수를 설정하세요. 
* `DB_USERNAME` - DB 사용자명
* `DB_PASSWORD` - DB 사용자 암호
* `HOST` = DB 호스트명 `ex) 127.0.0.1`
* `DB` - Database명
* `DB_TYPE` - DB 종류 `ex) mysql`
* `DOMAIN` - 도메인 주소 `ex) http://localhost`
* `PORT` - 서버 포트 `ex) 4000`
* `JWT_SECRET` - 토큰 시크릿 코드


## API

Frisklog에서 사용된 API를 테스트할 수 있도록 AWS EC2를 사용한 간단한 서버를 만들었습니다. <a href="http://frisklog.site:4000/graphql" target="_blank">링크</a>에서 확인하세요.


### 1. Query

**Params**

* `offset` **{Int?}**: 데이터를 가져오기 시작할 위치
* `limit` **{Int?}**: 호출 시 데이터양
* `order` **{String?}**: 정렬 `ex) createdAt_DESC`

**Example**

```graphql
query {
  users(offset: 0, limit: 30. orderBy: "createdAt_ASC") {
    rows {
      id
      email
      nickname
      avatar
      createdAt
    },
    count
  }
}
```

### 2. Mutation

**Params**

* `email` **{String}**: 이메일
* `nickname` **{String}**: 별명
* `avatar` **{String?}**: 프로필사진 경로

**Example**

```graphql
mutation {
  addUser(email: "tester@dummy.io", nickname: "tester", avatar: "http://testingdomain.com/dummy.png")
}
```


## To-Be

* REST API 엔드포인트 추가
* 조회수 증가, 파일 업로드 등 주요 기능 추가
