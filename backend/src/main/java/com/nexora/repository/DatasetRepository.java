package com.nexora.repository;

import com.nexora.entity.Dataset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DatasetRepository extends JpaRepository<Dataset, String> {
    List<Dataset> findByCompanyIdOrderByCreatedAtDesc(String companyId);
    Optional<Dataset> findTopByCompanyIdOrderByVersionDesc(String companyId);
    long countByCompanyId(String companyId);
}
