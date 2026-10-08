package com.linkbridge.repository;
import com.linkbridge.entity.AnchorText;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AnchorTextRepository extends JpaRepository<AnchorText, Long> {
}