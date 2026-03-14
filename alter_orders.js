import { sql, pool } from "./src/database/db.js";

async function alterOrders() {
    try {
        const conn = await pool;
        await conn.request().query(`
            IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'ListID' AND Object_ID = Object_ID(N'Orders'))
            BEGIN
                ALTER TABLE Orders ADD ListID INT NULL;
                ALTER TABLE Orders ADD CONSTRAINT FK_Orders_SharedList FOREIGN KEY (ListID) REFERENCES SharedList(ListID);
                PRINT 'ListID added successfully';
            END
            ELSE
            BEGIN
                PRINT 'ListID already exists';
            END
        `);
        console.log("Migration complete");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        process.exit();
    }
}

alterOrders();
