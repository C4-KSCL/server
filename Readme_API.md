# 요청 API

### 로그인

> 1. 로그인
- URL : auth/login (POST)
- 요청 값 : 바디 - email, password
- 반환 값 : user 객체, images 객체, accessToken, refreshToken
- 응답상태 코드  
  - 200 - 로그인 성공   
  - 401 - 로그인 실패(잘못된 아이디 혹은 비밀번호)
  - 500 - 로그인 실패(서버 에러)   

-----
### 회원 등록

> 1. 이메일 인증
- URL : :signup/emailauth (POST)
- 요청 값 : 바디 - email
- 반환 값 : verificationCode  
- 응답상태 코드   
  - 200 : 이메일 전송 성공   
  - 301 : 기존 이메일 존재
  - 500 : 이메일 전송 실패(서버 에러)   

> 2. 닉네임 중복 체크
- URL : :signup/checknickname (POST)
- 요청 값 : 바디 - nickname
- 반환 값 : -   
- 응답상태 코드  
  - 200 : 사용가능한 닉네임   
  - 301 : 사용중인 닉네임   
  - 500 : 서버 에러   

> 3. 회원가입
- URL : signup/register (POST)
- 요청 값 : 바디 - email, password, nickname, phoneNumber, age, gender, myMBTI, friendMBTI, friendMaxAge, friendMinAge, friendGender, myKeyword, friendKeyword
- 반환 값 : -   
- 응답상태 코드  
  - 200 : 회원가입 성공   
  - 301 : 회원가입 실패(중복 이메일) -> 비밀번호 찾기 유도   
  - 500 : 회원가입 실패(서버 에러)   

> 4. 프로필 사진 저장
- URL : signup/profile (POST)
- 요청 값 : 바디 - files(file타입), email(text타입) ★Form-Data 형식★
- 반환 값 : -   
  - 200 : 이미지 저장 성공
  - 500~503 : 이미지 저장 실패(서버 에러)

> 5. 이미지 저장
- URL : signup/image (POST)
- 요청 값 : 바디 - files(file타입), email(text타입) ★Form-Data 형식★
- 반환 값 : -   
  - 200 : 이미지 저장 성공
  - 500~503 : 이미지 저장 실패(서버 에러)


-----
### 토큰 관련
> 1. AccessToken만 전송
  > 1-1. AccessToken 만료 X
  - 정상적으로 진행
  > 1-2. AccessToekn 만료 O, Refresh 토큰 전송하지 않음
  - 응답상태 코드 : 401
  - 2번으로 시도해야함
> 2. AccessToken,RefreshToken만 전송
  > 2-1. AccessToekn 만료 O , RefreshToekn 만료 X
  - 응답상태 코드 : 300
  - 반환 값 : 새로운 AccessToken, 새로운 RefreshToken
  - 해당 AccessToken으로 갱신 후 다시 전송해야함
  > 2-2. AccessToekn 만료 O , RefreshToekn 만료 O 
  - 응답상태 코드 : 402
  - 다시 로그인 시도해야함
> 3. 예외 사항
  > 3.1 accessToken 오류
  - 응답상태코드 : 411
  > 3.2 refreshToken 오류
  - 응답상태코드 : 412

-----
### 비밀번호 찾기
> 1. 아이디 존재 여부를 위해 이메일 검증
- URL : auth/findpw (POST)
- 요청 값 : 바디 - email
- 반환 값 : verificationCode 
- 응답상태 코드    
  - 200 : 정상 수행   
  - 301 : 존재하지 않는 이메일   
  - 500 : 서버 에러   

> 2. 새로운 비밀번호 전송하여 비밀번호 업데이트
- URL : auth/setpw (POST)
- 요청 값 : 바디 - email, password
- 반환 값 : -   
- 응답상태 코드  
  - 200 : 비밀번호 변경 성공   
  - 304 : 올바르지 않은 값을 보낸 경우(해당 이메일이 없는 경우)
  - 500 : 비밀번호 변경 실패(서버 에러)   

-----
### 친구 매칭하기
> 1. 친구 매칭
- URL : findfriend/friend-matching (GET)
- 요청 값 : 헤더 - accesstoken
- 반환 값 : users 객체 + user객체 안에 analysis(gpt)필드, images 객체(성공시) 
  - 200 : 매칭 성공 
  - 500 : 매칭 시간 제한 / requestTime(최근 요청시간 반환)
  - 404 : 해당 친구 없음
  - 500 : 매칭 실패(서버 에러)   

> 2. 친구 MBTI 설정 변경
- URL : findfriend/settingMBTI (POST)
- 요청 값 : 헤더 - accesstoken, 바디 - friendMBTI, friendMaxAge, friendMinAge, friendGender
- 반환 값 : 없음
  - 200 : 매칭 성공 
  - 500 : 매칭 실패(서버 에러)   
  

> 3. 친구 키워드 설정 변경
- URL : findfriend/settingKeyword (POST)
- 요청 값 : 헤더 - accesstoken, 바디 - friendKeyword
- 반환 값 : 없음
  - 200 : 매칭 성공 
  - 500 : 매칭 실패(서버 에러)  
  - 504 : 없는 회원일 시

> 4. 친구 이미지 찾기
- URL : findfriend/getimage (POST)
- 요청 값 : 헤더 - accesstoken, 바디 - friendEmail
- 반환 값 : user 객체, images 객체
  - 200 : 매칭 성공 
  - 301 : 이메일 오류
  - 500 : 매칭 실패(서버 에러)  

> 5. 이전 매칭 내역 조회
- URL : findfriend/getfriendinfo?userNumbers=1,2,3 (GET)
- 요청 값 : 헤더 - accesstoken
- 반환 값 : user 객체, images 객체
  - 200 : 매칭 성공
  - 500 : 매칭 실패(서버 에러)  
-----
### 회원정보(프로필 사진) 수정
> 1. 프로필 사진 삭제
- URL : edit/deleteprofile (POST)
- 요청 값 : 헤더 - accesstoken, 바디 - deletepath 
- 반환 값 : user, images
  - 200 : 삭제 성공
  - 500 : S3에서 이미지 삭제 실패
  - 501 : DB에서 이미지 삭제 실패  
  - 502 : 서버 에러 

> 2. 프로필 사진 추가
- URL : edit/addprofile (POST)
- 요청 값 : 헤더 - accesstoken, 바디 - files ★Form-Data 형식★
- 반환 값 : user, images
  - 200 : 이미지 저장 성공
  - 500~503 : 이미지 저장 실패(서버 에러)

> 3. 이미지 삭제
- URL : edit/deleteimage (POST)
- 요청 값 : 헤더 - accesstoken, 바디 - deletepath 
- 반환 값 : user, images
  - 200 : 삭제 성공
  - 500 : S3에서 이미지 삭제 실패
  - 501 : DB에서 이미지 삭제 실패  
  - 502 : 서버 에러 

> 4. 이미지 추가
- URL : edit/addimage (POST)
- 요청 값 : 헤더 - accesstoken, 바디 - files ★Form-Data 형식★
- 반환 값 : user, images
  - 200 : 이미지 저장 성공
  - 500~503 : 이미지 저장 실패(서버 에러)

### 회원정보(개인 정보) 수정
> 1. 개인정보 수정 -> 닉네임 수정시 닉네임 확인하는 API 거쳐야함
- URL : edit/info (POST)
- 요청 값 : 헤더 - accesstoken, 바디 - password, nickname, phoneNumber, age - 특정 값은 변경하지 않더라도 기존 값을 보내줘야함
- 반환 값 : user, images
  - 200 : 업데이트 성공
  - 300 : 값을 보내지 않은 경우
  - 304 : 올바르지 않은 값을 보낸 경우
  - 500~502 : 업데이트 실패(서버 에러)

  > 2. 나의 MBTI 수정 
- URL : edit/info (POST)
- 요청 값 : 헤더 - accesstoken, 바디 - myMBTI - 특정 값은 변경하지 않더라도 기존 값을 보내줘야함
- 반환 값 : user, images
  - 200 : 업데이트 성공
  - 300 : 값을 보내지 않은 경우
  - 304 : 올바르지 않은 값을 보낸 경우
  - 500~502 : 업데이트 실패(서버 에러)

  > 3. 나의 키워드 수정 
- URL : edit/infoKeyword (POST)
- 요청 값 : 헤더 - accesstoken, 바디 - myKeyword - 특정 값은 변경하지 않더라도 기존 값을 보내줘야함
- 반환 값 : user, images
  - 200 : 업데이트 성공
  - 300 : 값을 보내지 않은 경우
  - 304 : 올바르지 않은 값을 보낸 경우
  - 500~502 : 업데이트 실패(서버 에러)

### 회원 삭제

> 1. 회원 정보 삭제
- URL : delete/user (delete)
- 요청 값 : 헤더 - accesstoken
- 반환 값 : -
  - 200 : 회원 삭제 성공
  - 304 : 올바르지 않은 값을 보낸 경우
  - 500 : 이미지 삭제 에러
  - 501 : 프로필 삭제 에러
  - 502 : 회원 삭제 에러

### 고객센터

> 1. 고객센터 글 작성
- URL : customerService/post (post)
- 요청 값 : 헤더 - accesstoken, 바디 - postCategory,postTitle,postContent ★ Form-data 형식 ★
- 반환 값 : -
  - 200 : 게시글 작성 성공
  - 500 : 서버 에러
  - 501~3 : 이미지 업로드 에러
  - 504 : 게시글 저장 실패

> 2. 고객센터 글 조회
- URL : customerService/readGeneral (get)
- 요청 값 : 헤더 - accesstoken
- 반환 값 : posts, images (게시글 객체들과 이미지 객체들 반환)
  - 200 : 게시글 조회 성공
  - 500 : 서버 에러

> 3. 관리자 글 조회
- URL : customerService/readManager (get)
- 요청 값 : 헤더 - accesstoken
- 반환 값 : posts + email, images (게시글 객체들과 이미지 객체들 반환)
  - 200 : 게시글 조회 성공
  - 301 : 관리자가 아님
  - 500 : 서버 에러

> 4. 관리자 글 답변 작성
- URL : customerService/responsePost (post)
- 요청 값 : 헤더 - accesstoken, 바디 - responseTitle, responseContent, postNumber
- 반환 값 : -
  - 200 : 작성 성공
  - 301 : 관리자가 아님
  - 500 : 서버 에러
  - 501 : 쿼리 에러

### 회원 관리

> 1. 회원 정지
- URL : manage/suspend (post)
- 요청 값 : 헤더 - accesstoken, 바디 - userNumber
- 반환 값 : -
  - 200 : 정지 성공
  - 301 : 관리자가 아님
  - 500 : 서버 에러

  > 2. 회원 정지 해제
- URL : manage/removeSuspend (post)
- 요청 값 : 헤더 - accesstoken, 바디 - userNumber
- 반환 값 : -
  - 200 : 정지 성공
  - 301 : 관리자가 아님
  - 500 : 서버 에러

    > 3. 회원 조회
- URL : manage/search?search_string=ji (get)
- 요청 값 : 헤더 - accesstoken
- 반환 값 : user 객체들
  - 200 : 정지 성공
  - 301 : 관리자가 아님
  - 500 : 서버 에러

논의 사항 : 정지당한 회원 로그인 어떻게 할 것인지
-> 로그인은 되나 기능 제한인지 아니면 로그인 하면 정지당했다고 알려줄것인지
