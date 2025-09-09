package com.example.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "counselling")
@Getter
@Setter
public class CounsellingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // auto increment
    private Long counselId;

    @Column(name = "user_email", nullable = false, length = 255)
    private String userEmail;

    @Column(name = "user_name", nullable = false, length = 255)
    private String userName;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(name = "risk_factors", columnDefinition = "TEXT")
    private String riskFactors;

    @Column(name = "protective_factors", columnDefinition = "TEXT")
    private String protectiveFactors;

    @Column(name = "summary_emotion", columnDefinition= "TEXT")
    private String summaryEmotion;
    
}
