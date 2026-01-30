package com.mandap.controller;

import com.mandap.dto.ApiResponse;
import com.mandap.dto.RoleDTO;
import com.mandap.entity.Permission;
import com.mandap.service.RoleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
@CrossOrigin(origins = "*")
public class RoleController {

    @Autowired
    private RoleService roleService;

    @GetMapping
    public ResponseEntity<List<RoleDTO>> getAllRoles() {
        return ResponseEntity.ok(roleService.getAllRoles());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RoleDTO> getRoleById(@PathVariable Long id) {
        return ResponseEntity.ok(roleService.getRoleById(id));
    }

    @GetMapping("/permissions")
    public ResponseEntity<List<Permission>> getAllPermissions() {
        return ResponseEntity.ok(roleService.getAllPermissions());
    }

    @PostMapping
    public ResponseEntity<RoleDTO> createRole(@RequestBody RoleDTO dto) {
        return ResponseEntity.ok(roleService.createRole(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RoleDTO> updateRole(@PathVariable Long id, @RequestBody RoleDTO dto) {
        return ResponseEntity.ok(roleService.updateRole(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteRole(@PathVariable Long id) {
        roleService.deleteRole(id);
        return ResponseEntity.ok(ApiResponse.success("Role deleted successfully"));
    }
}
