package com.linkbridge.entity;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "domains")
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

    public Long getId() { return this.id; }
    public void setId(Long id) { this.id = id; }
    public String getRef() { return this.ref; }
    public void setRef(String ref) { this.ref = ref; }
    public String getDomain() { return this.domain; }
    public void setDomain(String domain) { this.domain = domain; }
    public String getWebsiteUrl() { return this.websiteUrl; }
    public void setWebsiteUrl(String websiteUrl) { this.websiteUrl = websiteUrl; }
    public String getNiche() { return this.niche; }
    public void setNiche(String niche) { this.niche = niche; }
    public String getCountry() { return this.country; }
    public void setCountry(String country) { this.country = country; }
    public String getLanguage() { return this.language; }
    public void setLanguage(String language) { this.language = language; }
    public Integer getDa() { return this.da; }
    public void setDa(Integer da) { this.da = da; }
    public Integer getDr() { return this.dr; }
    public void setDr(Integer dr) { this.dr = dr; }
    public Integer getOrganicTraffic() { return this.organicTraffic; }
    public void setOrganicTraffic(Integer organicTraffic) { this.organicTraffic = organicTraffic; }
    public Integer getSpamScore() { return this.spamScore; }
    public void setSpamScore(Integer spamScore) { this.spamScore = spamScore; }
    public String getStatus() { return this.status; }
    public void setStatus(String status) { this.status = status; }
    public User getAssignedTo() { return this.assignedTo; }
    public void setAssignedTo(User assignedTo) { this.assignedTo = assignedTo; }
    public User getAddedBy() { return this.addedBy; }
    public void setAddedBy(User addedBy) { this.addedBy = addedBy; }
    public String getInternalNotes() { return this.internalNotes; }
    public void setInternalNotes(String internalNotes) { this.internalNotes = internalNotes; }
    public String getTags() { return this.tags; }
    public void setTags(String tags) { this.tags = tags; }
    public LocalDateTime getCreatedAt() { return this.createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return this.updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}