# Mind_Bridge
***
> # 준수 필
<img src="https://github.com/user-attachments/assets/059f14b1-7da7-4685-a39a-7272016cac24" style="width:500px"/>

`가비아 G클라우드 그룹웨어 개발자 양성과정`
### _자신의 상태가 궁금할 때, 상담이 필요할 때_

|날짜|내용|담당|
|--|--|--|
|`2025`|||
|`07/04`|전화번호 크롤링을 하였으나 전화번호가 없는곳이 많음|`NSJ`|
|`07/05`|소셜 로그인 작업중 로그인 버튼을 누르면 클라리언트 id 오류 문제로 페이지를 제대로 불러오지 못함<br/>google cloud 클라이언트 등록 및 적용을 시켜서 클라이언트 id 키 값 생성후 적용 시켜주니 id 오류 문제는 해결<br/>백앤드 작업을 플러그를 다운하였지만 여전히 특정 코드를 import를 하지 못하는 오류가 발생 플러그 설치 문제인지 확인 후 다시 시행할 예정<br/>java/react/spring boot는 공부를 하면 할 수록 알아야 할게 많다는 걸 느끼는 프로젝트가 될거 같은 느낌이 많이 드는 하루입니다....|`LJJ`||
|`07/07`|프롬프트 최신화 / 오류 수정|`NSJ`|
|`07/07`|기존에 게시판을 작성해도 로그인한 사용자에 아이디를 불러오지 못하고 있었는데 로그인 기능이 변경됨에 따라 게시판 글 작성시에 로그인한 유저에 아이디가 게시판에 작성 정보에 같이 표기가 됨<br/>게시판 정보에 아이디를 받아오기 위해 수정한 부분은 app.js 파일에서 import { useUser } from '@clerk/clerk-react;를 사용하셔 Clerk 인증 시스템에서 로그인한 유저에 정보를 가져오는 리액트를 불러오고 <br/> BoardSection.js에서 const { isSignedIn, user } = useUser(); const를 사용하여 위애서 불러온 react에서 useUser를 두개의 값으로 할당하여 꺼내 쓰는 방식으로 변경 <br/> 기존 const BoardSection = ({ user, isSignedIn }) => 구조 분해 할당 부분을 app.js에서 작성한 Route 부분을 받아오기 위해 const BoardSection = ({ user, isSignedIn }) => 방식으로 변경<br/>로그인을 하지 않아도 작성이 되었었던 기존 게시판 형식을 로그인을 하지 않으면 로그인을 한 후 작성이 되도록 변경<br/>if (!isSignedIn) { alert('로그인 후 작성 가능합니다.');return;} 를 기존 코드에 작성하여 로그인을 하지 않으면 안되게 변경 <br/>post-list에 유저 아이디를 같이 넘겨주기 위해 게시글마다 작성자의 이름(userName)이 표시되도록 post.userName 값을 출력하는 JSX 구문을 게시판 항목에 추가|`LJJ`|
|`07/08`|맵 + 네비게이션 경로 탐색 기능 추가|`NSJ`|
|`07/08`|README 정리 및 기초 DevLog 작성|`KYS`|
|`07/08`|지도 열기/닫기 상태를 mapVisible로 관리 가능하게 변경하였음 const [mapVisible, setMapVisible] = useState(false);|`LJJ`|
|`07/08`|scrollTarget 상태를 통해 스크롤할 섹션 아이디에('intro', 'notice')를 저장후 AboutSection 컴포넌트에서 useEffect로 scrollTarget이 변경되면 해당하는 ref로 scrollIntoView({ behavior: 'smooth' }) 실행하게 만들어서 스크롤 후 setScrollTarget(null)로 상태 초기화하여 재사용가능하게 만듦|`LJJ`|
|`07/19`|그날 하루를 입력하면 키워드를 분석하여 상태를 알려주는 page를 만드는 와중에 작성중인 코드에 no-loop-func라는 ESLint 경고가 나와 찾아보니 for 안에서 foreach를 사용하여 경고가 뜬 것이 확인되어 foreach를 사용하지 않고 for만 사용하여 로직을 수정 하였습니다 추후 API을 활용하여 감정 키워드에 대한 한 문장을 완성하는 페이지로 수정할 예정이며 감정 분석이 원할하게 진행이 가능하도록 키워드를 더 추가할 예정입니다.|`LJJ`|
|`07/23`|기존 public에 있던 이미지 파일을 img 폴더 생성 후 파일 위치 변경|`LJJ`|
||||
