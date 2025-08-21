package com.example.backend;

import com.example.backend.entity.Counselling;
import com.example.backend.repository.CounsellingRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DbTestRunner implements CommandLineRunner {

    private final CounsellingRepository counsellingRepository;

    public DbTestRunner(CounsellingRepository counsellingRepository) {
        this.counsellingRepository = counsellingRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        String testEmail = "kim@naver.com"; // 확인할 이메일
        List<Counselling> list = counsellingRepository.findByEmail(testEmail);

        System.out.println("=== 상담 내역 확인 ===");
        if (list.isEmpty()) {
            System.out.println("해당 이메일로 진행된 상담이 없습니다.");
        } else {
            for (Counselling c : list) {
                System.out.println("ID: " + c.getCounselId());
                System.out.println("Email: " + c.getEmail());
                System.out.println("상담 요약: " + c.getUserCounsellingSummation());
                System.out.println("감정: " + c.getUserCounsellingEmotion());
                System.out.println("상담사 요약: " + c.getCounselorSummation());
                System.out.println("---------------------------");
            }
        }
    }
}
