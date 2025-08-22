# _`Mind_Bridge`_

***

> ## Architecture
> ![](https://velog.velcdn.com/images/nn98/post/8d6dd7ff-cf5a-40dc-90a0-442c12827114/image.png)

***

> ## Usecase
> ![](https://velog.velcdn.com/images/nn98/post/b6020032-0105-484c-a67a-b94fe91b2d1b/image.png)

***

> ## Commit Convention
> - ### 숙지 후 제거
>
> <img src="https://github.com/user-attachments/assets/059f14b1-7da7-4685-a39a-7272016cac24" style="width:500px"/>

***

> ## _Troubleshooting_
> ***
> - ### _개요_
> 
> | `구분` |          `내용`          |
> |:----:|:----------------------:|
> | `날짜` |      `2025-08-22`      |
> | `종류` |       `로그인` `토큰`       |
> | `상황` | 신규 PC에서 로그인 시도 시 에러 발생 |
> | `에러` |    AxiosError - 401    |
> | `원인` |  JWT 도입에 따른 토큰 필터링 강화  |
> | `해결` |    화이트리스트 설정, 예외처리     |
>
> - ### _특이점_
>
> |  `구분`  |                              `내용`                               |
> |:------:|:---------------------------------------------------------------:|
> | `!특이점` |     기존 개발/테스트 진행한 PC는 정상적으로 로그인 가능, <br/>이에 에러 발생 식별이 지연됨.      |
> | `원인은?` | 기존 로그인 기록이 있을 경우, 브라우저가 토큰 보유.<br/>만료된 토큰이라도 보유는 하고 있기에 필터링 통과. |
> |  `조치`  |                클린 테스트, 단위/웹 테스트 구현으로 항상성/무결성 보장                 |
> 
> - ### [_기록_](https://tattered-reason-ed8.notion.site/error-2025-08-22-2579e83ff32d8013a385d2ca1c4ac149)

