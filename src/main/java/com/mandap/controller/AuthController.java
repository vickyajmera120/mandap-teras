package com.mandap.controller;

import com.mandap.dto.ApiResponse;
import com.mandap.dto.LoginRequest;
import com.mandap.dto.LoginResponse;
import com.mandap.entity.User;
import com.mandap.security.CustomUserDetailsService;
import com.mandap.security.JwtTokenProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

        @Autowired
        private AuthenticationManager authenticationManager;

        @Autowired
        private JwtTokenProvider tokenProvider;

        @Autowired
        private CustomUserDetailsService userDetailsService;

        @PostMapping("/login")
        public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
                log.info("Login attempt for user: {}", loginRequest.getUsername());
                try {
                        Authentication authentication = authenticationManager.authenticate(
                                        new UsernamePasswordAuthenticationToken(
                                                        loginRequest.getUsername(),
                                                        loginRequest.getPassword()));

                        SecurityContextHolder.getContext().setAuthentication(authentication);
                        String jwt = tokenProvider.generateToken(authentication);

                        User user = userDetailsService.getUserByUsername(loginRequest.getUsername());

                        LoginResponse response = LoginResponse.builder()
                                        .token(jwt)
                                        .type("Bearer")
                                        .id(user.getId())
                                        .username(user.getUsername())
                                        .fullName(user.getFullName())
                                        .roles(user.getRoles().stream()
                                                        .map(r -> r.getName())
                                                        .collect(Collectors.toSet()))
                                        .permissions(user.getRoles().stream()
                                                        .flatMap(r -> r.getPermissions().stream())
                                                        .map(p -> p.getName())
                                                        .collect(Collectors.toSet()))
                                        .build();

                        log.info("Login successful for user: {}", loginRequest.getUsername());
                        return ResponseEntity.ok(response);
                } catch (Exception e) {
                        log.warn("Login failed for user: {} - {}", loginRequest.getUsername(), e.getMessage());
                        return ResponseEntity.badRequest()
                                        .body(ApiResponse.error("Invalid username or password"));
                }
        }

        @GetMapping("/me")
        public ResponseEntity<?> getCurrentUser(Authentication authentication) {
                if (authentication == null) {
                        log.warn("Unauthenticated request to /api/auth/me");
                        return ResponseEntity.badRequest().body(ApiResponse.error("Not authenticated"));
                }

                User user = userDetailsService.getUserByUsername(authentication.getName());

                LoginResponse response = LoginResponse.builder()
                                .id(user.getId())
                                .username(user.getUsername())
                                .fullName(user.getFullName())
                                .roles(user.getRoles().stream()
                                                .map(r -> r.getName())
                                                .collect(Collectors.toSet()))
                                .permissions(user.getRoles().stream()
                                                .flatMap(r -> r.getPermissions().stream())
                                                .map(p -> p.getName())
                                                .collect(Collectors.toSet()))
                                .build();

                return ResponseEntity.ok(response);
        }
}
