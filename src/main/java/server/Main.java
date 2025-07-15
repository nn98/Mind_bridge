package server;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("server.mapper")
public class Main {

    public static void main(String[] args) throws Exception {
        SpringApplication.run(Main.class, args);
        System.out.println("==== Spring Boot 시작됨 ====");
    }
}
