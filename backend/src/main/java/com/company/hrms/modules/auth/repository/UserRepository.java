package com.company.hrms.modules.auth.repository;

import com.company.hrms.modules.auth.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByUsernameAndDeletedAtIsNull(String username);

    Optional<User> findByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    @Query("SELECT DISTINCT u.id FROM User u JOIN u.roles r " +
            "WHERE r.roleCode IN :roleCodes AND u.isActive = true AND u.deletedAt IS NULL")
    List<Long> findActiveUserIdsByRoleCodes(@Param("roleCodes") Collection<String> roleCodes);
}
