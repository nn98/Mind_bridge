package database;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

//import com.mysql.cj.protocol.Resultset;

public class Databasecheck {
    //DB 접속 정보

    static String url = "jdbc:mysql://sol-skhu.duckdns.org:3306/gabia_first?serverTimezone=Asia/Seoul&characterEncoding=UTF-8&useSSL=false&useSSL=false&allowPublicKeyRetrieval=true";
    static String user = "member";
    static String password = "12345";

    public static void main(String[] args) {

        try {
            //드라이버 로드 
            Class.forName("com.mysql.cj.jdbc.Driver");
            System.out.println("드라이버 로드 성공");

            //db연결
            Connection conn = DriverManager.getConnection(url, user, password);
            System.out.println("디비 연결 성공");

            //전체 조회(쿼리 실행 예시)
            Statement stmt = conn.createStatement(); //준비완료 

            //ResultSet rs = stmt.executeQuery("SELECT * FROM users"); //다 가져오라는 쿼리(명령)
            Databasecheck Databasecheck = new Databasecheck();

            //----자료생성실행
            Databasecheck.inputUser("test1", "kim@naver.com", "010-1234-1234","1234qwer!");
            //----생성확인실행
            //rs = stmt.executeQuery("SELECT * FROM users"); //다 가져오라는 쿼리(명령)//
            //Databasecheck.printUserData(rs);
            //----삭제확인실행
            //Databasecheck.deleteUser("test1", "kimkim@naver.com", "1234qwer!");


            //String insertData = "INSERT INTO users (mental state) VALUES (1, '1234qwer!',20)";
            //stmt.executeUpdate(insertData);
            //System.out.println("데이터 삽입 완료");

            //데이터 조회
            String selectQuery = "SELECT * FROM users";
            ResultSet rs = stmt.executeQuery(selectQuery);

            while(rs.next()){
                String id = rs.getString("user_id");
                String email = rs.getString("user_email");
                String pass = rs.getString("user_password");
                String phone = rs.getString("user_phone");

                System.out.println(id+"|"+pass+"|"+email +"|"+phone);
            }

            
            rs.close(); //쿼리 결과를 담고있는 객체 rs 를 닫음
            stmt.close(); // sql 실행에 사용된 객체 stmt 를 닫음 
            conn.close(); //데이터 베이스와의 연결을 끊는 역할 

        } catch (Exception e) {
            e.printStackTrace();
        }

    }

    //비번업뎃
    public boolean updatePassword(String userId, String newPassword) throws SQLException {
        String sql = "UPDATE users SET password = ? WHERE user_id = ?";

        try (Connection conn = DriverManager.getConnection(url, user, password); PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setString(1, newPassword);  // 새 비밀번호
            pstmt.setString(2, userId);       // 조건: 해당 user_id

            int result = pstmt.executeUpdate();
            if (result > 0) {
                System.out.println("비밀번호 수정 성공");
                return true;
            } else {
                System.out.println("비밀번호 수정 실패 (user_id 없음)");
                return false;
            }
        }
    }

    //input테스트
    public boolean inputUser(String userId, String email, String phone,String newPassword) throws SQLException {

        String sql = "INSERT INTO users (user_id, user_email,user_phone, user_password) VALUES (?, ?, ? , ?)";

        try (Connection conn = DriverManager.getConnection(url, user, password); PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, userId);
            pstmt.setString(2, email);
            pstmt.setString(3, phone);
            pstmt.setString(4, newPassword);

            int result = pstmt.executeUpdate();
            if (result > 0) {
                System.out.println("사용자 생성 성공");
                return true;
            } else {
                System.out.println("사용자 생성 실패");
                return false;
            }
        }

    }

    //삭제테스트 
    public boolean deleteUser(String userId, String email, String phone, String newPassword) throws SQLException {

        //String sql = "DELETE FROM users WHERE (user_id, email, password) VALUES (?, ?, ?)";
        String sql = "DELETE FROM users WHERE user_id = ? AND user_email = ? AND user_phone = ? AND user_password = ?";

        try (Connection conn = DriverManager.getConnection(url, user, password); PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setString(1, userId);
            pstmt.setString(2, email);
            pstmt.setString(3, phone);
            pstmt.setString(4, newPassword);

            int result = pstmt.executeUpdate();
            if (result > 0) {
                System.out.println("사용자 삭제 성공");
                return true;
            } else {
                System.out.println("사용자 삭제 실패 (정보 불일치 또는 없음)");
                return false;
            }
        }
    }

    //자료확인
    public void printUserData(ResultSet rs) throws SQLException {
        boolean hasData = false;

        while (rs.next()) {
            hasData = true;
            System.out.println("ID: " + rs.getString("user_id")
                    + ", Email: " + rs.getString("user_email")
                    + ", Phone: " + rs.getString("user_phone")
                    + ", Password: " + rs.getString("user_password"));
        }

        if (hasData) {
            System.out.println("자료 찾기 성공 : 자료 있음");
        } else {
            System.out.println("자료 없음");
        }
    }
}
      