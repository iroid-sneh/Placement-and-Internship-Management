# 2nd Level Login (Company) DFD - Placement & Internship Management System

```mermaid
flowchart LR
    Company([Company])

    Login((1.0 Login))

    UserTable[(User Table)]

    Company -- "checks credentials" --> Login
    Login -- "confirm access" --> Company

    Login -- "request login" --> UserTable
    UserTable -- "response login" --> Login
```
