package com.mandap.repository;

import com.mandap.entity.BillItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BillItemRepository extends JpaRepository<BillItem, Long> {

    @Query("SELECT bi FROM BillItem bi JOIN FETCH bi.item WHERE bi.bill.id = :billId")
    List<BillItem> findByBillId(Long billId);

    void deleteByBillId(Long billId);
}
