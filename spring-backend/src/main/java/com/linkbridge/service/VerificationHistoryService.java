package com.linkbridge.service;
import com.linkbridge.entity.VerificationHistory;
import com.linkbridge.repository.VerificationHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class VerificationHistoryService {
    @Autowired private VerificationHistoryRepository repository;

    public List<VerificationHistory> getAll() { return repository.findAll(); }
    public Optional<VerificationHistory> getById(Long id) { return repository.findById(id); }
    public VerificationHistory save(VerificationHistory entity) { return repository.save(entity); }
    public void delete(Long id) { repository.deleteById(id); }
}