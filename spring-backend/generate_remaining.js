
const fs = require("fs");
const path = require("path");

const baseDir = path.join(__dirname, "src/main/java/com/linkbridge");

const entities = [
  "Backlink", "VerificationHistory", "FollowUp", "TargetUrl", "AnchorText", 
  "Contact", "Notification", "ActivityLog", "Report", "TeamMember"
];

entities.forEach(e => {
    // Basic Entity
    const entityStr = `package com.linkbridge.entity;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "${e.toLowerCase()}s")
@Data
public class ${e} {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
}`;
    fs.writeFileSync(path.join(baseDir, `entity/${e}.java`), entityStr);

    // Repository
    const repoStr = `package com.linkbridge.repository;
import com.linkbridge.entity.${e};
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ${e}Repository extends JpaRepository<${e}, Long> {
}`;
    fs.writeFileSync(path.join(baseDir, `repository/${e}Repository.java`), repoStr);
    
    // Controller
    const controllerStr = `package com.linkbridge.controller;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;

@RestController
@RequestMapping("/api/${e.toLowerCase()}s")
public class ${e}Controller {
}`;
    fs.writeFileSync(path.join(baseDir, `controller/${e}Controller.java`), controllerStr);
});

console.log("Remaining modules generated.");

