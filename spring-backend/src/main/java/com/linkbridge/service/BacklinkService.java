package com.linkbridge.service;
import com.linkbridge.entity.Backlink;
import com.linkbridge.repository.BacklinkRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class BacklinkService {
    @Autowired private BacklinkRepository repository;

    public List<Backlink> getAll() { return repository.findAll(); }
    public Optional<Backlink> getById(Long id) { return repository.findById(id); }
    public Backlink save(Backlink entity) { return repository.save(entity); }
    public void delete(Long id) { repository.deleteById(id); }
}