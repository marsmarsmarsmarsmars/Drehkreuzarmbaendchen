"""Simple collection of German messages used in HTTPException details.

In a larger project this could be replaced by ``gettext`` or a full i18n
framework.  For the current scope a dictionary is sufficient.
"""

MESSAGES = {
    "user_not_found": "Benutzer nicht gefunden",
    "invalid_credentials": "Ungültiger Benutzername oder Passwort",
    "band_already_issued": "Band ist bereits ausgegeben",
    "band_not_issued": "Band ist nicht ausgegeben",
    "band_not_found": "Band nicht gefunden",
    "username_taken": "Benutzername bereits vergeben",
    "band_number_taken": "Band‑Nummer bereits vergeben",
}