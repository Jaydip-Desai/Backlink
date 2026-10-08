package com.linkbridge.dto;
public class DomainRequest {
    private String websiteUrl;
    private String niche;
    private String status;
    private String country;
    private boolean override;

    public String getWebsiteUrl() { return this.websiteUrl; }
    public void setWebsiteUrl(String websiteUrl) { this.websiteUrl = websiteUrl; }
    public String getNiche() { return this.niche; }
    public void setNiche(String niche) { this.niche = niche; }
    public String getStatus() { return this.status; }
    public void setStatus(String status) { this.status = status; }
    public String getCountry() { return this.country; }
    public void setCountry(String country) { this.country = country; }
    public boolean getOverride() { return this.override; }
    public void setOverride(boolean override) { this.override = override; }
    public boolean isOverride() { return this.override; }
}