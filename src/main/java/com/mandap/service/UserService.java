package com.mandap.service;

import com.mandap.dto.UserDTO;
import com.mandap.entity.Role;
import com.mandap.entity.User;
import com.mandap.repository.RoleRepository;
import com.mandap.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public UserDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));
        return toDTO(user);
    }

    public UserDTO createUser(UserDTO dto) {
        if (userRepository.existsByUsername(dto.getUsername())) {
            throw new RuntimeException("Username already exists: " + dto.getUsername());
        }

        Set<Role> roles = new HashSet<>();
        if (dto.getRoleIds() != null) {
            for (Long roleId : dto.getRoleIds()) {
                Role role = roleRepository.findById(roleId)
                        .orElseThrow(() -> new RuntimeException("Role not found: " + roleId));
                roles.add(role);
            }
        }

        User user = User.builder()
                .username(dto.getUsername())
                .password(passwordEncoder.encode(dto.getPassword()))
                .fullName(dto.getFullName())
                .email(dto.getEmail())
                .active(true)
                .roles(roles)
                .build();

        user = userRepository.save(user);
        return toDTO(user);
    }

    public UserDTO updateUser(Long id, UserDTO dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));

        user.setFullName(dto.getFullName());
        user.setEmail(dto.getEmail());

        if (dto.getPassword() != null && !dto.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(dto.getPassword()));
        }

        if (dto.getActive() != null) {
            user.setActive(dto.getActive());
        }

        if (dto.getRoleIds() != null) {
            Set<Role> roles = new HashSet<>();
            for (Long roleId : dto.getRoleIds()) {
                Role role = roleRepository.findById(roleId)
                        .orElseThrow(() -> new RuntimeException("Role not found: " + roleId));
                roles.add(role);
            }
            user.setRoles(roles);
        }

        user = userRepository.save(user);
        return toDTO(user);
    }

    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));
        user.setActive(false);
        userRepository.save(user);
    }

    private UserDTO toDTO(User user) {
        Set<Long> roleIds = user.getRoles().stream()
                .map(Role::getId)
                .collect(Collectors.toSet());

        return UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .active(user.getActive())
                .roleIds(roleIds)
                .build();
    }
}
