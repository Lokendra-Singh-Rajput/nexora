package com.nexora.repository;

import com.nexora.entity.CustomerEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomerRepository extends JpaRepository<CustomerEntity, Long> {
    List<CustomerEntity> findByCompanyId(String companyId);
    void deleteByCompanyId(String companyId);
}
