package com.linkbridge.service;
import com.linkbridge.entity.TargetUrl;
import com.linkbridge.repository.TargetUrlRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class TargetUrlService {
    @Autowired private TargetUrlRepository repository;

    public List<TargetUrl> getAll() { return repository.findAll(); }
    public Optional<TargetUrl> getById(Long id) { return repository.findById(id); }
    public TargetUrl save(TargetUrl entity) { return repository.save(entity); }
    public void delete(Long id) { repository.deleteById(id); }
}