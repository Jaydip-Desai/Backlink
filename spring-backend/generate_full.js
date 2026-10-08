
const fs = require("fs");
const path = require("path");

const baseDir = path.join(__dirname, "src/main/java/com/linkbridge");
const entities = ["User", "Domain", "OurRequest", "ClientRequest", "Exchange", "Backlink", "VerificationHistory", "FollowUp", "TargetUrl", "AnchorText", "Contact", "Notification", "ActivityLog", "Report", "TeamMember"];

entities.forEach(e => {
    const lowerE = e.toLowerCase();
    
    // Create Service
    const serviceStr = `package com.linkbridge.service;
import com.linkbridge.entity.${e};
import com.linkbridge.repository.${e}Repository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class ${e}Service {
    @Autowired private ${e}Repository repository;

    public List<${e}> getAll() { return repository.findAll(); }
    public Optional<${e}> getById(Long id) { return repository.findById(id); }
    public ${e} save(${e} entity) { return repository.save(entity); }
    public void delete(Long id) { repository.deleteById(id); }
}`;
    fs.writeFileSync(path.join(baseDir, `service/${e}Service.java`), serviceStr);

    // Create Controller
    const controllerStr = `package com.linkbridge.controller;
import com.linkbridge.entity.${e};
import com.linkbridge.service.${e}Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/${lowerE}s")
public class ${e}Controller {
    @Autowired private ${e}Service service;

    @GetMapping
    public Map<String, Object> getAll() {
        Map<String, Object> response = new HashMap<>();
        response.put("${lowerE}s", service.getAll());
        response.put("total", service.getAll().size());
        response.put("page", 1);
        response.put("limit", 100);
        return response;
    }

    @PostMapping
    public ${e} create(@RequestBody ${e} entity) {
        return service.save(entity);
    }
    
    @PutMapping("/{id}")
    public ${e} update(@PathVariable Long id, @RequestBody ${e} entity) {
        entity.setId(id);
        return service.save(entity);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}`;
    fs.writeFileSync(path.join(baseDir, `controller/${e}Controller.java`), controllerStr);
});

console.log("Full architecture generated.");

