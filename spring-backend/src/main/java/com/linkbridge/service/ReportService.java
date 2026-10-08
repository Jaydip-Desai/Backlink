package com.linkbridge.service;
import com.linkbridge.entity.Report;
import com.linkbridge.repository.ReportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class ReportService {
    @Autowired private ReportRepository repository;

    public List<Report> getAll() { return repository.findAll(); }
    public Optional<Report> getById(Long id) { return repository.findById(id); }
    public Report save(Report entity) { return repository.save(entity); }
    public void delete(Long id) { repository.deleteById(id); }
}