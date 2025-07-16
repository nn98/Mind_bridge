package server.beans;

import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;
import javax.xml.crypto.Data;

import org.springframework.stereotype.Component;

@Component
public class UserBean {

    //권한
    public enum UserRole {  //enum 타입을 정의
        USER, ADMIN //enum 상수
    }

    //정신상태
    public enum UserMentalState {
        DEPRESSION,
        ANXIETY,
        ADHD,
        GAMING_ADDICTION,
        OPPOSITIONAL_DEFICIT;
    }

    @Size(min = 2, max = 4)
    @Pattern(regexp = "[가-힣]*")
    private String userName;

    @Size(min = 4, max = 20)
    @Pattern(regexp = "[a-zA-Z0-9]*")
    private String userPassword;

    @Size(min = 4, max = 20)
    @Pattern(regexp = "[a-zA-Z0-9]*")
    private String userPassword2;

    private String userId;
    private String userEmail;
    private String userNickName;
    private String userProfileImage;
    private Boolean userStatus;
    private Data userJoinDate;
    private UserRole userRole;
    private UserMentalState userMentalState;
    private String userPhone;

    private boolean userIdExist;//아이디 중복 여부 확인 
    private boolean userLogin; //로그인 상태 확인 


//---------------------기본 생성자--------------------------------------------

    public UserBean() {
        this.userIdExist = false;
        this.userLogin = false;
    }
    
//---------------getter setter-------------------------------------------

    public boolean isUserIdExist() {
        return userIdExist;
    }

    public void setUserIdExist(boolean userIdExist) {
        this.userIdExist = userIdExist;
    }

    public boolean isUserLogin() {
        return userLogin;
    }

    public void setUserLogin(boolean userLogin) {
        this.userLogin = userLogin;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getUserPassword() {
        return userPassword;
    }

    public void setUserPassword(String userPassword) {
        this.userPassword = userPassword;
    }

    public String getUserPassword2() {
        return userPassword2;
    }

    public void setUserPassword2(String userPassword2) {
        this.userPassword2 = userPassword2;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public String getUserNickName() {
        return userNickName;
    }

    public void setUserNickName(String userNickName) {
        this.userNickName = userNickName;
    }

    public String getUserProfileImage() {
        return userProfileImage;
    }

    public void setUserProfileImage(String userProfileImage) {
        this.userProfileImage = userProfileImage;
    }

    public Boolean getUserStatus() {
        return userStatus;
    }

    public void setUserStatus(Boolean userStatus) {
        this.userStatus = userStatus;
    }

    public Data getUserJoinDate() {
        return userJoinDate;
    }

    public void setUserJoinDate(Data userJoinDate) {
        this.userJoinDate = userJoinDate;
    }

    public UserRole getUserRole() {
        return userRole;
    }

    public void setUserRole(UserRole userRole) {
        this.userRole = userRole;
    }

    public UserMentalState getUserMentalState() {
        return userMentalState;
    }

    public void setUserMentalState(UserMentalState userMentalState) {
        this.userMentalState = userMentalState;
    }

    public String getUserPhone() {
        return userPhone;
    }

    public void setUserPhone(String userPhone) {
        this.userPhone = userPhone;
    }

}
