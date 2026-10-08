package com.linkbridge.service;
import com.linkbridge.entity.Notification;
import com.linkbridge.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class NotificationService {
    @Autowired private NotificationRepository repository;

    public List<Notification> getAll() { return repository.findAll(); }
    public Optional<Notification> getById(Long id) { return repository.findById(id); }
    public Notification save(Notification entity) { return repository.save(entity); }
    public void delete(Long id) { repository.deleteById(id); }
}