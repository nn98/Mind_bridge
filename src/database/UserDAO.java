package database;

import static database.SimpleConnectionPool.connectionPool;
import java.sql.*;
import java.util.ArrayList; // DB 연결, 쿼리, 결과 처리 등

public class UserDAO {

    //============================유저전체목록 가져오기============================
    public static ArrayList<UserDTO> getAllUser() { // getAllGpus()메소드: GpuDTO객체 리스트를 반환
        ArrayList<UserDTO> list = new ArrayList<>(); // GpuDTO라는 객체들을 담을 수 있는 비어있는 리스트 생성

        try (
                // 3. SQL 실행 & 결과 처리
                Connection conn = connectionPool.getConnection(); PreparedStatement pstmt = conn.prepareStatement("SELECT * FROM users"); // SQL 실행을 준비하는 PreparedStatement
                // 생성 (쿼리 준비)
                 ResultSet rs = pstmt.executeQuery() // 결과는 rs (ResultSet)에 담김
                ) {
            // 4. 결과를 GpuDTO 객체로 변환
            while (rs.next()) {
                UserDTO user
                        = new UserDTO(rs.getString("user_id"),
                                rs.getString("user_email"),
                                rs.getString("user_password"),
                                rs.getString("user_phone")
                        );

                list.add(user);// 리스트에 넣기
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        // 5. 리스트 반환
        return list;
    }//유저전체목록 가져오기

    //==============로그인============================
    public UserDTO login(UserDTO user) {

        try {
            //사용자 아이디가 일치하는 데이터를 찾는 sql쿼리 준비
            String sql = "SELECT * FROM users WHERE user_id = ?";

            //커넥션 풀에서 db연결을 가져오고 쿼리의 ?에 사용자의 아이디를 설정
            Connection conn = connectionPool.getConnection();
            PreparedStatement pstmt = conn.prepareStatement(sql);
            pstmt.setString(1, user.getUserId());

            //쿼리를 실행하여 결과(ResultSet)를 받음
            ResultSet rs = pstmt.executeQuery();
            System.out.println("UserDAO.login: rsFirst: " + rs);
            rs.next();
            System.out.println("UserDAO.login: rsNext: " + rs);

            //비밀번호 일치 여부 확인 
            //확인 시 추가 정보(전화번호,성별,주소,이메일,닉네임)를 가져가 user 객체에 설정
            if (user.checkPW(rs.getString("user_password"))) {
                user.setUserPhone(rs.getString("user_phone"));
                user.setUserEmail(rs.getString("user_email"));
                return user;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null; //예외 발생 시 null 반환 > 로그인 실패 처리
    }

    //============================회원가입(아이디/비번/성별/전화번호/성별/주소)
    public boolean register(String user_id, String user_password, String user_phone, String user_email) {
        int result = 0;

        try {
            //DB연결 
            //SQL 문 준비
            String sql = "INSERT INTO users (user_id, user_email , user_password, user_phone) VALUES (?, ?, ?, ?)";
            //커넥션 풀을 통해 connection 객체를 가져옴
            Connection conn = connectionPool.getConnection();
            //sql문 실행 준비(pstmt는 sql 실행용 객체)
            PreparedStatement pstmt = conn.prepareStatement(sql);

            // ? 에 값 넣기
            pstmt.setString(1, user_id);
            pstmt.setString(2, user_email);
            pstmt.setString(3, user_password);
            pstmt.setString(4, user_phone);

            //executeUpdate 는 insert , update , delete 쿼리 실행 시 사용 
            result = pstmt.executeUpdate();

            // 자원 정리
            //pstmt 와 connection을 정리하여 리소스 누수 방지
            //pstmt.close();
            //conn.close();
            //connectionPool.releaseConnection(conn);

        } catch (Exception e) {
            e.printStackTrace();
        }
        return result == 1; //결과 반환 1개의 행이 성공적으로 삽입되었으면 true 아니면 false 로 반환

    }

    //============================유효비밀번호 생성조건
    public boolean isValidPassword(String pw) {
        //8자리 이하면 false
        if (pw.length() < 8) {
            return false;
        }

        //영문자포함여부 확인 
        boolean hasLetter = pw.matches(".*[a-zA-Z].*");
        //숫자포함여부 확인
        boolean hasDigit = pw.matches(".*\\d.*");
        //특수문자포함 여부
        boolean hasSpecial = pw.matches(".*[!@#$%^&*()].*");

        //위 조건이 유요해야만 유효한 비밀번호로 인정
        return hasLetter && hasDigit && hasSpecial;

    }

    //============================아이디 중복 확인
    public boolean IdCheck(String userid) {

        //기본값 (false로 설정)
        boolean result = false;

        try {
            //sql 작성 및 실행
            //users 테이블에서 입력한 아이디(user_id)가 존재하는지 검색
            String sql = "SELECT user_id FROM users WHERE user_id=?";
            PreparedStatement pstmt = connectionPool.getConnection().prepareStatement(sql);
            // ? 에 입력값을 바인딩하여 sql 인젝션 방지
            pstmt.setString(1, userid);
            ResultSet rs = pstmt.executeQuery();

            //결과 처리 
            //rs.next 가 true 면 해당 user_id가 이미 존재
            if (rs.next()) {
                //각각의 경우에 joptionpane 경고창으로 사용자에게 결과를 알림
                javax.swing.JOptionPane.showConfirmDialog(null, "사용중인 아이디 입니다", "중복확인",
                        javax.swing.JOptionPane.WARNING_MESSAGE);
                return true;
            } else {
                //각각의 경우에 joptionpane 경고창으로 사용자에게 결과를 알림
                javax.swing.JOptionPane.showConfirmDialog(null, "사용 가능한 아이디 입니다", "중복확인",
                        javax.swing.JOptionPane.WARNING_MESSAGE);
                return false;
            }
            //예외(sql오류나 db연결 예외가 발생하면 콘솔에 출력)
        } catch (Exception e) {
            e.printStackTrace();
        }
        //예외 or 아무 일 없을 시 기본값(false)반환
        return result;

    }

    //==================아이디 찾기
    public String findUserIdByPhone(String user_phone) {
        String userId = null;

        String sql = "SELECT user_id From users WHERE user_phone = ? ";

        try (Connection conn = connectionPool.getConnection(); PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setString(1, user_phone);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    userId = rs.getString("user_id");
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return userId; // null 뜨면 아디찾기 실패
    }

    //==================비밀번호 찾기
    public String findPassword(String user_id, String user_phone) {
        String password = null;

        String sql = "SELECT user_password FROM users WHERE user_id = ? AND user_phone = ? ";
        try (
                Connection conn = connectionPool.getConnection(); PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, user_id);
            pstmt.setString(2, user_phone);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    password = rs.getString("user_password");
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return password; //null 뜨면 비번 찾기 실패
    }

    //===============================회원탈퇴
    public boolean deleteUser(String user_id, String user_password) throws SQLException {

        String sql = "Delete FROM users WHERE user_id = ? AND user_password = ? ";
        int result = 0;

        try (Connection conn = connectionPool.getConnection(); PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, user_id);
            pstmt.setString(2, user_password);

            result = pstmt.executeUpdate(); //성공 시 1 반환

            if (result > 0) {
                System.out.println("사용자 삭제 성공");
                return true;
            } else {
                System.out.println("사용자 삭제 실패");
                return false;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return result == 1;
    }

}


/*
 * //============================아이디 중복 확인
    public boolean isUserIdExist(String userId) {
        //사용자 테이블에서 해당 user_id가 존재하는지 확인하는 SQL
        final String SQL = "SELECT * FROM user WHERE user_id = ?";

        //커넥션 풀에서 db연결을 가져오고 sql 준비
        try (Connection conn = connectionPool.getConnection(); PreparedStatement pstmt = conn.prepareStatement(SQL)) {

            //sql의 ? 자리에 사용자가 입력한 아이디를 설정
            pstmt.setString(1, userId);

            //쿼리를 실행하고 결과가 존재하는지 확인
            //rs.next(); 가 true면 이미 db에 해당 아이디가 존재함
            try (ResultSet rs = pstmt.executeQuery()) {
                return rs.next();
            }
            //예외 발생 시 처리 
        } catch (SQLException e) {
            throw new RuntimeException("아이디 확인 실패", e);
        }
    }
 */
