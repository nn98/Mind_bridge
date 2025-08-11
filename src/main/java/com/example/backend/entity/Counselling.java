package com.example.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "counselling")
@Getter @Setter @NoArgsConstructor
public class Counselling {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "counsel_id")
    private Long counselId;

    // email은 다른 테이블과 연결되는 외래키로 가정
    @Column(nullable = false)
    private String email;

    @Column(name = "user_counselling_summation")
    private String userCounsellingSummation;

    @Column(name = "user_counselling_emotion")
    private String userCounsellingEmotion;

    @Column(name = "counselor_summation")
    private String counselorSummation;
}
