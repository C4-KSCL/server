# 요청 API

### 로그인

> 1. 로그인
- URL : auth/login (POST)
- 요청 값 : email, password
- 반환 값 : user 객체, images 객체, accessToken, refreshToekn
- 응답상태 코드  
  - 200 - 로그인 성공   
  - 401 - 로그인 실패(잘못된 아이디 혹은 비밀번호)
  - 500 - 로그인 실패(서버 에러)   

-----
### 회원 등록

> 1. 이메일 인증
- URL : :signup/emailauth (POST)
- 요청 값 : email
- 반환 값 : verificationCode  
- 응답상태 코드   
  - 200 : 이메일 전송 성공   
  - 500 : 이메일 전송 실패(서버 에러)   

> 2. 닉네임 중복 체크
- URL : :signup/checknickname (POST)
- 요청 값 : nickname
- 반환 값 : -   
- 응답상태 코드  
  - 200 : 사용가능한 닉네임   
  - 401 : 사용중인 닉네임   
  - 500 : 서버 에러   

> 3. 회원가입
- URL : signup/register (POST)
- 요청 값 : email, password, nickname, phoneNumber, age, gender, myMBTI, friendMBTI, friendMaxAge, friendMinAge, friendGender, myKeyword, friendKeyword
- 반환 값 : -   
- 응답상태 코드  
  - 200 : 회원가입 성공   
  - 401 : 회원가입 실패(중복 이메일) -> 비밀번호 찾기 유도   
  - 500 : 회원가입 실패(서버 에러)   

> 4. 이미지 저장
- URL : signup/image (POST)
- 요청 값 : files(file타입), email(text타입) ★Form-Data 형식★
- 반환 값 : -   
  - 200 : 이미지 저장 성공
  - 500~503 : 이미지 저장 실패(서버 에러)

-----
### 비밀번호 찾기
> 1. 아이디 존재 여부를 위해 이메일 검증
- URL : auth/findpw (POST)
- 요청 값 : email
- 반환 값 : verificationCode 
- 응답상태 코드    
  - 200 : 정상 수행   
  - 401 : 존재하지 않은 이메일   
  - 500 : 서버 에러   

> 2. 새로운 비밀번호 전송하여 비밀번호 업데이트
- URL : auth/setpw (POST)
- 요청 값 : email, password
- 반환 값 : -   
- 응답상태 코드  
  - 200 : 비밀번호 변경 성공   
  - 500 : 비밀번호 변경 실패(서버 에러)   

-----
### 친구 매칭하기
> 1. 친구 매칭
- URL : findfriend/friend-matching (GET)
- 요청 값 : 헤더 - accesstoken
- 반환 값 : users 객체, images 객체
  - 200 : 매칭 성공 
  - 401 : 해당 친구 없음
  - 500 : 매칭 실패(서버 에러)   

> 2. 친구 설정 변경
- URL : findfriend/setting (POST)
- 요청 값 : 헤더 - accesstoken, 바디 - friendMBTI, friendMaxAge, friendMinAge, friendGender
- 반환 값 : 싹다 돌려준다
  - 200 : 매칭 성공 
  - 500 : 매칭 실패(서버 에러)   

-----
### 회원정보(프로필 사진) 수정
> 1. 이미지 삭제
- URL : edit/deleteimage (POST)
- 요청 값 : 헤더 - accesstoken, 바디 - deletepath 
- 반환 값 : -
  - 200 : 삭제 성공
  - 500 : S3에서 이미지 삭제 실패
  - 501 : DB에서 이미지 삭제 실패   
> 2. 이미지 추가
- URL : edit/addimage (POST)
- 요청 값 : 헤더 - accesstoken, 바디 - files ★Form-Data 형식★
- 반환 값 : -
  - 200 : 이미지 저장 성공
  - 500~503 : 이미지 저장 실패(서버 에러)

### 회원정보(개인 정보) 수정
> 1. 개인정보 수정
- URL : edit/info (POST)
- 요청 값 : 헤더 - accesstoken, 바디 - password, nickname, phoneNumber, birthdate, gender, myMBTI, myKeyword, friendKeyword
- 반환 값 : User 객체
  - 200 : 업데이트 성공
  - 500~501 : 업데이트 실패(서버 에러)


2월 해야할 리스트
- docker-compose 관련하여 시간 설정 알아보기
3월 해야할 리스트
- 친구매칭시 나이 조건 추가, 매칭 횟수 파악
- 백엔드 코드 병합
- nginx 설정

