package com.nexora.repository;

import com.nexora.entity.ProductEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<ProductEntity, Long> {
    List<ProductEntity> findByCompanyId(String companyId);
    void deleteByCompanyId(String companyId);
}
