package com.linkbridge.service;
import com.linkbridge.entity.Domain;
import com.linkbridge.repository.DomainRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class DomainService {
    @Autowired private DomainRepository repository;

    public List<Domain> getAll() { return repository.findAll(); }
    public Optional<Domain> getById(Long id) { return repository.findById(id); }
    public Domain save(Domain entity) { return repository.save(entity); }
    public void delete(Long id) { repository.deleteById(id); }
}