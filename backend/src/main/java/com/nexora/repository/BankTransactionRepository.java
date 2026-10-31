package com.nexora.repository;

import com.nexora.entity.BankTransactionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface BankTransactionRepository extends JpaRepository<BankTransactionEntity, Long>, JpaSpecificationExecutor<BankTransactionEntity> {
    List<BankTransactionEntity> findByCompanyId(String companyId);
    List<BankTransactionEntity> findByCompanyIdAndTransactionDateBetween(String companyId, LocalDate startDate, LocalDate endDate);
    long countByCompanyId(String companyId);
    void deleteByCompanyId(String companyId);
}
