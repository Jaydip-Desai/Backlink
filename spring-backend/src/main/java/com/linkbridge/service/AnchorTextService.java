package com.linkbridge.service;
import com.linkbridge.entity.AnchorText;
import com.linkbridge.repository.AnchorTextRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class AnchorTextService {
    @Autowired private AnchorTextRepository repository;

    public List<AnchorText> getAll() { return repository.findAll(); }
    public Optional<AnchorText> getById(Long id) { return repository.findById(id); }
    public AnchorText save(AnchorText entity) { return repository.save(entity); }
    public void delete(Long id) { repository.deleteById(id); }
}