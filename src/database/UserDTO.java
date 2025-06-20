package database;


public class UserDTO{

    //(아이디/비번/성별/주소/전화번호)
    private String User_id;
    private String User_password;
    private String User_phone;
    private String User_gender;
    private String User_address;

    @Override
    public String toString() {
        return "UserDTO{" +
                "User_id='" + User_id + '\'' +
                ", User_password='" + User_password + '\'' +
                ", User_phone='" + User_phone + '\'' +
                ", User_gender='" + User_gender + '\'' +
                ", User_address='" + User_address + '\'' +
                '}';
    }

    //--------------------------------------------------------------
    //생성자
    public UserDTO(String User_id, String User_password, String User_phone, String User_gender , String User_address) {
        this.User_id = User_id;
        this.User_password = User_password;
        this.User_phone = User_phone;
        this.User_gender = User_gender;
        this.User_address = User_address;
    }

    //--------------------------------------------------------------

    public String getUser_id() {
        return User_id;
    }

    public void setUser_id(String User_id) {
        this.User_id = User_id;
    }

    public String getUser_password() {
        return User_password;
    }

    public void setUser_password(String User_password) {
        this.User_password = User_password;
    }

    public String getUser_phone() {
        return User_phone;
    }

    public void setUser_phone(String User_phone) {
        this.User_phone = User_phone;
    }

    public String getUser_gender() {
        return User_gender;
    }

    public void setUser_gender(String User_gender) {
        this.User_gender = User_gender;
    }

    public String getUser_address() {
        return User_address;
    }

    public void setUser_address(String User_address) {
        this.User_address = User_address;
    }

    
    //비밀번호 확인 
    public boolean checkPW(String user_password){
        return this.User_password.equals(user_password);
    }


}