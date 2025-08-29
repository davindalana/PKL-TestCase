const fs = require('fs');
const csv = require('csv-parser');

const inputFile = 'data_alamat.csv';
const outputFile = 'data_alamat.sql';
const tableName = 'data_layanan';

// Pastikan Anda sudah menjalankan 'npm install csv-parser'
const writeStream = fs.createWriteStream(outputFile);
console.log(`Mengubah ${inputFile} menjadi file SQL...`);

fs.createReadStream(inputFile)
    .pipe(csv())
    .on('data', (row) => {
        // Ambil data dari kolom, toleran terhadap nama header yang berbeda
        const serviceNo = row['SERVICE NO'] || row['service_no'];
        const alamat = row['ALAMAT'] || row['alamat'];

        if (serviceNo && alamat) {
            // Menangani tanda kutip (') di dalam alamat agar tidak merusak query
            const escapedAlamat = alamat.replace(/'/g, "''");

            // Membuat SATU perintah INSERT untuk SETIAP baris dan diakhiri semicolon (;)
            const sql = `INSERT INTO ${tableName} (service_no, alamat) VALUES ('${serviceNo}', '${escapedAlamat}');\n`;
            writeStream.write(sql);
        }
    })
    .on('end', () => {
        writeStream.end();
        console.log(`Selesai! File ${outputFile} telah berhasil dibuat dengan format yang benar.`);
    });