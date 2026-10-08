package com.linkbridge.repository;
import com.linkbridge.entity.Backlink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BacklinkRepository extends JpaRepository<Backlink, Long> {
}