package com.interview.backend.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LocationRulesTest {

    @Test
    void acceptsCityInCountryAndNormalisesCountry() {
        var loc = LocationRules.validate("india", "  Bangalore ");
        assertThat(loc.country()).isEqualTo("India");
        assertThat(loc.city()).isEqualTo("Bangalore");
    }

    @Test
    void rejectsCountryThatIsACity() {
        assertThatThrownBy(() -> LocationRules.validate("Bangalore", "India"))
                .hasMessageContaining("not a recognised country");
    }

    @Test
    void rejectsCountryNameEnteredAsCity() {
        assertThatThrownBy(() -> LocationRules.validate("Bangalore", "India"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> LocationRules.validate("India", "Germany"))
                .hasMessageContaining("is a country, not a city");
    }

    @Test
    void requiresBothFields() {
        assertThatThrownBy(() -> LocationRules.validate("", "Pune")).hasMessage("Country is required");
        assertThatThrownBy(() -> LocationRules.validate("India", "  ")).hasMessage("City is required");
        assertThatThrownBy(() -> LocationRules.validate(null, null)).hasMessage("Country is required");
    }

    @Test
    void rejectsNonLetterCities() {
        assertThatThrownBy(() -> LocationRules.validate("India", "12345"))
                .hasMessageContaining("City can only contain letters");
        assertThatThrownBy(() -> LocationRules.validate("India", "<script>"))
                .hasMessageContaining("City can only contain letters");
    }

    @Test
    void aliasesAndCitystatesWork() {
        assertThat(LocationRules.validate("USA", "Austin").country()).isEqualTo("United States");
        assertThat(LocationRules.validate("Singapore", "Singapore").city()).isEqualTo("Singapore");
    }
}
