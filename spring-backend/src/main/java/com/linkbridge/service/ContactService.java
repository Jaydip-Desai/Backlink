package com.linkbridge.service;
import com.linkbridge.entity.Contact;
import com.linkbridge.repository.ContactRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class ContactService {
    @Autowired private ContactRepository repository;

    public List<Contact> getAll() { return repository.findAll(); }
    public Optional<Contact> getById(Long id) { return repository.findById(id); }
    public Contact save(Contact entity) { return repository.save(entity); }
    public void delete(Long id) { repository.deleteById(id); }
}