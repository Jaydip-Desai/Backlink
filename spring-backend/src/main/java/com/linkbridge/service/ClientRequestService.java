package com.linkbridge.service;
import com.linkbridge.entity.ClientRequest;
import com.linkbridge.repository.ClientRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class ClientRequestService {
    @Autowired private ClientRequestRepository repository;

    public List<ClientRequest> getAll() { return repository.findAll(); }
    public Optional<ClientRequest> getById(Long id) { return repository.findById(id); }
    public ClientRequest save(ClientRequest entity) { return repository.save(entity); }
    public void delete(Long id) { repository.deleteById(id); }
}