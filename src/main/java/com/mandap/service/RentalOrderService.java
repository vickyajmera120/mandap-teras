package com.mandap.service;

import com.mandap.dto.RentalOrderDTO;
import com.mandap.dto.RentalOrderItemDTO;
import com.mandap.dto.RentalOrderTransactionDTO;
import com.mandap.entity.*;
import com.mandap.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Year;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for managing rental order lifecycle: booking, dispatch, return, and
 * billing integration.
 */
@Slf4j
@Service
@Transactional
public class RentalOrderService {

        @Autowired
        private RentalOrderRepository rentalOrderRepository;

        @Autowired
        private RentalOrderItemRepository rentalOrderItemRepository;

        @Autowired
        private RentalOrderTransactionRepository rentalOrderTransactionRepository;

        @Autowired
        private CustomerRepository customerRepository;

        @Autowired
        private InventoryItemRepository inventoryItemRepository;

        /**
         * Get all rental orders.
         */
        public List<RentalOrderDTO> getAllOrders() {
                return rentalOrderRepository.findAll().stream()
                                .map(this::toDTO)
                                .collect(Collectors.toList());
        }

        /**
         * Get active (non-completed, non-cancelled) orders.
         */
        public List<RentalOrderDTO> getActiveOrders() {
                return rentalOrderRepository.findActiveOrders().stream()
                                .map(this::toDTO)
                                .collect(Collectors.toList());
        }

        /**
         * Get order by ID.
         */
        public RentalOrderDTO getOrderById(Long id) {
                RentalOrder order = rentalOrderRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException(
                                                "Rental order not found: " + (id != null ? id : "null")));
                return toDTO(order);
        }

        /**
         * Create a new booking (rental order).
         * This reserves items but does not affect available stock yet.
         */
        public RentalOrderDTO createBooking(RentalOrderDTO dto) {
                log.info("Creating booking for customerId={}, items={}", dto.getCustomerId(),
                                dto.getItems() != null ? dto.getItems().size() : 0);
                Customer customer = customerRepository.findById(dto.getCustomerId())
                                .orElseThrow(() -> new RuntimeException("Customer not found: "
                                                + (dto.getCustomerId() != null ? dto.getCustomerId() : "null")));

                // Check if customer already has an active rental order
                List<RentalOrder> existingOrders = rentalOrderRepository
                                .findByCustomerIdOrderByOrderDateDesc(customer.getId());
                if (!existingOrders.isEmpty()) {
                        throw new RuntimeException(
                                        "Customer already has a rental order. Please edit the existing order.");
                }

                // Validate stock availability
                for (RentalOrderItemDTO itemDto : dto.getItems()) {
                        InventoryItem invItem = inventoryItemRepository.findById(itemDto.getInventoryItemId())
                                        .orElseThrow(
                                                        () -> new RuntimeException("Inventory item not found: "
                                                                        + (itemDto.getInventoryItemId() != null
                                                                                        ? itemDto.getInventoryItemId()
                                                                                        : "null")));

                        // ATP Calculation:
                        // Real Available = Total Stock - (Sum of (Booked - Returned) for all active
                        // orders)
                        // Note: We use the repository method we just added for Usage to get all active
                        // items
                        List<RentalOrderItem> activeItems = rentalOrderItemRepository
                                        .findActiveUsageByInventoryItem(invItem.getId());

                        int totalCommitted = activeItems.stream()
                                        .mapToInt(i -> i.getBookedQty()
                                                        - (i.getReturnedQty() != null ? i.getReturnedQty() : 0))
                                        .sum();

                        int realAvailable = invItem.getTotalStock() - totalCommitted;

                        if (realAvailable < itemDto.getBookedQty()) {
                                throw new RuntimeException("Insufficient stock for item: " + invItem.getNameEnglish() +
                                                ". Total Stock: " + invItem.getTotalStock() +
                                                ", Committed: " + totalCommitted +
                                                " (Real Available: " + realAvailable + ")" +
                                                ", Requested: " + itemDto.getBookedQty());
                        }
                }

                RentalOrder order = RentalOrder.builder()
                                .orderNumber(generateOrderNumber())
                                .customer(customer)
                                .orderDate(dto.getOrderDate() != null ? dto.getOrderDate() : LocalDate.now())
                                .expectedReturnDate(dto.getExpectedReturnDate())
                                .status(RentalOrder.RentalOrderStatus.BOOKED)
                                .remarks(dto.getRemarks())
                                .build();

                // Add items
                for (RentalOrderItemDTO itemDto : dto.getItems()) {
                        InventoryItem invItem = inventoryItemRepository.findById(itemDto.getInventoryItemId()).get();

                        RentalOrderItem orderItem = RentalOrderItem.builder()
                                        .inventoryItem(invItem)
                                        .bookedQty(itemDto.getBookedQty())
                                        .dispatchedQty(0)
                                        .returnedQty(0)
                                        .build();

                        order.addItem(orderItem);
                }

                order = rentalOrderRepository.save(order);
                log.info("Booking created: orderNumber={}, customerId={}, items={}", order.getOrderNumber(),
                                customer.getId(), order.getItems().size());
                return toDTO(order);
        }

        /**
         * Update an existing rental order.
         * Merges items: updates quantities, adds new items, removes missing items (if
         * not dispatched).
         */
        public RentalOrderDTO updateOrder(Long id, RentalOrderDTO dto) {
                RentalOrder order = rentalOrderRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException(
                                                "Rental order not found: " + (id != null ? id : "null")));

                if (order.getStatus() == RentalOrder.RentalOrderStatus.COMPLETED ||
                                order.getStatus() == RentalOrder.RentalOrderStatus.CANCELLED) {
                        throw new RuntimeException("Cannot update completed or cancelled order");
                }

                // Update header fields
                order.setOrderDate(dto.getOrderDate() != null ? dto.getOrderDate() : order.getOrderDate());
                order.setExpectedReturnDate(dto.getExpectedReturnDate());
                order.setRemarks(dto.getRemarks());

                // Update items
                if (dto.getItems() != null) {
                        // 1. Update existing items and add new ones
                        for (RentalOrderItemDTO itemDto : dto.getItems()) {
                                InventoryItem invItem = inventoryItemRepository.findById(itemDto.getInventoryItemId())
                                                .orElseThrow(() -> new RuntimeException(
                                                                "Inventory item not found: "
                                                                                + (itemDto.getInventoryItemId() != null
                                                                                                ? itemDto.getInventoryItemId()
                                                                                                : "null")));

                                RentalOrderItem existingItem = order.getItems().stream()
                                                .filter(i -> i.getInventoryItem().getId().equals(invItem.getId()))
                                                .findFirst()
                                                .orElse(null);

                                final Long currentOrderId = order.getId();

                                if (existingItem != null) {
                                        // Update existing
                                        if (itemDto.getBookedQty() < existingItem.getDispatchedQty()) {
                                                throw new RuntimeException(
                                                                "Cannot reduce booked quantity below dispatched quantity for item: "
                                                                                + invItem.getNameEnglish());
                                        }

                                        // ATP Check for update:
                                        // 1. Get all active usage
                                        List<RentalOrderItem> activeItems = rentalOrderItemRepository
                                                        .findActiveUsageByInventoryItem(invItem.getId());

                                        // 2. Calculate committed quantity by OTHERS
                                        int committedByOthers = activeItems.stream()
                                                        .filter(i -> !i.getRentalOrder().getId().equals(currentOrderId))
                                                        .mapToInt(i -> i.getBookedQty() - (i.getReturnedQty() != null
                                                                        ? i.getReturnedQty()
                                                                        : 0))
                                                        .sum();

                                        // 3. Real Available for THIS order = Total Stock - CommittedByOthers + (My
                                        // Returned So Far)
                                        // Wait, logic: TotalStock >= CommittedByOthers + MyNewBooked - MyReturned
                                        // So: AvailableForBooking = TotalStock - CommittedByOthers + MyReturned
                                        // Check if MyNewBooked <= AvailableForBooking

                                        int myReturned = existingItem.getReturnedQty() != null
                                                        ? existingItem.getReturnedQty()
                                                        : 0;
                                        // Committed_New = CommittedByOthers + (NewBooked - MyReturned)
                                        // if Committed_New > TotalStock -> Error.

                                        int newCommitted = committedByOthers + (itemDto.getBookedQty() - myReturned);

                                        if (newCommitted > invItem.getTotalStock()) {
                                                throw new RuntimeException("Insufficient stock for item: "
                                                                + invItem.getNameEnglish() +
                                                                ". Total: " + invItem.getTotalStock() +
                                                                ", Others Committed: " + committedByOthers +
                                                                ", You Requested: " + itemDto.getBookedQty() +
                                                                " (Max Allocatable: "
                                                                + (invItem.getTotalStock() - committedByOthers
                                                                                + myReturned)
                                                                + ")");
                                        }

                                        existingItem.setBookedQty(itemDto.getBookedQty());
                                } else {
                                        // Add new item
                                        // ATP Check
                                        List<RentalOrderItem> activeItems = rentalOrderItemRepository
                                                        .findActiveUsageByInventoryItem(invItem.getId());
                                        int committedByOthers = activeItems.stream()
                                                        .filter(i -> !i.getRentalOrder().getId().equals(currentOrderId))
                                                        .mapToInt(i -> i.getBookedQty() - (i.getReturnedQty() != null
                                                                        ? i.getReturnedQty()
                                                                        : 0))
                                                        .sum();

                                        // Since it's a new item in this order, MyReturned = 0.
                                        int newCommitted = committedByOthers + itemDto.getBookedQty();

                                        if (newCommitted > invItem.getTotalStock()) {
                                                throw new RuntimeException("Insufficient stock for item: "
                                                                + invItem.getNameEnglish());
                                        }

                                        RentalOrderItem newItem = RentalOrderItem.builder()
                                                        .inventoryItem(invItem)
                                                        .bookedQty(itemDto.getBookedQty())
                                                        .dispatchedQty(0)
                                                        .returnedQty(0)
                                                        .build();
                                        order.addItem(newItem);
                                }
                        }

                        // 2. Remove missing items
                        List<Long> dtoItemIds = dto.getItems().stream()
                                        .map(RentalOrderItemDTO::getInventoryItemId)
                                        .collect(Collectors.toList());

                        // Collect items to remove first to avoid concurrent modification
                        List<RentalOrderItem> itemsToRemove = order.getItems().stream()
                                        .filter(item -> !dtoItemIds.contains(item.getInventoryItem().getId()))
                                        .collect(Collectors.toList());

                        for (RentalOrderItem item : itemsToRemove) {
                                if (item.getDispatchedQty() > 0) {
                                        throw new RuntimeException(
                                                        "Cannot remove item that has been dispatched: "
                                                                        + item.getInventoryItem().getNameEnglish());
                                }
                                order.removeItem(item);
                        }
                }

                // If this order has a linked bill, mark it as out-of-sync
                if (order.getBill() != null) {
                        order.setBillOutOfSync(true);
                }

                order.setUpdatedAt(java.time.LocalDateTime.now()); // Force Envers revision
                order = rentalOrderRepository.save(order);
                return toDTO(order);
        }

        /**
         * Dispatch items for an order with voucher details.
         */
        public RentalOrderDTO dispatchItems(Long orderId, RentalOrderTransactionDTO transactionDto) {
                log.info("Dispatching items for orderId={}, voucher={}", orderId, transactionDto.getVoucherNumber());
                RentalOrder order = rentalOrderRepository.findById(orderId)
                                .orElseThrow(() -> new RuntimeException("Rental order not found: " + orderId));

                if (order.getStatus() == RentalOrder.RentalOrderStatus.COMPLETED ||
                                order.getStatus() == RentalOrder.RentalOrderStatus.CANCELLED) {
                        throw new RuntimeException("Cannot dispatch items for a completed or cancelled order");
                }

                LocalDate dispatchDate = LocalDate.now();

                // Create Transaction Header
                RentalOrderTransaction transaction = RentalOrderTransaction.builder()
                                .rentalOrder(order)
                                .type(RentalOrderTransaction.TransactionType.DISPATCH)
                                .voucherNumber(transactionDto.getVoucherNumber())
                                .vehicleNumber(transactionDto.getVehicleNumber())
                                .transactionDate(dispatchDate)
                                .build();

                for (RentalOrderItemDTO dispatchDto : transactionDto.getItems()) {
                        if (dispatchDto.getDispatchedQty() == null || dispatchDto.getDispatchedQty() <= 0) {
                                continue;
                        }

                        RentalOrderItem orderItem = order.getItems().stream()
                                        .filter(i -> i.getInventoryItem().getId()
                                                        .equals(dispatchDto.getInventoryItemId()))
                                        .findFirst()
                                        .orElseThrow(
                                                        () -> new RuntimeException("Item not found in order: "
                                                                        + dispatchDto.getInventoryItemId()));

                        int qtyToDispatch = dispatchDto.getDispatchedQty();
                        int remainingToDispatch = orderItem.getBookedQty() - orderItem.getDispatchedQty();

                        if (qtyToDispatch > remainingToDispatch) {
                                throw new RuntimeException("Cannot dispatch more than booked quantity for item: "
                                                + orderItem.getInventoryItem().getNameEnglish());
                        }

                        // Check available stock
                        InventoryItem invItem = orderItem.getInventoryItem();
                        if (invItem.getAvailableStock() < qtyToDispatch) {
                                throw new RuntimeException(
                                                "Insufficient available stock for: " + invItem.getNameEnglish());
                        }

                        // Update inventory available stock
                        invItem.setAvailableStock(invItem.getAvailableStock() - qtyToDispatch);
                        inventoryItemRepository.save(invItem);

                        // Update order item aggregate
                        orderItem.setDispatchedQty(orderItem.getDispatchedQty() + qtyToDispatch);
                        orderItem.setDispatchDate(dispatchDate);

                        // Add Transaction Item
                        RentalOrderTransactionItem transItem = RentalOrderTransactionItem.builder()
                                        .inventoryItem(invItem)
                                        .quantity(qtyToDispatch)
                                        .build();
                        transaction.addItem(transItem);
                }

                rentalOrderTransactionRepository.save(transaction);

                order.setDispatchDate(dispatchDate);
                order.setStatus(RentalOrder.RentalOrderStatus.DISPATCHED);
                order.setUpdatedAt(java.time.LocalDateTime.now()); // Force Envers revision
                order = rentalOrderRepository.save(order);

                return toDTO(order);
        }

        /**
         * Receive (return) items from customer with voucher details.
         */
        public RentalOrderDTO receiveItems(Long orderId, RentalOrderTransactionDTO transactionDto) {
                log.info("Receiving items for orderId={}, voucher={}", orderId, transactionDto.getVoucherNumber());
                RentalOrder order = rentalOrderRepository.findById(orderId)
                                .orElseThrow(() -> new RuntimeException("Rental order not found: " + orderId));

                if (order.getStatus() == RentalOrder.RentalOrderStatus.COMPLETED ||
                                order.getStatus() == RentalOrder.RentalOrderStatus.CANCELLED ||
                                order.getStatus() == RentalOrder.RentalOrderStatus.BOOKED) {
                        throw new RuntimeException("Cannot receive items for order in status: " + order.getStatus());
                }

                LocalDate returnDate = LocalDate.now();

                // Create Transaction Header
                RentalOrderTransaction transaction = RentalOrderTransaction.builder()
                                .rentalOrder(order)
                                .type(RentalOrderTransaction.TransactionType.RETURN)
                                .voucherNumber(transactionDto.getVoucherNumber())
                                .vehicleNumber(transactionDto.getVehicleNumber())
                                .transactionDate(returnDate)
                                .build();

                for (RentalOrderItemDTO returnDto : transactionDto.getItems()) {
                        if (returnDto.getReturnedQty() == null || returnDto.getReturnedQty() <= 0) {
                                continue;
                        }

                        RentalOrderItem orderItem = order.getItems().stream()
                                        .filter(i -> i.getInventoryItem().getId()
                                                        .equals(returnDto.getInventoryItemId()))
                                        .findFirst()
                                        .orElseThrow(
                                                        () -> new RuntimeException("Item not found in order: "
                                                                        + returnDto.getInventoryItemId()));

                        int qtyToReturn = returnDto.getReturnedQty();
                        int outstanding = orderItem.getDispatchedQty() - orderItem.getReturnedQty();

                        if (qtyToReturn > outstanding) {
                                throw new RuntimeException("Cannot return more than outstanding quantity for item: "
                                                + orderItem.getInventoryItem().getNameEnglish());
                        }

                        // Update inventory available stock
                        InventoryItem invItem = orderItem.getInventoryItem();
                        invItem.setAvailableStock(invItem.getAvailableStock() + qtyToReturn);
                        inventoryItemRepository.save(invItem);

                        // Update order item aggregate
                        orderItem.setReturnedQty(orderItem.getReturnedQty() + qtyToReturn);
                        orderItem.setReturnDate(returnDate);

                        // Add Transaction Item
                        RentalOrderTransactionItem transItem = RentalOrderTransactionItem.builder()
                                        .inventoryItem(invItem)
                                        .quantity(qtyToReturn)
                                        .build();
                        transaction.addItem(transItem);
                }

                rentalOrderTransactionRepository.save(transaction);

                // Check if all items are returned
                boolean allReturned = true;
                for (RentalOrderItem item : order.getItems()) {
                        if (item.getDispatchedQty() > item.getReturnedQty()) {
                                allReturned = false;
                                break;
                        }
                }

                order.setActualReturnDate(returnDate);
                order.setStatus(allReturned ? RentalOrder.RentalOrderStatus.RETURNED
                                : RentalOrder.RentalOrderStatus.PARTIALLY_RETURNED);
                order.setUpdatedAt(java.time.LocalDateTime.now()); // Force Envers revision
                order = rentalOrderRepository.save(order);

                log.info("Receive complete for orderId={}, status={}", orderId, order.getStatus());
                return toDTO(order);
        }

        /**
         * Get unreturned items for a customer (for billing warning).
         */
        public List<RentalOrderItemDTO> getUnreturnedItemsByCustomer(Long customerId) {
                return rentalOrderItemRepository.findUnreturnedItemsByCustomer(customerId).stream()
                                .map(this::toItemDTO)
                                .collect(Collectors.toList());
        }

        /**
         * Get orders with unreturned items for a customer.
         */
        public List<RentalOrderDTO> getUnreturnedOrdersByCustomer(Long customerId) {
                return rentalOrderRepository.findUnreturnedOrdersByCustomer(customerId).stream()
                                .map(this::toDTO)
                                .collect(Collectors.toList());
        }

        private synchronized String generateOrderNumber() {
                String prefix = "RO-" + Year.now().getValue() + "-";

                return rentalOrderRepository.findFirstByOrderNumberStartingWithOrderByIdDesc(prefix)
                                .map(lastOrder -> {
                                        try {
                                                String numPart = lastOrder.getOrderNumber().substring(prefix.length());
                                                int nextNum = Integer.parseInt(numPart) + 1;
                                                return prefix + String.format("%04d", nextNum);
                                        } catch (NumberFormatException | StringIndexOutOfBoundsException e) {
                                                return prefix + "0001"; // Fallback
                                        }
                                })
                                .orElse(prefix + "0001");
        }

        private RentalOrderDTO toDTO(RentalOrder order) {
                return RentalOrderDTO.builder()
                                .id(order.getId())
                                .orderNumber(order.getOrderNumber())
                                .customerId(order.getCustomer().getId())
                                .customerName(order.getCustomer().getName())
                                .customerMobile(order.getCustomer().getMobile())
                                .customerPalNumbers(new java.util.ArrayList<>(order.getCustomer().getPalNumbers()))
                                .orderDate(order.getOrderDate())
                                .dispatchDate(order.getDispatchDate())
                                .expectedReturnDate(order.getExpectedReturnDate())
                                .actualReturnDate(order.getActualReturnDate())
                                .status(order.getStatus().name())
                                .billId(order.getBill() != null ? order.getBill().getId() : null)
                                .billOutOfSync(order.isBillOutOfSync())
                                .remarks(order.getRemarks())
                                .items(order.getItems().stream().map(this::toItemDTO).collect(Collectors.toList()))
                                .transactions(rentalOrderTransactionRepository
                                                .findByRentalOrderIdOrderByTransactionDateDesc(order.getId()).stream()
                                                .map(this::toTransactionDTO)
                                                .collect(Collectors.toList()))
                                .build();
        }

        private RentalOrderTransactionDTO toTransactionDTO(RentalOrderTransaction transaction) {
                return RentalOrderTransactionDTO.builder()
                                .id(transaction.getId())
                                .rentalOrderId(transaction.getRentalOrder().getId())
                                .type(transaction.getType().name())
                                .voucherNumber(transaction.getVoucherNumber())
                                .vehicleNumber(transaction.getVehicleNumber())
                                .transactionDate(transaction.getTransactionDate())
                                .items(transaction.getItems().stream().map(item -> RentalOrderItemDTO.builder()
                                                .inventoryItemId(item.getInventoryItem().getId())
                                                .itemNameGujarati(item.getInventoryItem().getNameGujarati())
                                                .itemNameEnglish(item.getInventoryItem().getNameEnglish())
                                                .bookedQty(item.getQuantity()) // Reusing bookedQty field for
                                                                               // transaction quantity
                                                .build()).collect(Collectors.toList()))
                                .build();
        }

        private RentalOrderItemDTO toItemDTO(RentalOrderItem item) {
                return RentalOrderItemDTO.builder()
                                .id(item.getId())
                                .inventoryItemId(item.getInventoryItem().getId())
                                .itemNameGujarati(item.getInventoryItem().getNameGujarati())
                                .itemNameEnglish(item.getInventoryItem().getNameEnglish())
                                .bookedQty(item.getBookedQty())
                                .dispatchedQty(item.getDispatchedQty())
                                .returnedQty(item.getReturnedQty())
                                .outstandingQty(item.getOutstandingQty())
                                .dispatchDate(item.getDispatchDate())
                                .returnDate(item.getReturnDate())
                                .build();
        }

        /**
         * Delete a rental order.
         * Only allowed if status is BOOKED or CANCELLED.
         */
        public void deleteOrder(Long id) {
                RentalOrder order = rentalOrderRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Rental order not found: " + id));

                if (order.getBill() != null) {
                        throw new RuntimeException(
                                        "Cannot delete order because a bill has already been generated. Delete the bill first.");
                }

                boolean anyDispatched = order.getItems().stream()
                                .anyMatch(item -> item.getDispatchedQty() != null && item.getDispatchedQty() > 0);
                if (anyDispatched) {
                        throw new RuntimeException(
                                        "Cannot delete order because items were dispatched. Please use 'Cancel' for record keeping.");
                }

                log.warn("Deleting rental order id={}, orderNumber={}", id, order.getOrderNumber());
                rentalOrderRepository.delete(order);
        }

        /**
         * Cancel a rental order.
         * Only allowed if status is BOOKED.
         */
        public RentalOrderDTO cancelOrder(Long id) {
                RentalOrder order = rentalOrderRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Rental order not found: " + id));

                // Check if bill is generated
                if (order.getBill() != null) {
                        throw new RuntimeException("Cannot cancel booking because a bill has already been generated.");
                }

                // Check if any items have been dispatched
                boolean anyDispatched = order.getItems().stream()
                                .anyMatch(item -> item.getDispatchedQty() != null && item.getDispatchedQty() > 0);
                if (anyDispatched) {
                        throw new RuntimeException("Cannot cancel booking because items have already been dispatched.");
                }

                if (order.getStatus() != RentalOrder.RentalOrderStatus.BOOKED) {
                        throw new RuntimeException(
                                        "Cannot cancel order with status: " + order.getStatus()
                                                        + ". Only BOOKED orders can be cancelled.");
                }

                order.setStatus(RentalOrder.RentalOrderStatus.CANCELLED);
                order = rentalOrderRepository.save(order);
                log.info("Rental order cancelled: orderNumber={}", order.getOrderNumber());
                return toDTO(order);
        }

        public List<com.mandap.dto.RentalOrderAuditDTO> getRentalOrderAuditHistory(Long id) {
                if (id == null)
                        return new java.util.ArrayList<>();

                org.springframework.data.history.Revisions<Integer, RentalOrder> revisions = rentalOrderRepository
                                .findRevisions(id);
                List<com.mandap.dto.RentalOrderAuditDTO> auditList = new java.util.ArrayList<>();
                RentalOrder previousState = null;

                for (org.springframework.data.history.Revision<Integer, RentalOrder> revision : revisions) {
                        RentalOrder currentState = revision.getEntity();
                        java.util.Map<String, com.mandap.dto.FieldChangeDTO> changes = new java.util.HashMap<>();

                        if (previousState == null) {
                                boolean isInsert = revision.getMetadata()
                                                .getRevisionType() == org.springframework.data.history.RevisionMetadata.RevisionType.INSERT;
                                if (isInsert) {
                                        changes.put("Status", new com.mandap.dto.FieldChangeDTO(null, "Order created"));
                                } else {
                                        changes.put("Status", new com.mandap.dto.FieldChangeDTO(null,
                                                        "Existing order updated (First tracked change)"));
                                        addOrderHeaderSnapshot(currentState, changes);
                                }
                        } else {
                                findOrderHeaderChanges(previousState, currentState, changes);
                        }

                        // Track items added/removed/updated
                        findOrderItemChanges(previousState, currentState, changes);

                        auditList.add(com.mandap.dto.RentalOrderAuditDTO.builder()
                                        .revisionNumber(revision.getRequiredRevisionNumber())
                                        .revisionDate(java.time.LocalDateTime.ofInstant(
                                                        revision.getRequiredRevisionInstant(),
                                                        java.time.ZoneId.systemDefault()))
                                        .action(revision.getMetadata()
                                                        .getRevisionType() == org.springframework.data.history.RevisionMetadata.RevisionType.INSERT
                                                                        ? "CREATE"
                                                                        : "UPDATE")
                                        .changedBy(((com.mandap.entity.AuditRevisionEntity) revision.getMetadata()
                                                        .getDelegate()).getUsername())
                                        .changes(changes)
                                        .entity(toDTO(currentState))
                                        .build());

                        previousState = currentState;
                }

                java.util.Collections.reverse(auditList);
                return auditList;
        }

        private void addOrderHeaderSnapshot(RentalOrder order,
                        java.util.Map<String, com.mandap.dto.FieldChangeDTO> changes) {
                changes.put("Order Date", new com.mandap.dto.FieldChangeDTO(null, order.getOrderDate()));
                changes.put("Expected Return", new com.mandap.dto.FieldChangeDTO(null, order.getExpectedReturnDate()));
                changes.put("Status", new com.mandap.dto.FieldChangeDTO(null, order.getStatus().name()));
                changes.put("Remarks", new com.mandap.dto.FieldChangeDTO(null, order.getRemarks()));
        }

        private void findOrderHeaderChanges(RentalOrder oldOrder, RentalOrder newOrder,
                        java.util.Map<String, com.mandap.dto.FieldChangeDTO> changes) {
                if (!java.util.Objects.equals(oldOrder.getOrderDate(), newOrder.getOrderDate())) {
                        changes.put("Order Date", new com.mandap.dto.FieldChangeDTO(oldOrder.getOrderDate(),
                                        newOrder.getOrderDate()));
                }
                if (!java.util.Objects.equals(oldOrder.getExpectedReturnDate(), newOrder.getExpectedReturnDate())) {
                        changes.put("Expected Return",
                                        new com.mandap.dto.FieldChangeDTO(oldOrder.getExpectedReturnDate(),
                                                        newOrder.getExpectedReturnDate()));
                }
                if (!java.util.Objects.equals(oldOrder.getStatus(), newOrder.getStatus())) {
                        changes.put("Status", new com.mandap.dto.FieldChangeDTO(oldOrder.getStatus().name(),
                                        newOrder.getStatus().name()));
                }
                if (!java.util.Objects.equals(oldOrder.getRemarks(), newOrder.getRemarks())) {
                        changes.put("Remarks", new com.mandap.dto.FieldChangeDTO(oldOrder.getRemarks(),
                                        newOrder.getRemarks()));
                }
        }

        private void findOrderItemChanges(RentalOrder oldOrder, RentalOrder newOrder,
                        java.util.Map<String, com.mandap.dto.FieldChangeDTO> changes) {
                java.util.Map<Long, RentalOrderItem> oldItems = oldOrder == null ? new java.util.HashMap<>()
                                : oldOrder.getItems().stream()
                                                .collect(java.util.stream.Collectors.toMap(
                                                                i -> i.getInventoryItem().getId(), i -> i));

                java.util.Map<Long, RentalOrderItem> newItems = newOrder.getItems().stream()
                                .collect(java.util.stream.Collectors.toMap(i -> i.getInventoryItem().getId(), i -> i));

                // Added items
                for (java.util.Map.Entry<Long, RentalOrderItem> entry : newItems.entrySet()) {
                        RentalOrderItem newItem = entry.getValue();
                        RentalOrderItem oldItem = oldItems.get(entry.getKey());

                        if (oldItem == null) {
                                changes.put("Item Added: " + newItem.getInventoryItem().getNameEnglish(),
                                                new com.mandap.dto.FieldChangeDTO(null,
                                                                "Booked: " + newItem.getBookedQty()));
                        } else {
                                // Check for quantity changes
                                if (!java.util.Objects.equals(oldItem.getBookedQty(), newItem.getBookedQty())) {
                                        changes.put("Qty Changed: " + newItem.getInventoryItem().getNameEnglish(),
                                                        new com.mandap.dto.FieldChangeDTO(oldItem.getBookedQty(),
                                                                        newItem.getBookedQty()));
                                }
                                if (!java.util.Objects.equals(oldItem.getDispatchedQty(), newItem.getDispatchedQty())) {
                                        changes.put("Disp Qty: " + newItem.getInventoryItem().getNameEnglish(),
                                                        new com.mandap.dto.FieldChangeDTO(oldItem.getDispatchedQty(),
                                                                        newItem.getDispatchedQty()));
                                }
                                if (!java.util.Objects.equals(oldItem.getReturnedQty(), newItem.getReturnedQty())) {
                                        changes.put("Ret Qty: " + newItem.getInventoryItem().getNameEnglish(),
                                                        new com.mandap.dto.FieldChangeDTO(oldItem.getReturnedQty(),
                                                                        newItem.getReturnedQty()));
                                }
                        }
                }

                // Removed items
                if (oldOrder != null) {
                        for (java.util.Map.Entry<Long, RentalOrderItem> entry : oldItems.entrySet()) {
                                if (!newItems.containsKey(entry.getKey())) {
                                        changes.put("Item Removed: "
                                                        + entry.getValue().getInventoryItem().getNameEnglish(),
                                                        new com.mandap.dto.FieldChangeDTO(
                                                                        entry.getValue().getBookedQty(),
                                                                        null));
                                }
                        }
                }
        }
}
