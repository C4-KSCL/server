# 테이블 구조
### 1.유저 테이블 (User)
|설명|칼럼명|타입|키|제약조건|
|---|:---:|:---:|:---:|---:
회원번호|userNumber|INT|PK|AI|
이메일|email|STRING||UNIQUE|
비밀번호|password|STRING|||
닉네임|nickname|STRING||UNIQUE|
휴대번호|phoneNumber|STRING|||
나이|age|STRING|||
성별|gender|bool|||
본인_mbti|myMbti|STRING|||
본인_키워드|myKeyword|STRING|||
친구_키워드|friendKeyword|STRING|||
친구_mbti|friendMbti|STRING|||
친구최소나이|friendMaxAge|STRING|||
친구최대나이|friendMinAge|STRING|||
친구성별|friendGender|bool|||
회원_생성일|userCreated|TIMESTAMP||dafault CURRENT_TIMESTAMP|
요청시간|requestTime|TIMESTAMP||dafault '2000-01-01 00:00:00'|
정지여부|suspend|bool||default false|
관리자여부|manager|bool||default false|
### 2.이미지 테이블 (UserImage)
|설명|칼럼명|타입|키|제약조건|
|---|:---:|:---:|:---:|---:
이미지번호|imageNumber|INT|PK|AI|
회원번호|userNumber|INT|FK||
이미지주소|imagePath|STRING|||
이미지키값|imageKey|STRING|||
이미지_생성일|imageCreated|TIMESTAMP||dafault CURRENT_TIMESTAMP|
### 3. 고객센터 게시글 테이블 (CustomerServise)
게시글번호|postNumber|INT|PK|AI|
회원번호|userNumber|INT|FK||
게시글카테고리|postCategory|STRING|||
게시글제목|postTitle|STRING|||
게시글내용|postContent|STRING|||
생성시간|createdTime|TIMESTAMP||dafault CURRENT_TIMESTAMP|
답변여부|isAnswered|bool||default false
답변자|responderNumber|INT|FK||
답변제목|responseTitle|STRING|||
답변내용|responseContent|STRING|||
답변시간|responseTime|TIMESTAMP||
### 4.고객센터 이미지 테이블 (CustomerServiceImage)
이미지번호|imageNumber|INT|PK|AI|
게시글번호|postNumber|INT|FK||
이미지주소|imagePath|STRING|||
이미지키값|imageKey|STRING|||
이미지_생성일|imageCreated|TIMESTAMP||dafault CURRENT_TIMESTAMP|