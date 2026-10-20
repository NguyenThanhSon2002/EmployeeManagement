package com.company.hrms.modules.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public class AuthResponse {

    @JsonProperty("access_token")
    private String accessToken;

    @JsonProperty("refresh_token")
    private String refreshToken;

    @JsonProperty("token_type")
    private String tokenType = "Bearer";

    @JsonProperty("expires_in")
    private long expiresIn;

    private UserInfo user;

    public AuthResponse() {
        this.tokenType = "Bearer";
    }

    public AuthResponse(String accessToken, String refreshToken, String tokenType, long expiresIn, UserInfo user) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.tokenType = tokenType != null ? tokenType : "Bearer";
        this.expiresIn = expiresIn;
        this.user = user;
    }

    public static class UserInfo {
        private Long id;
        private String username;
        private String email;
        private List<String> roles;
        @JsonProperty("employee_id")
        private Long employeeId;
        @JsonProperty("full_name")
        private String fullName;
        @JsonProperty("must_change_password")
        private Boolean mustChangePassword;
        @JsonProperty("branch_id")
        private Long branchId;
        @JsonProperty("branch_name")
        private String branchName;

        public UserInfo() {
        }

        public UserInfo(Long id, String username, String email, List<String> roles, Long employeeId, String fullName, Boolean mustChangePassword) {
            this(id, username, email, roles, employeeId, fullName, mustChangePassword, null, null);
        }

        public UserInfo(Long id, String username, String email, List<String> roles, Long employeeId, String fullName, Boolean mustChangePassword, Long branchId, String branchName) {
            this.id = id;
            this.username = username;
            this.email = email;
            this.roles = roles;
            this.employeeId = employeeId;
            this.fullName = fullName;
            this.mustChangePassword = mustChangePassword;
            this.branchId = branchId;
            this.branchName = branchName;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public List<String> getRoles() { return roles; }
        public void setRoles(List<String> roles) { this.roles = roles; }
        public Long getEmployeeId() { return employeeId; }
        public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
        public Boolean getMustChangePassword() { return mustChangePassword; }
        public void setMustChangePassword(Boolean mustChangePassword) { this.mustChangePassword = mustChangePassword; }
        public Long getBranchId() { return branchId; }
        public void setBranchId(Long branchId) { this.branchId = branchId; }
        public String getBranchName() { return branchName; }
        public void setBranchName(String branchName) { this.branchName = branchName; }
    }

    public String getAccessToken() { return accessToken; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }
    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }
    public String getTokenType() { return tokenType; }
    public void setTokenType(String tokenType) { this.tokenType = tokenType; }
    public long getExpiresIn() { return expiresIn; }
    public void setExpiresIn(long expiresIn) { this.expiresIn = expiresIn; }
    public UserInfo getUser() { return user; }
    public void setUser(UserInfo user) { this.user = user; }
}
