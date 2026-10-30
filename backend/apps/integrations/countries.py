"""Conversion nom de pays -> code ISO 3166-1 alpha-2 (attendu par CJ Dropshipping)."""
import unicodedata

# Noms usuels (FR et EN) des pays de livraison les plus courants
COUNTRY_NAMES = {
    'FR': ['france'],
    'BE': ['belgique', 'belgium'],
    'CH': ['suisse', 'switzerland'],
    'LU': ['luxembourg'],
    'MC': ['monaco'],
    'DE': ['allemagne', 'germany', 'deutschland'],
    'ES': ['espagne', 'spain', 'espana'],
    'IT': ['italie', 'italy', 'italia'],
    'PT': ['portugal'],
    'NL': ['pays-bas', 'pays bas', 'netherlands', 'hollande'],
    'AT': ['autriche', 'austria'],
    'IE': ['irlande', 'ireland'],
    'GB': ['royaume-uni', 'royaume uni', 'united kingdom', 'uk', 'angleterre', 'england'],
    'DK': ['danemark', 'denmark'],
    'SE': ['suede', 'sweden'],
    'NO': ['norvege', 'norway'],
    'FI': ['finlande', 'finland'],
    'PL': ['pologne', 'poland'],
    'CZ': ['republique tcheque', 'tchequie', 'czech republic', 'czechia'],
    'GR': ['grece', 'greece'],
    'RO': ['roumanie', 'romania'],
    'HU': ['hongrie', 'hungary'],
    'US': ['etats-unis', 'etats unis', 'usa', 'united states'],
    'CA': ['canada'],
    'MA': ['maroc', 'morocco'],
    'DZ': ['algerie', 'algeria'],
    'TN': ['tunisie', 'tunisia'],
    'SN': ['senegal'],
    'CI': ["cote d'ivoire", 'cote divoire', 'ivory coast'],
    'CM': ['cameroun', 'cameroon'],
    'GA': ['gabon'],
    'CD': ['rdc', 'republique democratique du congo', 'congo-kinshasa'],
    'CG': ['congo', 'congo-brazzaville'],
    'BJ': ['benin'],
    'TG': ['togo'],
    'ML': ['mali'],
    'BF': ['burkina faso'],
    'GN': ['guinee', 'guinea'],
    'MG': ['madagascar'],
    'MU': ['maurice', 'ile maurice', 'mauritius'],
    'RE': ['reunion', 'la reunion'],
    'GP': ['guadeloupe'],
    'MQ': ['martinique'],
    'GF': ['guyane', 'guyane francaise', 'french guiana'],
    'NC': ['nouvelle-caledonie', 'nouvelle caledonie', 'new caledonia'],
    'PF': ['polynesie francaise', 'french polynesia'],
    'AE': ['emirats arabes unis', 'uae', 'united arab emirates'],
    'SA': ['arabie saoudite', 'saudi arabia'],
    'TR': ['turquie', 'turkey', 'turkiye'],
    'CN': ['chine', 'china'],
    'JP': ['japon', 'japan'],
    'AU': ['australie', 'australia'],
    'BR': ['bresil', 'brazil'],
    'MX': ['mexique', 'mexico'],
}


def _normalize(value):
    value = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode()
    return ' '.join(value.lower().replace('’', "'").split())


_LOOKUP = {_normalize(name): code for code, names in COUNTRY_NAMES.items() for name in names}


def to_iso2(value):
    """Retourne le code ISO alpha-2 d'un pays (nom ou code), ou None si inconnu."""
    if not value:
        return None
    value = value.strip()
    if len(value) == 2 and value.isalpha():
        return value.upper()
    return _LOOKUP.get(_normalize(value))
