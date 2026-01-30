package com.mandap.service;

import com.mandap.dto.CustomerDTO;
import com.mandap.entity.Customer;
import com.mandap.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class CustomerService {

    @Autowired
    private CustomerRepository customerRepository;

    public List<CustomerDTO> getAllCustomers() {
        return customerRepository.findAllActive().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public CustomerDTO getCustomerById(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found: " + id));
        return toDTO(customer);
    }

    public List<CustomerDTO> searchCustomers(String query) {
        return customerRepository.searchByNameOrMobile(query).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public CustomerDTO createCustomer(CustomerDTO dto) {
        Customer customer = Customer.builder()
                .name(dto.getName())
                .mobile(dto.getMobile())
                .alternateContact(dto.getAlternateContact())
                .address(dto.getAddress())
                .notes(dto.getNotes())
                .active(true)
                .build();

        customer = customerRepository.save(customer);
        return toDTO(customer);
    }

    public CustomerDTO updateCustomer(Long id, CustomerDTO dto) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found: " + id));

        customer.setName(dto.getName());
        customer.setMobile(dto.getMobile());
        customer.setAlternateContact(dto.getAlternateContact());
        customer.setAddress(dto.getAddress());
        customer.setNotes(dto.getNotes());
        if (dto.getActive() != null) {
            customer.setActive(dto.getActive());
        }

        customer = customerRepository.save(customer);
        return toDTO(customer);
    }

    public void deleteCustomer(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found: " + id));
        customer.setActive(false);
        customerRepository.save(customer);
    }

    private CustomerDTO toDTO(Customer customer) {
        return CustomerDTO.builder()
                .id(customer.getId())
                .name(customer.getName())
                .mobile(customer.getMobile())
                .alternateContact(customer.getAlternateContact())
                .address(customer.getAddress())
                .notes(customer.getNotes())
                .active(customer.getActive())
                .build();
    }
}
