export function getCurrency(countryCode?: string | null): 'usd' | 'eur' {
    if (!countryCode) return 'usd';

    const EU_COUNTRIES = [
        'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
        'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
        'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
    ];

    return EU_COUNTRIES.includes(countryCode.toUpperCase()) ? 'eur' : 'usd';
}
