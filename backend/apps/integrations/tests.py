from django.test import SimpleTestCase

from .countries import to_iso2


class CountryCodeTests(SimpleTestCase):
    def test_names_and_codes(self):
        self.assertEqual(to_iso2('France'), 'FR')
        self.assertEqual(to_iso2('  côte d’Ivoire '), 'CI')
        self.assertEqual(to_iso2('United Kingdom'), 'GB')
        self.assertEqual(to_iso2('be'), 'BE')

    def test_unknown(self):
        self.assertIsNone(to_iso2('Atlantide'))
        self.assertIsNone(to_iso2(''))
