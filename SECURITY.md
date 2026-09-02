# Security

cizgile sits on the URL-handling path of the applications that use it, so a bug that lets a crafted input produce a slug or URI other than what the specification says can matter for security.

## Reporting

Use GitHub's private vulnerability reporting for this repository (Security tab, "Report a vulnerability"). Do not open a public issue for something exploitable.

Include the input, the output, the output you expected, and the specification section it violates if you know it.

## Scope

In scope: any input that makes `slugify` return something `isSlug` rejects, an ASCII slug that is not an RFC 3986 `segment-nz-nc`, a URI function that accepts or produces something its RFC forbids in a way that could be abused (host confusion, path traversal through dot segments, percent-encoding that changes on the wire), and any pathological input that takes more than linear time.

Out of scope: the transliteration values themselves, which are conventions rather than security boundaries.

## Supported versions

The latest minor release receives fixes.
