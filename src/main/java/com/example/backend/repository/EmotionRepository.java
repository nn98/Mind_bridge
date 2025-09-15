// repository/EmotionRepository.java
package com.example.backend.repository;

import com.example.backend.entity.EmotionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmotionRepository extends JpaRepository<EmotionEntity, Long> {
}
