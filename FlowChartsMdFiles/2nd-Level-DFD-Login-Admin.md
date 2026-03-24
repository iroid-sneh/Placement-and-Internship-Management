# 2nd Level Login (Admin) DFD - Placement & Internship Management System

```mermaid
flowchart LR
    Admin([Admin])

    Login((1.0 Login))

    AdminTable[(Admin Table)]

    Admin -- "request access" --> Login
    Login -- "confirm access" --> Admin

    Login -- "request access" --> AdminTable
    AdminTable -- "response access" --> Login
```
