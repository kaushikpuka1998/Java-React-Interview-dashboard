package com.interview.backend.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class UsernameBloomTest {

    @Test
    void neverSaysNoForAnAddedName() {
        UsernameBloom bloom = new UsernameBloom();
        for (int i = 0; i < 1000; i++) bloom.add("user_" + i);
        for (int i = 0; i < 1000; i++) assertThat(bloom.mightContain("user_" + i)).isTrue();
    }

    @Test
    void mostUnknownNamesAreRejectedWithoutTheDatabase() {
        UsernameBloom bloom = new UsernameBloom();
        for (int i = 0; i < 1000; i++) bloom.add("taken_" + i);
        long falsePositives = 0;
        for (int i = 0; i < 10_000; i++) if (bloom.mightContain("free_" + i)) falsePositives++;
        assertThat(falsePositives).isLessThan(200);   // ~0.1% expected at this size
    }

    @Test
    void validatesAndNormalisesUsernames() {
        assertThat(UsernameService.validate("  Kaushik_42 ")).isEqualTo("kaushik_42");
        assertThatThrownBy(() -> UsernameService.validate("ab")).hasMessageContaining("3-30");
        assertThatThrownBy(() -> UsernameService.validate("1abc")).hasMessageContaining("starting with a letter");
        assertThatThrownBy(() -> UsernameService.validate("has space")).hasMessageContaining("3-30");
        assertThatThrownBy(() -> UsernameService.validate("admin")).hasMessageContaining("reserved");
    }
}
