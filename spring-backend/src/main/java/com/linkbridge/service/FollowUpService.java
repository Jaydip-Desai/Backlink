package com.linkbridge.service;
import com.linkbridge.entity.FollowUp;
import com.linkbridge.repository.FollowUpRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class FollowUpService {
    @Autowired private FollowUpRepository repository;

    public List<FollowUp> getAll() { return repository.findAll(); }
    public Optional<FollowUp> getById(Long id) { return repository.findById(id); }
    public FollowUp save(FollowUp entity) { return repository.save(entity); }
    public void delete(Long id) { repository.deleteById(id); }
}