package database;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.LinkedList;

public class SimpleConnectionPool {
    // 싱글턴처럼 활용가능(정적 전역 인스턴스)
    public static SimpleConnectionPool connectionPool;

    //커넥션을 저장하는 리스트
    private final LinkedList<Connection> pool = new LinkedList<>();
    private final int MAX_POOL_SIZE = 10;

    //DB 접속 정보
    private final String url = "jdbc:mysql://sol-skhu.duckdns.org:3306/gabia_first?serverTimezone=Asia/Seoul&characterEncoding=UTF-8&useSSL=false&useSSL=false&allowPublicKeyRetrieval=true";
    private final String user = "member";
    private final String password = "12345";

    //생성자에서 커넥션 생성해 풀에 저장
    public SimpleConnectionPool() throws ClassNotFoundException, SQLException {
//        Class.forName("com.mysql.cj.jdbc.Driver");
        for (int i = 0; i < MAX_POOL_SIZE; i++) {
            pool.add(createNewConnection());
        }
    }

    //실제 커넥션 하나 생성
    private Connection createNewConnection() throws SQLException {
        return DriverManager.getConnection(url, user, password);
    }


    // 커넥션 빌려주기(비어 있으면 새로 만듬)
    public synchronized Connection getConnection() {
        try {
            if (pool.isEmpty()) {
                // 풀에 없으면 새로 생성 (풀 최대치 제한 가능)
                return createNewConnection();
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return pool.removeFirst();
    }

    // 커넥션 반납
    public synchronized void releaseConnection(Connection conn) {
        if (conn != null) {
            pool.addLast(conn);
        }
    }
}
