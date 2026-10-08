package com.linkbridge.service;
import com.linkbridge.entity.TeamMember;
import com.linkbridge.repository.TeamMemberRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class TeamMemberService {
    @Autowired private TeamMemberRepository repository;

    public List<TeamMember> getAll() { return repository.findAll(); }
    public Optional<TeamMember> getById(Long id) { return repository.findById(id); }
    public TeamMember save(TeamMember entity) { return repository.save(entity); }
    public void delete(Long id) { repository.deleteById(id); }
}