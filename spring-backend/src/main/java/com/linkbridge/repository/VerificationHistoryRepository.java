package com.linkbridge.repository;
import com.linkbridge.entity.VerificationHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VerificationHistoryRepository extends JpaRepository<VerificationHistory, Long> {
}