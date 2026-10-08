
const fs = require("fs");
const path = require("path");

const baseDir = path.join(__dirname, "src/main/java/com/linkbridge");

const files = {
  "dto/DomainRequest.java": `package com.linkbridge.dto;
import lombok.Data;
@Data public class DomainRequest {
    private String websiteUrl;
    private String niche;
    private String status;
    private String country;
    private boolean override;
}`,
  
  "service/DomainService.java": `package com.linkbridge.service;

import com.linkbridge.entity.Domain;
import com.linkbridge.repository.DomainRepository;
import com.linkbridge.dto.DomainRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class DomainService {
    @Autowired
    private DomainRepository domainRepository;

    public Domain addDomain(DomainRequest request, Long userId) {
        String normalized = request.getWebsiteUrl().replaceFirst("^(http[s]?://www\\\\.|http[s]?://|www\\\\.)","").split("/")[0];
        
        if (!request.isOverride()) {
            Optional<Domain> existing = domainRepository.findByDomain(normalized);
            if (existing.isPresent()) {
                throw new RuntimeException("Duplicate domain exists.");
            }
        }
        
        Domain d = new Domain();
        d.setDomain(normalized);
        d.setWebsiteUrl(request.getWebsiteUrl());
        d.setNiche(request.getNiche());
        d.setStatus(request.getStatus());
        d.setCountry(request.getCountry());
        d.setRef("DOM-" + UUID.randomUUID().toString().substring(0,6).toUpperCase());
        // In real app, log audit here
        return domainRepository.save(d);
    }
}`,

  "repository/DomainRepository.java": `package com.linkbridge.repository;
import com.linkbridge.entity.Domain;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface DomainRepository extends JpaRepository<Domain, Long> {
    Optional<Domain> findByDomain(String domain);
}`

};

for (const [filepath, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(baseDir, filepath), content);
}
console.log("Services generated.");

