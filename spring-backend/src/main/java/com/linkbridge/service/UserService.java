package com.linkbridge.service;
import com.linkbridge.entity.User;
import com.linkbridge.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {
    @Autowired private UserRepository repository;

    public List<User> getAll() { return repository.findAll(); }
    public Optional<User> getById(Long id) { return repository.findById(id); }
    public User save(User entity) { return repository.save(entity); }
    public void delete(Long id) { repository.deleteById(id); }
}