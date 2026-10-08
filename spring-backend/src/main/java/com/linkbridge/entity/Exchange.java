package com.linkbridge.entity;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "exchanges")
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

    public Long getId() { return this.id; }
    public void setId(Long id) { this.id = id; }
    public String getRef() { return this.ref; }
    public void setRef(String ref) { this.ref = ref; }
    public Domain getPartnerDomain() { return this.partnerDomain; }
    public void setPartnerDomain(Domain partnerDomain) { this.partnerDomain = partnerDomain; }
    public Long getOurRequestId() { return this.ourRequestId; }
    public void setOurRequestId(Long ourRequestId) { this.ourRequestId = ourRequestId; }
    public Long getClientRequestId() { return this.clientRequestId; }
    public void setClientRequestId(Long clientRequestId) { this.clientRequestId = clientRequestId; }
    public String getExchangeType() { return this.exchangeType; }
    public void setExchangeType(String exchangeType) { this.exchangeType = exchangeType; }
    public String getPriority() { return this.priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public String getStatus() { return this.status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDate getExchangeDate() { return this.exchangeDate; }
    public void setExchangeDate(LocalDate exchangeDate) { this.exchangeDate = exchangeDate; }
    public User getAssignedTo() { return this.assignedTo; }
    public void setAssignedTo(User assignedTo) { this.assignedTo = assignedTo; }
    public String getNotes() { return this.notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public LocalDateTime getCreatedAt() { return this.createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return this.updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}