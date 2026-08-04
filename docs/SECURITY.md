# Security baseline

Palea follows applicable OWASP MASVS principles: least privilege, explicit trust
boundaries, safe storage, secure transport, validated input, and non-sensitive
logging. Client applications never contain backend or AI provider secrets. Future
session tokens must use platform secure storage rather than general preferences.
