// const { faker } = require('@faker-js/faker');
// const mysql = require("mysql2");

// const connection = mysql.createConnection({
//     host:"localhost",
//     user:"root",
//     database:"aushu",
//     password:"ayush1234"
// });

// let getRandomUser = () => {
//   return [
//      faker.string.uuid(),
//      faker.internet.username(),
//      faker.internet.email(),
//      faker.internet.password()
//   ];
// }

// let data = [];

// for (let i = 0; i <= 100; i++){
//     data.push(getRandomUser());
// }

// let q = "insert into customer (id, username, email, password) values (?,?,?,?)";

// try{
//     connection.query(q, data, (err, result) => {
//         if(err) throw err;
//         console.log(result);
//         connection.end(); // Close connection after query completes
//     });
// } catch(err) {
//     console.log(err);
//     connection.end();
// }




// const { faker } = require('@faker-js/faker');
// const mysql = require("mysql2/promise");

// const getRandomUser = () => {
//   return [
//      faker.string.uuid(),
//      faker.internet.username(),
//      faker.internet.email(),
//      faker.internet.password()
//   ];
// }

// const insertData = async () => {
//     let connection;
//     try {
//         connection = await mysql.createConnection({
//             host: "localhost",
//             user: "root",
//             database: "aushu",
//             password: "ayush1234"
//         });
        
//         console.log("✓ Connected to database");

//         let data = [];
//         for (let i = 0; i <= 100; i++){
//             data.push(getRandomUser());
//         }
        
//         console.log("✓ Generated 101 fake users");

//         // Build the VALUES clause dynamically
//         const placeholders = data.map(() => '(?, ?, ?, ?)').join(',');
//         const q = `INSERT INTO customer (id, username, email, password) VALUES ${placeholders}`;
        
//         // Flatten the data array for the query
//         const flatData = data.flat();

//         const [result] = await connection.execute(q, flatData);
        
//         console.log("✓ Query executed successfully");
//         console.log("Rows affected:", result.affectedRows);
        
//         // Wait a moment then verify
//         await new Promise(resolve => setTimeout(resolve, 1000));
        
//         // Verify data was inserted
//         const [rows] = await connection.execute("SELECT COUNT(*) as count FROM customer");
//         console.log("✓ Total rows in customer table NOW:", rows[0].count);
        
//         // Show some inserted data
//         const [sampleRows] = await connection.execute("SELECT * FROM customer ORDER BY id DESC LIMIT 5");
//         console.log("✓ Last 5 rows in table:", sampleRows);
        
//     } catch(err) {
//         console.log("✗ Error:", err.message);
//         console.log("Code:", err.code);
//     } finally {
//         if (connection) {
//             await connection.end();
//             console.log("✓ Connection closed");
//         }
//     }
// }

// insertData();

const { faker } = require('@faker-js/faker');
const mysql = require("mysql2");
const express = require("express");

const app = express();



const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "aushu",
    password: "ayush1234"
});

let getRandomUser = () => {
    return [
        faker.string.uuid(),
        faker.internet.username(),
        faker.internet.email(),
        faker.internet.password()
    ];
}

let data = [];

for (let i = 0; i <= 100; i++){
    data.push(getRandomUser());
}

// Build the VALUES clause dynamically with placeholders
const placeholders = data.map(() => '(?, ?, ?, ?)').join(',');
let q = `INSERT INTO customer (id, username, email, password) VALUES ${placeholders}`;

// Flatten the data array
const flatData = data.flat();

try {
    connection.query(q, flatData, (err, result) => {
        if(err) throw err;
        console.log("✓ Data inserted successfully");
        console.log("Rows affected:", result.affectedRows);
        connection.end(); // Close connection after query completes
    });
} catch(err) {
    console.log("✗ Error:", err.message);
    connection.end();
}
app.listen("8080", ()=>{
    console.log`app is listening on port${port}`
});

