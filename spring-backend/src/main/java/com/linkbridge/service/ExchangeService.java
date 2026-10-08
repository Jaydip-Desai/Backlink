package com.linkbridge.service;
import com.linkbridge.entity.Exchange;
import com.linkbridge.repository.ExchangeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class ExchangeService {
    @Autowired private ExchangeRepository repository;

    public List<Exchange> getAll() { return repository.findAll(); }
    public Optional<Exchange> getById(Long id) { return repository.findById(id); }
    public Exchange save(Exchange entity) { return repository.save(entity); }
    public void delete(Long id) { repository.deleteById(id); }
}