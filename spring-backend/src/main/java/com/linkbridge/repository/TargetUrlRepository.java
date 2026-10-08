package com.linkbridge.repository;
import com.linkbridge.entity.TargetUrl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TargetUrlRepository extends JpaRepository<TargetUrl, Long> {
}