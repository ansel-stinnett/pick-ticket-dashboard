# Open Pick Tickets Dashboard

A live warehouse dashboard that displays open pick tickets from a Prophet 21 (P21) ERP system on a wall-mounted TV. Built during a distribution-industry internship to give the warehouse floor a real-time, at-a-glance view of what orders are waiting to be picked, how long they've been open, and which are past their promised ship date.

## What it does

- Pulls open pick tickets **live** from the P21 SQL Server database and auto-refreshes every 10 minutes
- **Color-codes tickets by age** — green (< 4h), yellow (4–8h), red (> 8h) — so overdue work stands out from across the room
- Flags orders **past their promised ship date** and highlights the whole row
- Shows customer, order and PO numbers, ship location, line count, order value, and the rep who took the order
- **Filter by location** and **sort** by age, customer, value, or most-overdue promise date
- **Auto-scrolls** through the full list for unattended TV display, pausing if someone interacts with it

## Tech stack

- **Backend:** Node.js + Express — a small API layer that queries SQL Server and returns JSON
- **Database:** Microsoft SQL Server (Prophet 21 ERP), accessed read-only via the `mssql` package
- **Frontend:** Vanilla HTML/CSS/JavaScript — no framework, single self-contained page
- **Config:** Credentials loaded from environment variables via `dotenv`

## Architecture

```
Browser (dashboard UI)  ->  Express API (/api/pick-tickets)  ->  SQL Server (P21)
```

The browser never touches the database directly. The Express server holds the one database query, joins pick-ticket headers against order and line-item tables to compute each order's value and line count, and returns clean JSON the frontend renders.

## Notable problems solved

- **Timezone handling:** the ERP stores timestamps in UTC while the warehouse runs on Central time; ticket ages and "created" times were off by 5 hours until the offset was handled explicitly.
- **Unit-of-measure inflation:** some products are priced per roll/bulk unit, which caused naive `unit_price x quantity` math to overstate order value by orders of magnitude (a ~$2k order showing as $730k). Fixed by using the ERP's own computed line totals.
- **Defining "open":** worked through which status flags actually represent an unpicked, unshipped ticket in this ERP's data model.

## Setup

1. Clone the repo and install dependencies:

       npm install

2. Copy `.env.example` to `.env` and fill in your own database credentials:

       DB_SERVER=your-database-server.example.com
       DB_PORT=1433
       DB_DATABASE=your_database_name
       DB_USER=your_db_username
       DB_PASSWORD=your_db_password

3. Start the server:

       node server.js

4. Open `http://localhost:3000` in a browser.

## Notes

This is a sanitized version of an internal tool. Database credentials, server details, real location names, and customer data have been removed or genericized. Customer information is only ever read live from the database at runtime and is never stored in the codebase.
