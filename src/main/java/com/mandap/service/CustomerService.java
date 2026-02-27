package com.mandap.service;

import com.mandap.dto.CustomerDTO;
import com.mandap.entity.Customer;
import com.mandap.repository.CustomerRepository;
import com.mandap.repository.RentalOrderRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
public class CustomerService {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private RentalOrderRepository rentalOrderRepository;

    public List<CustomerDTO> getAllCustomers() {
        java.util.Set<Long> unbilledCustomerIds = new java.util.HashSet<>(
                rentalOrderRepository.findCustomerIdsWithUnbilledOrders());
        java.util.Set<Long> billedCustomerIds = new java.util.HashSet<>(
                rentalOrderRepository.findCustomerIdsWithBilledOrders());

        return customerRepository.findAllActive().stream()
                .map(c -> toDTOWithFlags(c, unbilledCustomerIds, billedCustomerIds))
                .collect(Collectors.toList());
    }

    public CustomerDTO getCustomerById(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found: " + id));
        return toDTO(customer);
    }

    public List<CustomerDTO> searchCustomers(String query) {
        java.util.Set<Long> unbilledCustomerIds = new java.util.HashSet<>(
                rentalOrderRepository.findCustomerIdsWithUnbilledOrders());
        java.util.Set<Long> billedCustomerIds = new java.util.HashSet<>(
                rentalOrderRepository.findCustomerIdsWithBilledOrders());

        return customerRepository.searchByNameOrMobile(query).stream()
                .map(c -> toDTOWithFlags(c, unbilledCustomerIds, billedCustomerIds))
                .collect(Collectors.toList());
    }

    public CustomerDTO createCustomer(CustomerDTO dto) {
        Customer customer = Customer.builder()
                .name(dto.getName())
                .mobile(dto.getMobile())
                .palNumbers(dto.getPalNumbers() != null ? new java.util.HashSet<>(dto.getPalNumbers())
                        : new java.util.HashSet<>())
                .alternateContact(dto.getAlternateContact())
                .address(dto.getAddress())
                .notes(dto.getNotes())
                .active(true)
                .build();

        customer = customerRepository.save(customer);
        log.info("Customer created: id={}, name={}, mobile={}", customer.getId(), customer.getName(),
                customer.getMobile());
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
        if (dto.getPalNumbers() != null) {
            customer.setPalNumbers(new java.util.HashSet<>(dto.getPalNumbers()));
        }
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
        log.info("Customer soft-deleted: id={}", id);
    }

    private CustomerDTO toDTO(Customer customer) {
        return toDTOWithFlags(customer, null, null);
    }

    private CustomerDTO toDTOWithFlags(Customer customer, java.util.Set<Long> unbilledIds,
            java.util.Set<Long> billedIds) {
        return CustomerDTO.builder()
                .id(customer.getId())
                .name(customer.getName())
                .mobile(customer.getMobile())
                .palNumbers(customer.getPalNumbers() != null ? new java.util.ArrayList<>(customer.getPalNumbers())
                        : new java.util.ArrayList<>())
                .alternateContact(customer.getAlternateContact())
                .address(customer.getAddress())
                .notes(customer.getNotes())
                .active(customer.getActive())
                .hasUnbilledOrders(unbilledIds != null && unbilledIds.contains(customer.getId()))
                .hasBilledOrders(billedIds != null && billedIds.contains(customer.getId()))
                .build();
    }
}
