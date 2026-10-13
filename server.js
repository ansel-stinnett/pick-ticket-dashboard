require('dotenv').config();
const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const path = require('path');
const app = express();
app.use(cors());

const config = {
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT, 10),
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: { trustServerCertificate: true, encrypt: true }
};

app.get('/api/pick-tickets', async (req, res) => {
  let pool;
  try {
    pool = await sql.connect(config);
    const result = await pool.request().query(`
      SELECT TOP 1000
  pt.pick_ticket_no,
  pt.order_no,
  pt.date_created,
  pt.picker,
  pt.location_id,
  oh.ship2_name,
  oh.taker,
  oh.po_no,
  oh.terms,
  oh.will_call,
  oh.front_counter,
  oh.promise_date,
  ol.line_count,
  ol.order_value,
  DATEDIFF(hour, pt.date_created, DATEADD(hour, -5, GETDATE())) AS hours_open,
  DATEDIFF(day, pt.date_created, DATEADD(hour, -5, GETDATE())) AS days_open,
  DATEDIFF(day, oh.promise_date, DATEADD(hour, -5, GETDATE())) AS days_past_promise
FROM dbo.oe_pick_ticket pt
LEFT JOIN dbo.oe_hdr oh ON pt.order_no = oh.order_no
LEFT JOIN (
  SELECT order_no,
         COUNT(*) AS line_count,
         SUM(extended_price + ISNULL(sales_tax, 0)) AS order_value
  FROM dbo.oe_line
  WHERE delete_flag = 'N'
    AND qty_on_pick_tickets > 0
  GROUP BY order_no
) ol ON pt.order_no = ol.order_no
WHERE pt.delete_flag = 'N'
  AND pt.invoice_no IS NULL
ORDER BY pt.date_created DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (pool) pool.close();
  }
});

app.use(express.static(path.join(__dirname, 'public')));
app.listen(3000, () => console.log('Running on http://localhost:3000'));