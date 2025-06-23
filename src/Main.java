import database.SimpleConnectionPool;

public class Main {
    public static void main(String[] args) throws Exception {
        SimpleConnectionPool.connectionPool = new SimpleConnectionPool();
        System.out.println(SimpleConnectionPool.connectionPool.getConnection());
    }
}
