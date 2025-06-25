package database;


public class UserDTO{


    //-----------------내부 enum 선언
    public enum UserStatus {
        ACTIVE, INACTIVE, BANNED
    }

    public enum UserRole {
        USER, ADMIN, COUNSELOR
    }

    public enum UserMentalState {
        MELANCHOLIA,
        ANXIETY_DISORDER,
        ADHD,
        GAME_ADDICTION,
        OPPOSITIONAL_DEFIANT_DISORDER
    }
    
    //(아이디/이메일/비번/닉네임/가입일/프로필이미지/상태/권한/유저정신상태)
    private String userId;
    private String userEmail;
    private String userPassword;
    private String userPhone;
    

    //private UserStatus User_status;
    //private UserRole User_role;
    //private UserMentalState User_mental_state;

    
    @Override
    public String toString() {
        return "UserDTO{" +
                "user_id='" + userId + '\'' +
                ", user_email='" + userEmail + '\'' +
                ", user_password='" + userPassword + '\'' +
                ", user_phone='" + userPhone + '\'' +
                '}';
    }

    //--------------------------------------------------------------
    //생성자
    public UserDTO(String userId , String userEmail , String userPassword , String userPhone ) {
        this.userId = userId;
        this.userEmail = userEmail;
        this.userPassword = userPassword;
        this.userPhone = userPhone;
    }

    //---------getter setter-----------------------------------------------------

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

    public String getUserPassword() {
        return userPassword;
    }

    public void setUserPassword(String userPassword) {
        this.userPassword = userPassword;
    }

    public String getUserPhone() {
        return userPhone;
    }

    public void setUserPhone(String userPhone) {
        this.userPhone = userPhone;
    }
    
    
    //비밀번호 확인 
    public boolean checkPW(String userPassword){
        return this.userPassword.equals(userPassword);
    }

}