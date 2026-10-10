package com.interview.backend.service;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Validates a member's country and city before they're saved.
 *  - country must be a real country (ISO list, case-insensitive, common aliases), stored in its standard name
 *  - city must be letters only and must not be the name of a country (unless it's the same as the country)
 *  - both are required
 */
public final class LocationRules {

    public record Location(String country, String city) {}

    private static final Map<String, String> COUNTRIES = new HashMap<>();   // lowercase name -> ISO code
    private static final Map<String, String> NAME_OF_CODE = new HashMap<>(); // ISO code -> standard name
    private static final Map<String, String> ALIASES = Map.of(
            "usa", "United States", "us", "United States", "united states of america", "United States",
            "uk", "United Kingdom", "great britain", "United Kingdom", "england", "United Kingdom",
            "uae", "United Arab Emirates");

    // Letters plus space, dot, apostrophe, hyphen. Must start with a letter. 2-100 chars.
    private static final Pattern CITY = Pattern.compile("^\\p{L}[\\p{L} .'\\-]{1,99}$");

    static {
        for (String code : Locale.getISOCountries()) {
            String name = new Locale("", code).getDisplayCountry(Locale.ENGLISH);
            COUNTRIES.put(name.toLowerCase(Locale.ROOT), code);
            NAME_OF_CODE.put(code, name);
        }
    }

    private LocationRules() {}

    /** Returns the cleaned location, or throws IllegalArgumentException with a message fit to show the user. */
    public static Location validate(String country, String city) {
        String c = country == null ? "" : country.trim().replaceAll("\\s+", " ");
        String ci = city == null ? "" : city.trim().replaceAll("\\s+", " ");

        if (c.isEmpty()) throw new IllegalArgumentException("Country is required");
        if (ci.isEmpty()) throw new IllegalArgumentException("City is required");

        String code = countryCode(c);
        if (code == null) {
            throw new IllegalArgumentException("\"" + c + "\" is not a recognised country");
        }
        String canonical = NAME_OF_CODE.get(code);

        if (!CITY.matcher(ci).matches()) {
            throw new IllegalArgumentException("City can only contain letters, spaces, '.', ''' and '-'");
        }
        String cityAsCountry = countryCode(ci);
        if (cityAsCountry != null && !cityAsCountry.equals(code)) {
            throw new IllegalArgumentException("\"" + ci + "\" is a country, not a city. Enter the city in the City field");
        }
        return new Location(canonical, ci);
    }

    /** ISO code for a country name or alias, or null. */
    private static String countryCode(String name) {
        String key = name.toLowerCase(Locale.ROOT);
        if (ALIASES.containsKey(key)) return COUNTRIES.get(ALIASES.get(key).toLowerCase(Locale.ROOT));
        return COUNTRIES.get(key);
    }

}
