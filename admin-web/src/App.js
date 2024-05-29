import './App.css';

function App() {
  return (
    <div className="App">
      <h2>
        SoulMBTI 관리자 페이지입니다.
      </h2>
      <div>
        <p>아이디</p>
        <input type='text'/>
        <p>비밀번호</p>
        <input type='password'/>
        <button onClick={alert("aa")}>로그인</button>
      </div>
    </div>
  );
}

export default App;
