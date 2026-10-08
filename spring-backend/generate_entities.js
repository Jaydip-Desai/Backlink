
const fs = require("fs");
const path = require("path");

const baseDir = path.join(__dirname, "src/main/java/com/linkbridge/entity");

const files = {
  "User.java": `package com.linkbridge.entity;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private String name;
    @Column(unique = true, nullable = false) private String email;
    @Column(nullable = false) private String passwordHash;
    @Column(nullable = false) private String role;
    private String title;
    private String avatarColor;
    private String status = "active";
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
}`,

  "Domain.java": `package com.linkbridge.entity;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "domains")
@Data
public class Domain {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(unique = true, nullable = false) private String ref;
    @Column(unique = true, nullable = false) private String domain;
    private String websiteUrl;
    private String niche;
    private String country;
    private String language;
    private Integer da;
    private Integer dr;
    private Integer organicTraffic;
    private Integer spamScore;
    private String status = "new";
    
    @ManyToOne @JoinColumn(name = "assigned_to") private User assignedTo;
    @ManyToOne @JoinColumn(name = "added_by") private User addedBy;
    
    @Column(columnDefinition = "TEXT") private String internalNotes;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String tags;
    
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
}`,

  "Exchange.java": `package com.linkbridge.entity;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "exchanges")
@Data
public class Exchange {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(unique = true, nullable = false) private String ref;
    
    @ManyToOne @JoinColumn(name = "partner_domain", referencedColumnName = "domain")
    private Domain partnerDomain;
    
    private Long ourRequestId;
    private Long clientRequestId;
    private String exchangeType;
    private String priority;
    private String status = "pending";
    private LocalDate exchangeDate;
    
    @ManyToOne @JoinColumn(name = "assigned_to") private User assignedTo;
    
    @Column(columnDefinition = "TEXT") private String notes;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
}`
};

for (const [filepath, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(baseDir, filepath), content);
}
console.log("Entities completely mapped with exact relationships.");

