package server.mapper;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import server.beans.UserBean;

@Mapper
public interface UserMapper {

    //아이디중복확인
    @Select("select user_name from user_table\r\n"
            + "where user_id=#{user_id}")
    String checkUserIdExist(String user_id);


    //회원가입 
    @Insert("insert into user_table(user_idx , user_name , user_id , user_pw)"
            + " VALUES(user_seq.nextval,#{user_name},#{user_id} , #{user_pw})")
    void addUserInfo(UserBean joinUserBean);


    //로그인 
    @Select("select user_idx,user_name,user_pw from user_table\r\n"
            + "where user_id=#{user_id}")
    UserBean getLoginUserInfo(UserBean tempLoginUserBean);
}
