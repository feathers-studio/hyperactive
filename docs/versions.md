# Versions

Hyperactive expects a certain version of `@types/web` to be installed. This is because the library is built from the `@types/web` package, and the version of `@types/web` is used to determine the version of the library.

In the future, this may be relaxed, but for now, it is required if you work with Hyperactive on the client side. This decision was made because the library can be used in a server-side context, and the version of `@types/web` is not required in that case. Depending on a global `lib.dom.d.ts` pollutes the global scope and can cause unexpected type errors.

This table shows the version of `@types/web` that Hyperactive expects to be installed.

| Hyperactive Version | @types/web Version |
| ------------------- | ------------------ |
| 2.0.0-beta.6 | 0.0.232 |
| 2.0.0-beta.5 | 0.0.232 |
| 2.0.0-beta.4 | 0.0.232 |
| 2.0.0-beta.3 | 0.0.188 |
| 2.0.0-beta.2 | 0.0.188 |
| 2.0.0-beta.1 | 0.0.188 |