package com.mandap.service;

import com.mandap.dto.RentalOrderDTO;
import com.mandap.dto.RentalOrderItemDTO;
import com.mandap.entity.*;
import com.mandap.repository.*;
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
@Service
@Transactional
public class RentalOrderService {

    @Autowired
    private RentalOrderRepository rentalOrderRepository;

    @Autowired
    private RentalOrderItemRepository rentalOrderItemRepository;

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
                .orElseThrow(() -> new RuntimeException("Rental order not found: " + id));
        return toDTO(order);
    }

    /**
     * Create a new booking (rental order).
     * This reserves items but does not affect available stock yet.
     */
    public RentalOrderDTO createBooking(RentalOrderDTO dto) {
        Customer customer = customerRepository.findById(dto.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Customer not found: " + dto.getCustomerId()));

        // Check if customer already has an active rental order
        List<RentalOrder> existingOrders = rentalOrderRepository.findByCustomerIdOrderByOrderDateDesc(customer.getId());
        if (!existingOrders.isEmpty()) {
            throw new RuntimeException("Customer already has a rental order. Please edit the existing order.");
        }

        // Validate stock availability
        for (RentalOrderItemDTO itemDto : dto.getItems()) {
            InventoryItem invItem = inventoryItemRepository.findById(itemDto.getInventoryItemId())
                    .orElseThrow(
                            () -> new RuntimeException("Inventory item not found: " + itemDto.getInventoryItemId()));

            // ATP Calculation:
            // Real Available = Total Stock - (Sum of (Booked - Returned) for all active
            // orders)
            // Note: We use the repository method we just added for Usage to get all active
            // items
            List<RentalOrderItem> activeItems = rentalOrderItemRepository
                    .findActiveUsageByInventoryItem(invItem.getId());

            int totalCommitted = activeItems.stream()
                    .mapToInt(i -> i.getBookedQty() - (i.getReturnedQty() != null ? i.getReturnedQty() : 0))
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
        return toDTO(order);
    }

    /**
     * Update an existing rental order.
     * Merges items: updates quantities, adds new items, removes missing items (if
     * not dispatched).
     */
    public RentalOrderDTO updateOrder(Long id, RentalOrderDTO dto) {
        RentalOrder order = rentalOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rental order not found: " + id));

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
                                "Inventory item not found: " + itemDto.getInventoryItemId()));

                RentalOrderItem existingItem = order.getItems().stream()
                        .filter(i -> i.getInventoryItem().getId().equals(invItem.getId()))
                        .findFirst()
                        .orElse(null);

                final Long currentOrderId = order.getId();

                if (existingItem != null) {
                    // Update existing
                    if (itemDto.getBookedQty() < existingItem.getDispatchedQty()) {
                        throw new RuntimeException("Cannot reduce booked quantity below dispatched quantity for item: "
                                + invItem.getNameEnglish());
                    }

                    // ATP Check for update:
                    // 1. Get all active usage
                    List<RentalOrderItem> activeItems = rentalOrderItemRepository
                            .findActiveUsageByInventoryItem(invItem.getId());

                    // 2. Calculate committed quantity by OTHERS
                    int committedByOthers = activeItems.stream()
                            .filter(i -> !i.getRentalOrder().getId().equals(currentOrderId))
                            .mapToInt(i -> i.getBookedQty() - (i.getReturnedQty() != null ? i.getReturnedQty() : 0))
                            .sum();

                    // 3. Real Available for THIS order = Total Stock - CommittedByOthers + (My
                    // Returned So Far)
                    // Wait, logic: TotalStock >= CommittedByOthers + MyNewBooked - MyReturned
                    // So: AvailableForBooking = TotalStock - CommittedByOthers + MyReturned
                    // Check if MyNewBooked <= AvailableForBooking

                    int myReturned = existingItem.getReturnedQty() != null ? existingItem.getReturnedQty() : 0;
                    int maxBookable = invItem.getTotalStock() - committedByOthers + myReturned; // Actually, strictly
                                                                                                // committedByOthers =
                                                                                                // booked-returned.
                    // Let's stick to base formula:
                    // Committed_New = CommittedByOthers + (NewBooked - MyReturned)
                    // if Committed_New > TotalStock -> Error.

                    int newCommitted = committedByOthers + (itemDto.getBookedQty() - myReturned);

                    if (newCommitted > invItem.getTotalStock()) {
                        throw new RuntimeException("Insufficient stock for item: " + invItem.getNameEnglish() +
                                ". Total: " + invItem.getTotalStock() +
                                ", Others Committed: " + committedByOthers +
                                ", You Requested: " + itemDto.getBookedQty() +
                                " (Max Allocatable: " + (invItem.getTotalStock() - committedByOthers + myReturned)
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
                            .mapToInt(i -> i.getBookedQty() - (i.getReturnedQty() != null ? i.getReturnedQty() : 0))
                            .sum();

                    // Since it's a new item in this order, MyReturned = 0.
                    int newCommitted = committedByOthers + itemDto.getBookedQty();

                    if (newCommitted > invItem.getTotalStock()) {
                        throw new RuntimeException("Insufficient stock for item: " + invItem.getNameEnglish());
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
                            "Cannot remove item that has been dispatched: " + item.getInventoryItem().getNameEnglish());
                }
                order.removeItem(item);
            }
        }

        order = rentalOrderRepository.save(order);
        return toDTO(order);
    }

    /**
     * Dispatch items for an order. Decreases available stock.
     */
    public RentalOrderDTO dispatchItems(Long orderId, List<RentalOrderItemDTO> dispatchItems) {
        RentalOrder order = rentalOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Rental order not found: " + orderId));

        if (order.getStatus() == RentalOrder.RentalOrderStatus.COMPLETED ||
                order.getStatus() == RentalOrder.RentalOrderStatus.CANCELLED) {
            throw new RuntimeException("Cannot dispatch items for a completed or cancelled order");
        }

        LocalDate dispatchDate = LocalDate.now();

        for (RentalOrderItemDTO dispatchDto : dispatchItems) {
            RentalOrderItem orderItem = order.getItems().stream()
                    .filter(i -> i.getInventoryItem().getId().equals(dispatchDto.getInventoryItemId()))
                    .findFirst()
                    .orElseThrow(
                            () -> new RuntimeException("Item not found in order: " + dispatchDto.getInventoryItemId()));

            int qtyToDispatch = dispatchDto.getDispatchedQty();
            int remainingToDispatch = orderItem.getBookedQty() - orderItem.getDispatchedQty();

            if (qtyToDispatch > remainingToDispatch) {
                throw new RuntimeException("Cannot dispatch more than booked quantity");
            }

            // Check available stock
            InventoryItem invItem = orderItem.getInventoryItem();
            if (invItem.getAvailableStock() < qtyToDispatch) {
                throw new RuntimeException("Insufficient available stock for: " + invItem.getNameEnglish());
            }

            // Update inventory available stock
            invItem.setAvailableStock(invItem.getAvailableStock() - qtyToDispatch);
            inventoryItemRepository.save(invItem);

            // Update order item
            orderItem.setDispatchedQty(orderItem.getDispatchedQty() + qtyToDispatch);
            orderItem.setDispatchDate(dispatchDate);
        }

        order.setDispatchDate(dispatchDate);
        order.setStatus(RentalOrder.RentalOrderStatus.DISPATCHED);
        order = rentalOrderRepository.save(order);

        return toDTO(order);
    }

    /**
     * Receive (return) items from customer. Increases available stock.
     */
    public RentalOrderDTO receiveItems(Long orderId, List<RentalOrderItemDTO> returnItems) {
        RentalOrder order = rentalOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Rental order not found: " + orderId));

        if (order.getStatus() == RentalOrder.RentalOrderStatus.COMPLETED ||
                order.getStatus() == RentalOrder.RentalOrderStatus.CANCELLED ||
                order.getStatus() == RentalOrder.RentalOrderStatus.BOOKED) {
            throw new RuntimeException("Cannot receive items for order in status: " + order.getStatus());
        }

        LocalDate returnDate = LocalDate.now();
        boolean allReturned = true;

        for (RentalOrderItemDTO returnDto : returnItems) {
            RentalOrderItem orderItem = order.getItems().stream()
                    .filter(i -> i.getInventoryItem().getId().equals(returnDto.getInventoryItemId()))
                    .findFirst()
                    .orElseThrow(
                            () -> new RuntimeException("Item not found in order: " + returnDto.getInventoryItemId()));

            int qtyToReturn = returnDto.getReturnedQty();
            int outstanding = orderItem.getDispatchedQty() - orderItem.getReturnedQty();

            if (qtyToReturn > outstanding) {
                throw new RuntimeException("Cannot return more than outstanding quantity");
            }

            // Update inventory available stock
            InventoryItem invItem = orderItem.getInventoryItem();
            invItem.setAvailableStock(invItem.getAvailableStock() + qtyToReturn);
            inventoryItemRepository.save(invItem);

            // Update order item
            orderItem.setReturnedQty(orderItem.getReturnedQty() + qtyToReturn);
            orderItem.setReturnDate(returnDate);
        }

        // Check if all items are returned
        for (RentalOrderItem item : order.getItems()) {
            if (item.getDispatchedQty() > item.getReturnedQty()) {
                allReturned = false;
                break;
            }
        }

        order.setActualReturnDate(returnDate);
        order.setStatus(allReturned ? RentalOrder.RentalOrderStatus.RETURNED
                : RentalOrder.RentalOrderStatus.PARTIALLY_RETURNED);
        order = rentalOrderRepository.save(order);

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
                .remarks(order.getRemarks())
                .items(order.getItems().stream().map(this::toItemDTO).collect(Collectors.toList()))
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

        // Validation: Verify no outstanding items
        for (RentalOrderItem item : order.getItems()) {
            int outstanding = item.getDispatchedQty() - (item.getReturnedQty() != null ? item.getReturnedQty() : 0);
            if (outstanding > 0) {
                throw new RuntimeException(
                        "Cannot delete order with outstanding items (" + item.getInventoryItem().getNameEnglish()
                                + "). Please return the items first.");
            }
        }

        rentalOrderRepository.delete(order);
    }

    /**
     * Cancel a rental order.
     * Only allowed if status is BOOKED.
     */
    public RentalOrderDTO cancelOrder(Long id) {
        RentalOrder order = rentalOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rental order not found: " + id));

        if (order.getStatus() != RentalOrder.RentalOrderStatus.BOOKED) {
            throw new RuntimeException(
                    "Cannot cancel order with status: " + order.getStatus() + ". Only BOOKED orders can be cancelled.");
        }

        order.setStatus(RentalOrder.RentalOrderStatus.CANCELLED);
        order = rentalOrderRepository.save(order);
        return toDTO(order);
    }
}
