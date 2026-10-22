package com.interview.backend.repository;

import com.interview.backend.entity.UserNote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserNoteRepository extends JpaRepository<UserNote, Long> {
    List<UserNote> findByUserIdOrderByUpdatedAtDesc(Long userId);
    Optional<UserNote> findByIdAndUserId(Long id, Long userId);
}
