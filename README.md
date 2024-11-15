# PLI Meet2Chat

### API Documentation

### GET `/get-room`

#### Response

```json
{
    "id": "string",
    "userCount": "number",
    "maxUsers": "number",
    "private": "boolean",
    "password": "string | null"
}
```

### GET `/get-room/:id`

#### Response
```json
{
    "id": "string",
    "userCount": "number",
    "maxUsers": "number",
    "private": "boolean",
    "password": "string | null",
    "Sockets": {
        "roomId": "string",
        "username": "string",
        "socketId": "string",
        "createdAt": "Date",
        "updatedAt": "Date",
    }[]
}
```
