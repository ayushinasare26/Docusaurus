import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export async function getDbConnection() {
    if (!pool) {
        const connectionUri = process.env.DATABASE_URL;

        // Remove prisma connection parameters if present
        const cleanUri = connectionUri?.split('?')[0];

        pool = mysql.createPool({
            uri: cleanUri,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
    }
    return pool.getConnection();
}

export async function query(sql: string, params?: any[]) {
    const connection = await getDbConnection();
    try {
        const [results] = await connection.query(sql, params);
        return results;
    } finally {
        connection.release();
    }
}
