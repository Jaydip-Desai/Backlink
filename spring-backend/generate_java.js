
const fs = require("fs");
const path = require("path");

const entities = ["User", "Domain", "OurRequest", "ClientRequest", "Exchange", "Backlink", "VerificationHistory", "FollowUp", "TargetUrl", "AnchorText", "Contact", "Notification", "ActivityLog"];

const baseDir = path.join(__dirname, "src/main/java/com/linkbridge");

entities.forEach(e => {
    // Entity
    const entityStr = `package com.linkbridge.entity;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "${e.toLowerCase()}s")
@Data
public class ${e} {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
}
`;
    fs.writeFileSync(path.join(baseDir, `entity/${e}.java`), entityStr);

    // Repository
    const repoStr = `package com.linkbridge.repository;
import com.linkbridge.entity.${e};
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ${e}Repository extends JpaRepository<${e}, Long> {
}
`;
    fs.writeFileSync(path.join(baseDir, `repository/${e}Repository.java`), repoStr);

    // Controller
    const controllerStr = `package com.linkbridge.controller;
import com.linkbridge.entity.${e};
import com.linkbridge.repository.${e}Repository;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.List;

@RestController
@RequestMapping("/api/${e.toLowerCase()}s")
public class ${e}Controller {
    @Autowired
    private ${e}Repository repository;

    @GetMapping
    public List<${e}> getAll() {
        return repository.findAll();
    }
}
`;
    fs.writeFileSync(path.join(baseDir, `controller/${e}Controller.java`), controllerStr);
});

console.log("Generated boilerplate for " + entities.length + " modules.");

