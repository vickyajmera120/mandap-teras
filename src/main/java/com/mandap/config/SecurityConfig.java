package com.mandap.config;

import com.mandap.security.CustomUserDetailsService;
import com.mandap.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.util.Arrays;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:4200"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With", "Accept",
                "Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"));
        configuration
                .setExposedHeaders(Arrays.asList("Access-Control-Allow-Origin", "Access-Control-Allow-Credentials"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/", "/index.html", "/login.html").permitAll()
                        .requestMatchers("/css/**", "/js/**", "/images/**", "/pages/**").permitAll()
                        .requestMatchers("/favicon.ico").permitAll()

                        // Admin only endpoints
                        .requestMatchers("/api/users/**").hasRole("ADMIN")
                        .requestMatchers("/api/roles/**").hasRole("ADMIN")

                        // Bill management
                        .requestMatchers(HttpMethod.DELETE, "/api/bills/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/bills/**")
                        .hasAnyAuthority("BILL_CREATE", "ROLE_ADMIN", "ROLE_MANAGER", "ROLE_BILLING_CLERK")
                        .requestMatchers(HttpMethod.GET, "/api/bills/**").authenticated()

                        // Customer management
                        .requestMatchers(HttpMethod.POST, "/api/customers/**")
                        .hasAnyAuthority("CUSTOMER_WRITE", "ROLE_ADMIN", "ROLE_MANAGER", "ROLE_BILLING_CLERK")
                        .requestMatchers(HttpMethod.PUT, "/api/customers/**")
                        .hasAnyAuthority("CUSTOMER_WRITE", "ROLE_ADMIN", "ROLE_MANAGER", "ROLE_BILLING_CLERK")
                        .requestMatchers(HttpMethod.GET, "/api/customers/**").authenticated()

                        // Event management
                        .requestMatchers(HttpMethod.POST, "/api/events/**")
                        .hasAnyAuthority("EVENT_WRITE", "ROLE_ADMIN", "ROLE_MANAGER")
                        .requestMatchers(HttpMethod.PUT, "/api/events/**")
                        .hasAnyAuthority("EVENT_WRITE", "ROLE_ADMIN", "ROLE_MANAGER")
                        .requestMatchers(HttpMethod.GET, "/api/events/**").authenticated()

                        // Inventory - admin/manager only for modifications
                        .requestMatchers(HttpMethod.PUT, "/api/inventory/**").hasAnyRole("ADMIN", "MANAGER")
                        .requestMatchers(HttpMethod.GET, "/api/inventory/**").authenticated()

                        // All other API endpoints require authentication
                        .requestMatchers("/api/**").authenticated()

                        .anyRequest().permitAll())
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
