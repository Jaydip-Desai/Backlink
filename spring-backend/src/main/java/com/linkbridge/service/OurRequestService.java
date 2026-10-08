package com.linkbridge.service;
import com.linkbridge.entity.OurRequest;
import com.linkbridge.repository.OurRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class OurRequestService {
    @Autowired private OurRequestRepository repository;

    public List<OurRequest> getAll() { return repository.findAll(); }
    public Optional<OurRequest> getById(Long id) { return repository.findById(id); }
    public OurRequest save(OurRequest entity) { return repository.save(entity); }
    public void delete(Long id) { repository.deleteById(id); }
}