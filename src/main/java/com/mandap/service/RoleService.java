package com.mandap.service;

import com.mandap.dto.RoleDTO;
import com.mandap.entity.Permission;
import com.mandap.entity.Role;
import com.mandap.repository.PermissionRepository;
import com.mandap.repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class RoleService {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PermissionRepository permissionRepository;

    public List<RoleDTO> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public RoleDTO getRoleById(Long id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found: " + id));
        return toDTO(role);
    }

    public RoleDTO createRole(RoleDTO dto) {
        if (roleRepository.existsByName(dto.getName())) {
            throw new RuntimeException("Role already exists: " + dto.getName());
        }

        Set<Permission> permissions = new HashSet<>();
        if (dto.getPermissionIds() != null) {
            for (Long permId : dto.getPermissionIds()) {
                Permission perm = permissionRepository.findById(permId)
                        .orElseThrow(() -> new RuntimeException("Permission not found: " + permId));
                permissions.add(perm);
            }
        }

        Role role = Role.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .permissions(permissions)
                .build();

        role = roleRepository.save(role);
        return toDTO(role);
    }

    public RoleDTO updateRole(Long id, RoleDTO dto) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found: " + id));

        role.setDescription(dto.getDescription());

        if (dto.getPermissionIds() != null) {
            Set<Permission> permissions = new HashSet<>();
            for (Long permId : dto.getPermissionIds()) {
                Permission perm = permissionRepository.findById(permId)
                        .orElseThrow(() -> new RuntimeException("Permission not found: " + permId));
                permissions.add(perm);
            }
            role.setPermissions(permissions);
        }

        role = roleRepository.save(role);
        return toDTO(role);
    }

    public void deleteRole(Long id) {
        roleRepository.deleteById(id);
    }

    public List<Permission> getAllPermissions() {
        return permissionRepository.findAll();
    }

    private RoleDTO toDTO(Role role) {
        Set<Long> permissionIds = role.getPermissions().stream()
                .map(Permission::getId)
                .collect(Collectors.toSet());

        return RoleDTO.builder()
                .id(role.getId())
                .name(role.getName())
                .description(role.getDescription())
                .permissionIds(permissionIds)
                .build();
    }
}
