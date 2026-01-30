package com.mandap.repository;

import com.mandap.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);

    @Query("SELECT u FROM User u WHERE u.active = true")
    List<User> findAllActive();

    @Query("SELECT u FROM User u WHERE LOWER(u.fullName) LIKE LOWER(CONCAT('%', :name, '%')) OR LOWER(u.username) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<User> searchByName(String name);
}
