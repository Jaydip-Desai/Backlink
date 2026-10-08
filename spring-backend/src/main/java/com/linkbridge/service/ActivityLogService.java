package com.linkbridge.service;
import com.linkbridge.entity.ActivityLog;
import com.linkbridge.repository.ActivityLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class ActivityLogService {
    @Autowired private ActivityLogRepository repository;

    public List<ActivityLog> getAll() { return repository.findAll(); }
    public Optional<ActivityLog> getById(Long id) { return repository.findById(id); }
    public ActivityLog save(ActivityLog entity) { return repository.save(entity); }
    public void delete(Long id) { repository.deleteById(id); }
}