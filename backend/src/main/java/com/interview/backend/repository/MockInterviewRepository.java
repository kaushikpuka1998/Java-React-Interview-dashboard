package com.interview.backend.repository;

import com.interview.backend.entity.MockInterview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface MockInterviewRepository extends JpaRepository<MockInterview, Long> {
    List<MockInterview> findByStatusAndTypeAndCandidateIdNot(String status, String type, Long candidateId);

    List<MockInterview> findByCandidateIdOrInterviewerIdOrderByCreatedAtDesc(Long candidateId, Long interviewerId);

    boolean existsByCandidateIdAndStatusIn(Long candidateId, Collection<String> statuses);
}
