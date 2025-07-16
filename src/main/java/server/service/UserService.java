package server.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import server.beans.UserBean;
import server.mapper.UserMapper;

@Service
public class UserService {

    @Autowired
    private UserMapper userMapper;

    public void registerUser(UserBean userBean){
        userMapper.addUserInfo(userBean);
    }
    //아이디중복확인


    //회원가입



    //로그인진행
}
