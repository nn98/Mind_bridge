package server.dao;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import server.beans.UserBean;
import server.mapper.UserMapper;

@Repository
public class UserDao {

    @Autowired
    private UserMapper userMapper;


    //아이디 중복 확인
    public String checkUserIdExist(String user_id){
        return userMapper.checkUserIdExist(user_id);
    }

    //회원가입
    public void addUserInfo(UserBean joinUserBean){
        userMapper.addUserInfo(joinUserBean);
    }

    //로그인
    public UserBean getLoginUserInfo(UserBean tempLoginUserBean){
        return userMapper.getLoginUserInfo(tempLoginUserBean);
    }

}
