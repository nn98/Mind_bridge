package database;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.Collections;
import java.util.List;

public class DatabaseCheck {
    //DB 접속 정보

    static String url = "jdbc:mysql://sol-skhu.duckdns.org:3306/gabia_first?serverTimezone=Asia/Seoul&characterEncoding=UTF-8&useSSL=false&useSSL=false&allowPublicKeyRetrieval=true";
    static String user = "member";
    static String password = "12345";

    // DB 연결 메서드 getCon()
    public static Connection getCon() throws Exception {

        Class.forName("com.mysql.cj.jdbc.Driver");  // 드라이버 로드
        System.out.println("드라이버 로드 성공");

        Connection conn = DriverManager.getConnection(url, user, password); //db연결
        System.out.println("디비 연결 성공");

        return conn;
    }

    //main
    public static void main(String[] args) {

        try {
            //--insert--
            //List<String> columns = List.of("user_id", "user_email", "user_password", "user_phone");
            //List<String> values = List.of("user50", "user50@example.com", "pass50", "010-5050-5050");
            //insertIntoTable("users", columns, values);
            //----------

            //showAllTables(); //테이블 목록 확인
            //createTable("") //테이블 생성
            //showColumns("Total_Board"); //특정 테이블 컬럼 확인
            //selectAll("users");//특정 테이블 데이터 확인
            //deleteData("", "", ""); //특정 테이블에서 특정 데이터 삭제 
            //showPrimaryKeys("users"); //특정 테이블의 PK키 확인 
            //updateData("","","",""); //컬럼 업데이트
            //addColumn("", "", "");

        } catch (Exception e) {
            e.printStackTrace();
        }

    }
    
    //------------------------DB 테이블 추가 --------------
    public static void createTable(String createTableSQL) {
        try (Connection conn = getCon(); Statement stmt = conn.createStatement()) {

            stmt.executeUpdate(createTableSQL);
            System.out.println("테이블 생성 완료");

        } catch (Exception e) {
            System.out.println("테이블 생성 중 오류 발생");
            e.printStackTrace();
        }
    }

    //--------------------------DB 테이블 전체 확인------------------
    public static void showAllTables() {
        String sql = "SHOW TABLES";

        try (Connection con = getCon(); PreparedStatement ps = con.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {

            System.out.println("데이터베이스에 존재하는 테이블 목록:");
            while (rs.next()) {
                String tableName = rs.getString(1); // 컬럼명이 아닌 인덱스로 접근
                System.out.println("- " + tableName);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    //-----------------특정 테이블 컬럼 확인---------------------
    public static void showColumns(String tableName) {
        try (Connection con = getCon()) {
            DatabaseMetaData metaData = con.getMetaData();
            ResultSet rs = metaData.getColumns(null, null, tableName, null);

            System.out.println("테이블 '" + tableName + "'의 컬럼 목록:");
            while (rs.next()) {
                String columnName = rs.getString("COLUMN_NAME");
                String type = rs.getString("TYPE_NAME");
                int size = rs.getInt("COLUMN_SIZE");

                System.out.printf("- %s (%s(%d))\n", columnName, type, size);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    //--------------------------특정 테이블에 컬럼 추가------------
    public static void addColumn(String tableName, String columnName, String columnType) {
        String sql = "ALTER TABLE " + tableName + " ADD COLUMN " + columnName + " " + columnType;

        try (Connection con = getCon(); Statement stmt = con.createStatement()) {

            stmt.executeUpdate(sql);
            System.out.println("컬럼 추가 성공: " + columnName + " (" + columnType + ")");

        } catch (Exception e) {
            System.out.println("컬럼 추가 실패: " + e.getMessage());
        }
    }

    //--------------특정 테이블의 데이터 조회--------------------
    public static void selectAll(String tableName) {
        String sql = "SELECT * FROM " + tableName;

        try (Connection con = getCon(); PreparedStatement ps = con.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {

            int columnCount = rs.getMetaData().getColumnCount();

            System.out.println("'" + tableName + "' 테이블 데이터:");

            while (rs.next()) {
                for (int i = 1; i <= columnCount; i++) {
                    String columnName = rs.getMetaData().getColumnName(i);
                    String value = rs.getString(i);
                    System.out.print(columnName + ": " + value + "  ");
                }
                System.out.println(); // 줄 바꿈
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    //특정 테이블 삭제 기능 
    public static void dropTable(String tableName) {
        String sql = "DROP TABLE IF EXISTS " + tableName;

        try (Connection con = getCon(); Statement stmt = con.createStatement()) {

            stmt.executeUpdate(sql);
            System.out.println(" 테이블 삭제 완료: " + tableName);

        } catch (Exception e) {
            System.out.println(" 테이블 삭제 실패: " + e.getMessage());
        }
    }

    //특정 테이블에 데이터 삽입 ---------------- insert ---------------------
    public static void insertIntoTable(String tableName, List<String> columns, List<String> values) {
        if (columns.size() != values.size()) {
            System.out.println(" 컬럼 수와 값의 수가 다릅니다.");
            return;
        }

        String columnPart = String.join(", ", columns);
        String questionMarks = String.join(", ", Collections.nCopies(values.size(), "?"));
        String sql = "INSERT INTO " + tableName + " (" + columnPart + ") VALUES (" + questionMarks + ")";

        try (Connection con = getCon(); // getCon()으로 연결
                 PreparedStatement ps = con.prepareStatement(sql)) {

            for (int i = 0; i < values.size(); i++) {
                ps.setString(i + 1, values.get(i)); // 모두 문자열로 처리
            }

            int result = ps.executeUpdate();

            if (result > 0) {
                System.out.println(" 데이터 삽입 성공");
            } else {
                System.out.println(" 데이터 삽입 실패");
            }

        } catch (Exception e) {
            System.out.println(" 삽입 중 오류 발생: " + e.getMessage());
        }
    }

    //update 쿼리 실행 메서드
    public static void updateData(String tableName, String setColumn, String setValue, String whereColumn, String whereValue) {
        String sql = "UPDATE " + tableName + " SET " + setColumn + " = ? WHERE " + whereColumn + " = ?";

        try (Connection con = getCon(); PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setString(1, setValue);
            ps.setString(2, whereValue);

            int result = ps.executeUpdate();
            System.out.println(result + "개의 데이터가 업데이트 되었습니다.");

        } catch (Exception e) {
            System.out.println("업데이트 실패: " + e.getMessage());
        }
    }
//-----------------------특정 테이블 특정 조건 데이터 삭제-----------delete----

    public static void deleteData(String tableName, String columnName, String value) {
        String sql = "DELETE FROM " + tableName + " WHERE " + columnName + " = ?";

        try (Connection con = getCon(); PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setString(1, value);
            int result = ps.executeUpdate();

            if (result > 0) {
                System.out.println(result + "개의 데이터가 삭제되었습니다.");
            } else {
                System.out.println("조건에 맞는 데이터가 없습니다.");
            }

        } catch (Exception e) {
            System.out.println(" 데이터 삭제 실패: " + e.getMessage());
        }
    }

    //---------------PK키 확인 메서드----------------------------
    public static void showPrimaryKeys(String tableName) {
        try (Connection con = getCon()) {
            DatabaseMetaData metaData = con.getMetaData();
            ResultSet rs = metaData.getPrimaryKeys(null, null, tableName);

            System.out.println("테이블 '" + tableName + "'의 Primary Key 컬럼:");
            boolean found = false;
            while (rs.next()) {
                String columnName = rs.getString("COLUMN_NAME");
                System.out.println("- " + columnName);
                found = true;
            }

            if (!found) {
                System.out.println(" Primary Key가 설정되어 있지 않습니다.");
            }

        } catch (Exception e) {
            System.out.println(" PK 확인 중 오류 발생: " + e.getMessage());
        }
    }

}
